import json
from datetime import date
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from urllib.parse import urlencode
from uuid import uuid4

from django.conf import settings
from django.core.files.storage import default_storage
from django.core.exceptions import ValidationError
from django.contrib.auth import authenticate
from django.contrib.auth import password_validation
from django.contrib.auth import get_user_model
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .models import (
    Customer,
    DEFAULT_TENURE_MONTHS,
    MONTHLY_INTEREST_RATE,
    UserProfile,
    WorkspaceSettings,
    render_sequence_value,
)
from .demo_accounts import DEMO_LOGIN_ACCOUNTS


MONEY_QUANTIZER = Decimal("0.01")


@csrf_exempt
@require_http_methods(["GET"])
def login_demo_accounts_view(request):
    if not settings.DEBUG:
        return JsonResponse(
            {
                "success": False,
                "message": "Demo login credentials are only available in development.",
            },
            status=404,
        )

    user_model = get_user_model()
    available_accounts = []

    for account in DEMO_LOGIN_ACCOUNTS:
        user = user_model.objects.filter(username__iexact=account["username"], is_active=True).first()

        if user is None:
            continue

        available_accounts.append(
            {
                "label": account["label"],
                "username": user.username,
                "password": account["password"],
            }
        )

    return JsonResponse(
        {
            "success": True,
            "accounts": available_accounts,
        }
    )


@csrf_exempt
@require_http_methods(["POST"])
def login_view(request):
    try:
        payload = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return JsonResponse(
            {
                "success": False,
                "message": "Request body must be valid JSON.",
            },
            status=400,
        )

    username = str(payload.get("username", "")).strip()
    password = str(payload.get("password", ""))

    if not username or not password:
        return JsonResponse(
            {
                "success": False,
                "message": "Username and password are required.",
            },
            status=400,
        )

    user = authenticate(request, username=username, password=password)

    if user is None:
        user_model = get_user_model()
        matched_user = user_model.objects.filter(username__iexact=username).first()
        if matched_user:
            user = authenticate(request, username=matched_user.username, password=password)

    if user is None:
        return JsonResponse(
            {
                "success": False,
                "message": "Invalid username or password.",
            },
            status=401,
        )

    if not user.is_active:
        return JsonResponse(
            {
                "success": False,
                "message": "This account is inactive.",
            },
            status=403,
        )

    return JsonResponse(
        {
            "success": True,
            "message": f"Login successful. Welcome, {user.username}.",
            "username": user.username,
            "display_name": user.first_name or user.username,
        }
    )


def get_authenticated_user_from_request(request):
    username = str(request.headers.get("X-Authenticated-Username", "")).strip()

    if not username:
        return None, JsonResponse(
            {
                "success": False,
                "message": "Authenticated username is required.",
            },
            status=401,
        )

    user_model = get_user_model()
    user = user_model.objects.filter(username__iexact=username).first()

    if user is None:
        return None, JsonResponse(
            {
                "success": False,
                "message": "Authenticated user was not found.",
            },
            status=404,
        )

    if not user.is_active:
        return None, JsonResponse(
            {
                "success": False,
                "message": "This account is inactive.",
            },
            status=403,
        )

    return user, None


def build_profile_display_name(user):
    return user.first_name.strip() or user.username


def build_profile_photo_url(profile, request):
    if not profile.photo:
        return None

    photo_url = request.build_absolute_uri(profile.photo.url)

    try:
        modified_timestamp = int(profile.photo.storage.get_modified_time(profile.photo.name).timestamp())
    except (OSError, ValueError, NotImplementedError):
        return photo_url

    return f"{photo_url}?{urlencode({'v': modified_timestamp})}"


def serialize_profile(user, request):
    profile, _ = UserProfile.objects.get_or_create(user=user)

    return {
        "username": user.username,
        "display_name": build_profile_display_name(user),
        "avatar_initial": build_profile_display_name(user)[:1].upper(),
        "photo_url": build_profile_photo_url(profile, request),
    }


@csrf_exempt
@require_http_methods(["GET", "POST"])
def profile_view(request):
    user, error_response = get_authenticated_user_from_request(request)

    if error_response is not None:
        return error_response

    if request.method == "GET":
        return JsonResponse(
            {
                "success": True,
                "profile": serialize_profile(user, request),
            }
        )

    try:
        payload = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return JsonResponse(
            {
                "success": False,
                "message": "Request body must be valid JSON.",
            },
            status=400,
        )

    display_name = str(payload.get("display_name", "")).strip()

    if not display_name:
        return JsonResponse(
            {
                "success": False,
                "message": "Display name is required.",
                "errors": {"display_name": "Display name is required."},
            },
            status=400,
        )

    user.first_name = display_name
    user.full_clean(exclude=["password"])
    user.save(update_fields=["first_name"])

    return JsonResponse(
        {
            "success": True,
            "message": "Profile name updated successfully.",
            "profile": serialize_profile(user, request),
        }
    )


@csrf_exempt
@require_http_methods(["POST"])
def profile_password_view(request):
    user, error_response = get_authenticated_user_from_request(request)

    if error_response is not None:
        return error_response

    try:
        payload = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return JsonResponse(
            {
                "success": False,
                "message": "Request body must be valid JSON.",
            },
            status=400,
        )

    current_password = str(payload.get("current_password", ""))
    new_password = str(payload.get("new_password", ""))
    confirm_password = str(payload.get("confirm_password", ""))

    if not current_password or not new_password or not confirm_password:
        return JsonResponse(
            {
                "success": False,
                "message": "All password fields are required.",
                "errors": {
                    "current_password": "Current password is required." if not current_password else "",
                    "new_password": "New password is required." if not new_password else "",
                    "confirm_password": "Please confirm the new password." if not confirm_password else "",
                },
            },
            status=400,
        )

    if not user.check_password(current_password):
        return JsonResponse(
            {
                "success": False,
                "message": "Current password is incorrect.",
                "errors": {"current_password": "Current password is incorrect."},
            },
            status=400,
        )

    if new_password != confirm_password:
        return JsonResponse(
            {
                "success": False,
                "message": "New password and confirm password must match.",
                "errors": {"confirm_password": "New password and confirm password must match."},
            },
            status=400,
        )

    try:
        password_validation.validate_password(new_password, user=user)
    except ValidationError as error:
        return JsonResponse(
            {
                "success": False,
                "message": error.messages[0] if error.messages else "Password is not valid.",
                "errors": {"new_password": error.messages[0] if error.messages else "Password is not valid."},
            },
            status=400,
        )

    user.set_password(new_password)
    user.save(update_fields=["password"])

    return JsonResponse(
        {
            "success": True,
            "message": "Password changed successfully.",
        }
    )


@csrf_exempt
@require_http_methods(["POST"])
def profile_photo_view(request):
    user, error_response = get_authenticated_user_from_request(request)

    if error_response is not None:
        return error_response

    photo = request.FILES.get("photo")

    if photo is None:
        return JsonResponse(
            {
                "success": False,
                "message": "Profile photo is required.",
                "errors": {"photo": "Profile photo is required."},
            },
            status=400,
        )

    profile, _ = UserProfile.objects.get_or_create(user=user)
    existing_photo_name = profile.photo.name if profile.photo else None
    profile.photo = photo

    try:
        profile.full_clean()
        profile.save()
    except ValidationError as error:
        return JsonResponse(
            {
                "success": False,
                "message": "Please correct the profile photo.",
                "errors": format_validation_error(error),
            },
            status=400,
        )

    if existing_photo_name and existing_photo_name != profile.photo.name:
        default_storage.delete(existing_photo_name)

    return JsonResponse(
        {
            "success": True,
            "message": "Profile photo updated successfully.",
            "profile": serialize_profile(user, request),
        }
    )


def format_validation_error(error):
    if hasattr(error, "message_dict"):
        return {
            field: messages[0] if isinstance(messages, list) else messages
            for field, messages in error.message_dict.items()
        }

    return {"non_field_errors": error.messages[0] if error.messages else "Invalid request."}


def parse_json_body(request, invalid_message):
    try:
        return json.loads(request.body or "{}"), None
    except json.JSONDecodeError:
        return None, JsonResponse(
            {
                "success": False,
                "message": invalid_message,
            },
            status=400,
        )


def format_currency_amount(value):
    return str(Decimal(value).quantize(MONEY_QUANTIZER, rounding=ROUND_HALF_UP))


def parse_decimal_value(raw_value, field_name, *, required=False, allow_zero=False):
    text_value = str(raw_value if raw_value is not None else "").strip()

    if not text_value:
        if required:
            raise ValidationError({field_name: "This field is required."})
        return None

    try:
        decimal_value = Decimal(text_value)
    except InvalidOperation as error:
        raise ValidationError({field_name: "Enter a valid amount."}) from error

    if decimal_value < 0 or (not allow_zero and decimal_value == 0):
        raise ValidationError(
            {
                field_name: "Amount must be greater than zero." if not allow_zero else "Amount cannot be negative.",
            }
        )

    return decimal_value.quantize(MONEY_QUANTIZER, rounding=ROUND_HALF_UP)


def parse_iso_date(raw_value, field_name, *, required=False):
    text_value = str(raw_value if raw_value is not None else "").strip()

    if not text_value:
        if required:
            raise ValidationError({field_name: "Date is required."})
        return None

    try:
        return date.fromisoformat(text_value)
    except ValueError as error:
        raise ValidationError({field_name: "Enter a valid date."}) from error


def normalize_jewel_entries(raw_entries):
    if raw_entries in (None, ""):
        return []

    if not isinstance(raw_entries, list):
        raise ValidationError({"jewel_entries": "Transactions must be a valid list."})

    normalized_entries = []

    for index, raw_entry in enumerate(raw_entries, start=1):
        if not isinstance(raw_entry, dict):
            raise ValidationError({"jewel_entries": f"Transaction {index} is invalid."})

        amount = parse_decimal_value(raw_entry.get("amount"), f"jewel_entries_{index}_amount", required=True)
        transaction_date = parse_iso_date(raw_entry.get("date"), f"jewel_entries_{index}_date", required=True)
        closures = raw_entry.get("closures") or []
        tenure_date_overrides = raw_entry.get("tenure_date_overrides") or []
        try:
            raw_visible_months = raw_entry.get("visible_months")
            raw_tenure_months = raw_entry.get("tenure_months")
            visible_months = int(
                raw_visible_months
                if raw_visible_months not in (None, "")
                else raw_tenure_months or DEFAULT_TENURE_MONTHS
            )
        except (TypeError, ValueError) as error:
            raise ValidationError({"jewel_entries": f"Transaction {index} month count is invalid."}) from error

        if visible_months < 1:
            visible_months = 1

        if not isinstance(closures, list):
            raise ValidationError({"jewel_entries": f"Transaction {index} closures are invalid."})

        if not isinstance(tenure_date_overrides, list):
            raise ValidationError({"jewel_entries": f"Transaction {index} tenure dates are invalid."})

        normalized_closures = []
        normalized_tenure_date_overrides = []

        for closure_index, closure in enumerate(closures, start=1):
            if not isinstance(closure, dict):
                raise ValidationError(
                    {
                        "jewel_entries": (
                            f"Transaction {index} closure {closure_index} must be a valid record."
                        ),
                    }
                )

            try:
                month = int(closure.get("month"))
            except (TypeError, ValueError) as error:
                raise ValidationError(
                    {
                        "jewel_entries": (
                            f"Transaction {index} closure {closure_index} month is invalid."
                        ),
                    }
                ) from error

            if month < 1:
                raise ValidationError(
                    {
                        "jewel_entries": (
                            f"Transaction {index} closure {closure_index} month must be at least 1."
                        ),
                    }
                )

            if month > visible_months:
                continue

            closure_amount = parse_decimal_value(
                closure.get("amount"),
                f"jewel_entries_{index}_closure_{closure_index}_amount",
                allow_zero=True,
            )
            closure_date = parse_iso_date(
                closure.get("date"),
                f"jewel_entries_{index}_closure_{closure_index}_date",
            )

            if closure_amount is None and closure_date is None:
                continue

            normalized_closures.append(
                {
                    "month": month,
                    "amount": format_currency_amount(closure_amount or Decimal("0")),
                    "date": closure_date.isoformat() if closure_date else "",
                }
            )

        for override_index, override in enumerate(tenure_date_overrides, start=1):
            if not isinstance(override, dict):
                raise ValidationError(
                    {
                        "jewel_entries": (
                            f"Transaction {index} tenure date {override_index} must be a valid record."
                        ),
                    }
                )

            try:
                month = int(override.get("month"))
            except (TypeError, ValueError) as error:
                raise ValidationError(
                    {
                        "jewel_entries": (
                            f"Transaction {index} tenure date {override_index} month is invalid."
                        ),
                    }
                ) from error

            if month < 1:
                raise ValidationError(
                    {
                        "jewel_entries": (
                            f"Transaction {index} tenure date {override_index} month must be at least 1."
                        ),
                    }
                )

            if month > visible_months:
                continue

            tenure_date = parse_iso_date(
                override.get("date"),
                f"jewel_entries_{index}_tenure_date_{override_index}_date",
            )

            if tenure_date is None:
                continue

            normalized_tenure_date_overrides.append(
                {
                    "month": month,
                    "date": tenure_date.isoformat(),
                }
            )

        monthly_interest = (
            amount * MONTHLY_INTEREST_RATE / Decimal("100")
        ).quantize(MONEY_QUANTIZER, rounding=ROUND_HALF_UP)

        paid_amount = sum(
            Decimal(item["amount"]) for item in normalized_closures
        ).quantize(MONEY_QUANTIZER, rounding=ROUND_HALF_UP) if normalized_closures else Decimal("0.00")
        pending_amount = max(amount - paid_amount, Decimal("0.00")).quantize(
            MONEY_QUANTIZER, rounding=ROUND_HALF_UP
        )

        normalized_entries.append(
            {
                "id": str(raw_entry.get("id") or uuid4()),
                "amount": format_currency_amount(amount),
                "date": transaction_date.isoformat(),
                "interest_rate": format_currency_amount(MONTHLY_INTEREST_RATE),
                "monthly_interest": format_currency_amount(monthly_interest),
                "paid_amount": format_currency_amount(paid_amount),
                "pending_amount": format_currency_amount(pending_amount),
                "tenure_months": int(raw_entry.get("tenure_months") or DEFAULT_TENURE_MONTHS),
                "visible_months": visible_months,
                "closures": sorted(normalized_closures, key=lambda closure: closure["month"]),
                "tenure_date_overrides": sorted(
                    normalized_tenure_date_overrides,
                    key=lambda override: override["month"],
                ),
            }
        )

    return normalized_entries


def serialize_workspace_settings(settings_obj):
    return {
        "sno_format": settings_obj.sno_format,
        "ano_format": settings_obj.ano_format,
        "next_sno_number": settings_obj.next_sno_number,
        "next_ano_number": settings_obj.next_ano_number,
        "next_sno_value": render_sequence_value(settings_obj.sno_format, settings_obj.next_sno_number),
        "next_ano_value": render_sequence_value(settings_obj.ano_format, settings_obj.next_ano_number),
        "updated_at": settings_obj.updated_at.isoformat() if settings_obj.updated_at else None,
    }


def serialize_customer(customer, request):
    jewel_entries = normalize_jewel_entries(customer.jewel_entries)
    latest_jewel_entry = jewel_entries[-1] if jewel_entries else None
    total_jewel_amount = sum(Decimal(entry["amount"]) for entry in jewel_entries) if jewel_entries else Decimal("0")

    return {
        "id": customer.id,
        "sno": customer.sno,
        "sno_sequence": customer.sno_sequence,
        "ano": customer.ano,
        "ano_sequence": customer.ano_sequence,
        "full_name": customer.full_name,
        "father_or_husband_name": customer.father_or_husband_name,
        "date_of_birth": customer.date_of_birth.isoformat() if customer.date_of_birth else None,
        "age": customer.age,
        "mobile_number": customer.mobile_number,
        "address": customer.address,
        "occupation": customer.occupation,
        "identity_proof_type": customer.identity_proof_type,
        "identity_proof_label": customer.get_identity_proof_type_display(),
        "identity_proof_name": customer.identity_proof_name,
        "identity_proof_number": customer.identity_proof_number,
        "address_proof_type": customer.address_proof_type,
        "address_proof_label": customer.get_address_proof_type_display(),
        "photo_url": request.build_absolute_uri(customer.photo.url) if customer.photo else None,
        "item_type": customer.item_type,
        "item_type_label": customer.get_item_type_display() if customer.item_type else "",
        "metal_type": customer.metal_type,
        "metal_type_label": customer.get_metal_type_display() if customer.metal_type else "",
        "purity_or_karat": customer.purity_or_karat,
        "weight_grams": str(customer.weight_grams) if customer.weight_grams is not None else "",
        "number_of_stones": customer.number_of_stones if customer.number_of_stones is not None else "",
        "gemstone_type": customer.gemstone_type,
        "gemstone_carat_or_quantity": customer.gemstone_carat_or_quantity,
        "hallmark_or_makers_mark": customer.hallmark_or_makers_mark,
        "remarks": customer.remarks,
        "item_condition": customer.item_condition,
        "item_condition_label": customer.get_item_condition_display() if customer.item_condition else "",
        "jewelry_photo_url": request.build_absolute_uri(customer.jewelry_photo.url) if customer.jewelry_photo else None,
        "jewel_entries": jewel_entries,
        "latest_jewel_entry": latest_jewel_entry,
        "total_jewel_amount": format_currency_amount(total_jewel_amount),
        "created_at": customer.created_at.isoformat(),
    }


def get_post_text(request, field_name, customer=None, default=""):
    if field_name in request.POST:
        return str(request.POST.get(field_name, "")).strip()

    if customer is not None:
        return getattr(customer, field_name)

    return default


def assign_customer_data(request, customer=None):
    instance = customer or Customer()

    age = instance.age if customer is not None else None
    number_of_stones = instance.number_of_stones if customer is not None else None

    if "age" in request.POST:
        raw_age = str(request.POST.get("age", "")).strip()

        if not raw_age:
            age = None
        else:
            try:
                age = int(raw_age)
            except (TypeError, ValueError):
                return None, JsonResponse(
                    {
                        "success": False,
                        "message": "Age must be a valid number.",
                        "errors": {"age": "Age must be a valid number."},
                    },
                    status=400,
                )

    if "number_of_stones" in request.POST:
        raw_stones = str(request.POST.get("number_of_stones", "")).strip()

        if not raw_stones:
            number_of_stones = None
        else:
            try:
                number_of_stones = int(raw_stones)
            except (TypeError, ValueError):
                return None, JsonResponse(
                    {
                        "success": False,
                        "message": "Number of stones must be a valid whole number.",
                        "errors": {"number_of_stones": "Number of stones must be a valid whole number."},
                    },
                    status=400,
                )

    weight_grams = instance.weight_grams if customer is not None else None

    if "weight_grams" in request.POST:
        raw_weight = str(request.POST.get("weight_grams", "")).strip()
        weight_grams = raw_weight or None

    raw_jewel_entries = None

    if "jewel_entries" in request.POST:
        raw_jewel_entries = str(request.POST.get("jewel_entries", "")).strip()

    try:
        jewel_entries = (
            normalize_jewel_entries(json.loads(raw_jewel_entries or "[]"))
            if raw_jewel_entries is not None
            else instance.jewel_entries
        )
    except json.JSONDecodeError:
        return None, JsonResponse(
            {
                "success": False,
                "message": "Transactions must be valid JSON data.",
                "errors": {"jewel_entries": "Transactions must be valid JSON data."},
            },
            status=400,
        )
    except ValidationError as error:
        return None, JsonResponse(
            {
                "success": False,
                "message": "Please correct the transaction details.",
                "errors": format_validation_error(error),
            },
            status=400,
        )

    instance.full_name = get_post_text(request, "full_name", customer)
    instance.sno = get_post_text(request, "sno", customer) or None
    instance.ano = get_post_text(request, "ano", customer) or None
    instance.father_or_husband_name = get_post_text(request, "father_or_husband_name", customer)
    instance.date_of_birth = get_post_text(request, "date_of_birth", customer) or None
    instance.age = age
    instance.mobile_number = get_post_text(request, "mobile_number", customer)
    instance.address = get_post_text(request, "address", customer)
    instance.occupation = get_post_text(request, "occupation", customer)
    instance.identity_proof_type = get_post_text(
        request,
        "identity_proof_type",
        customer,
        default="",
    )
    instance.identity_proof_name = get_post_text(request, "identity_proof_name", customer)
    instance.identity_proof_number = get_post_text(request, "identity_proof_number", customer)
    instance.address_proof_type = get_post_text(request, "address_proof_type", customer)
    instance.item_type = get_post_text(request, "item_type", customer)
    instance.metal_type = get_post_text(request, "metal_type", customer)
    instance.purity_or_karat = get_post_text(request, "purity_or_karat", customer)
    instance.weight_grams = weight_grams
    instance.number_of_stones = number_of_stones
    instance.gemstone_type = get_post_text(request, "gemstone_type", customer)
    instance.gemstone_carat_or_quantity = get_post_text(request, "gemstone_carat_or_quantity", customer)
    instance.hallmark_or_makers_mark = get_post_text(request, "hallmark_or_makers_mark", customer)
    instance.remarks = get_post_text(request, "remarks", customer)
    instance.item_condition = get_post_text(request, "item_condition", customer)
    instance.jewel_entries = jewel_entries

    identity_proof_file = request.FILES.get("identity_proof_file")
    address_proof_file = request.FILES.get("address_proof_file")
    photo = request.FILES.get("photo")
    jewelry_photo = request.FILES.get("jewelry_photo")

    if identity_proof_file is not None:
        instance.identity_proof_file = identity_proof_file

    if address_proof_file is not None:
        instance.address_proof_file = address_proof_file

    if photo is not None:
        instance.photo = photo

    if jewelry_photo is not None:
        instance.jewelry_photo = jewelry_photo

    return instance, None


@csrf_exempt
@require_http_methods(["GET", "POST"])
def workspace_settings_view(request):
    workspace_settings = WorkspaceSettings.get_solo()

    if request.method == "GET":
        return JsonResponse(
            {
                "success": True,
                "settings": serialize_workspace_settings(workspace_settings),
            }
        )

    payload, error_response = parse_json_body(request, "Request body must be valid JSON.")

    if error_response is not None:
        return error_response

    try:
        next_sno_number = int(payload.get("next_sno_number"))
        next_ano_number = int(payload.get("next_ano_number"))
    except (TypeError, ValueError):
        return JsonResponse(
            {
                "success": False,
                "message": "Starting numbers must be valid whole numbers.",
                "errors": {
                    "next_sno_number": "Enter a valid starting SNO number.",
                    "next_ano_number": "Enter a valid starting ANO number.",
                },
            },
            status=400,
        )

    if next_sno_number < 1 or next_ano_number < 1:
        return JsonResponse(
            {
                "success": False,
                "message": "Starting numbers must be at least 1.",
                "errors": {
                    "next_sno_number": "Starting SNO number must be at least 1.",
                    "next_ano_number": "Starting ANO number must be at least 1.",
                },
            },
            status=400,
        )

    workspace_settings.sno_format = str(payload.get("sno_format", "")).strip()
    workspace_settings.ano_format = str(payload.get("ano_format", "")).strip()
    workspace_settings.next_sno_number = next_sno_number
    workspace_settings.next_ano_number = next_ano_number

    try:
        workspace_settings.full_clean()
        workspace_settings.save()
    except ValidationError as error:
        return JsonResponse(
            {
                "success": False,
                "message": "Please correct the settings values.",
                "errors": format_validation_error(error),
            },
            status=400,
        )

    return JsonResponse(
        {
            "success": True,
            "message": "Settings updated successfully.",
            "settings": serialize_workspace_settings(workspace_settings),
        }
    )
@csrf_exempt
@require_http_methods(["GET", "POST"])
def create_customer_view(request):
    if request.method == "GET":
        customers = [serialize_customer(customer, request) for customer in Customer.objects.all()]
        return JsonResponse(
            {
                "success": True,
                "customers": customers,
            }
        )

    customer, error_response = assign_customer_data(request)

    if error_response is not None:
        return error_response

    try:
        with transaction.atomic():
            customer.full_clean()
            customer.save()
    except ValidationError as error:
        return JsonResponse(
            {
                "success": False,
                "message": "Please correct the customer form errors.",
                "errors": format_validation_error(error),
            },
            status=400,
        )

    return JsonResponse(
        {
            "success": True,
            "message": "Customer saved successfully.",
            "customer_id": customer.id,
            "customer": serialize_customer(customer, request),
        },
        status=201,
    )


@csrf_exempt
@require_http_methods(["GET", "POST", "DELETE"])
def customer_detail_view(request, customer_id):
    customer = get_object_or_404(Customer, pk=customer_id)

    if request.method == "GET":
        return JsonResponse(
            {
                "success": True,
                "customer": serialize_customer(customer, request),
            }
        )

    if request.method == "DELETE":
        file_names = [
            customer.identity_proof_file.name if customer.identity_proof_file else None,
            customer.address_proof_file.name if customer.address_proof_file else None,
            customer.photo.name if customer.photo else None,
            customer.jewelry_photo.name if customer.jewelry_photo else None,
        ]
        customer.delete()

        for file_name in file_names:
            if file_name:
                default_storage.delete(file_name)

        return JsonResponse(
            {
                "success": True,
                "message": "Customer deleted successfully.",
            }
        )

    if request.content_type and request.content_type.startswith("application/json"):
        payload, error_response = parse_json_body(request, "Request body must be valid JSON.")

        if error_response is not None:
            return error_response

        try:
            customer.jewel_entries = normalize_jewel_entries(payload.get("jewel_entries"))
            customer.save(update_fields=["jewel_entries"])
        except ValidationError as error:
            return JsonResponse(
                {
                    "success": False,
                    "message": "Please correct the transaction details.",
                    "errors": format_validation_error(error),
                },
                status=400,
            )

        return JsonResponse(
            {
                "success": True,
                "message": "Transactions updated successfully.",
                "customer": serialize_customer(customer, request),
            }
        )

    customer, error_response = assign_customer_data(request, customer=customer)

    if error_response is not None:
        return error_response

    try:
        with transaction.atomic():
            customer.full_clean()
            customer.save()
    except ValidationError as error:
        return JsonResponse(
            {
                "success": False,
                "message": "Please correct the customer form errors.",
                "errors": format_validation_error(error),
            },
            status=400,
        )

    return JsonResponse(
        {
            "success": True,
            "message": "Customer updated successfully.",
            "customer": serialize_customer(customer, request),
        }
    )
