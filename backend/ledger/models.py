import re
from datetime import date
from decimal import Decimal

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator, RegexValidator
from django.db import models, transaction


MAX_PHOTO_SIZE_BYTES = 1024 * 1024
DEFAULT_SNO_FORMAT = "SNO-{number:04}"
DEFAULT_ANO_FORMAT = "ANO-{number:04}"
MONTHLY_INTEREST_RATE = Decimal("2.5")
DEFAULT_TENURE_MONTHS = 12
SEQUENCE_TOKEN_PATTERN = re.compile(r"\{number(?::(\d+))?\}")


def validate_photo_size(file_obj):
    if file_obj.size > MAX_PHOTO_SIZE_BYTES:
        raise ValidationError("Photo size must be under 1 MB.")


def validate_sequence_format(value):
    if not value or not SEQUENCE_TOKEN_PATTERN.search(value):
        raise ValidationError("Format must include {number} or {number:04}.")


def render_sequence_value(format_string, number):
    match = SEQUENCE_TOKEN_PATTERN.search(format_string)

    if match is None:
        raise ValidationError("Format must include {number} or {number:04}.")

    padding = int(match.group(1)) if match.group(1) else 0
    rendered_number = str(number).zfill(padding)
    return SEQUENCE_TOKEN_PATTERN.sub(rendered_number, format_string, count=1)


class UserProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profile",
    )
    photo = models.FileField(
        upload_to="profiles/photos/",
        validators=[
            FileExtensionValidator(
                allowed_extensions=["jpg", "jpeg", "png", "webp"],
            ),
            validate_photo_size,
        ],
        blank=True,
        null=True,
    )

    def __str__(self):
        return f"{self.user.username} profile"


class WorkspaceSettings(models.Model):
    sno_format = models.CharField(
        max_length=80,
        default=DEFAULT_SNO_FORMAT,
        validators=[validate_sequence_format],
    )
    ano_format = models.CharField(
        max_length=80,
        default=DEFAULT_ANO_FORMAT,
        validators=[validate_sequence_format],
    )
    next_sno_number = models.PositiveIntegerField(default=1)
    next_ano_number = models.PositiveIntegerField(default=1)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Workspace Settings"
        verbose_name_plural = "Workspace Settings"

    def __str__(self):
        return "Workspace Settings"

    @classmethod
    def get_solo(cls):
        settings_obj, _ = cls.objects.get_or_create(
            pk=1,
            defaults={
                "sno_format": DEFAULT_SNO_FORMAT,
                "ano_format": DEFAULT_ANO_FORMAT,
                "next_sno_number": 1,
                "next_ano_number": 1,
            },
        )
        return settings_obj

    @classmethod
    def get_solo_for_update(cls):
        settings_obj, _ = cls.objects.select_for_update().get_or_create(
            pk=1,
            defaults={
                "sno_format": DEFAULT_SNO_FORMAT,
                "ano_format": DEFAULT_ANO_FORMAT,
                "next_sno_number": 1,
                "next_ano_number": 1,
            },
        )
        return settings_obj


class Customer(models.Model):
    IDENTITY_PROOF_AADHAAR = "aadhaar_card"
    IDENTITY_PROOF_VOTER = "voter_id"
    IDENTITY_PROOF_LICENSE = "driving_license"
    IDENTITY_PROOF_PASSPORT = "passport"

    ADDRESS_PROOF_AADHAAR_VOTER = "aadhaar_voter_id"
    ADDRESS_PROOF_UTILITY = "eb_water_bill"
    ADDRESS_PROOF_RENTAL = "rental_agreement"

    identity_proof_choices = [
        (IDENTITY_PROOF_AADHAAR, "Aadhaar Card"),
        (IDENTITY_PROOF_VOTER, "Voter ID"),
        (IDENTITY_PROOF_LICENSE, "Driving License"),
        (IDENTITY_PROOF_PASSPORT, "Passport"),
    ]

    address_proof_choices = [
        (ADDRESS_PROOF_AADHAAR_VOTER, "Aadhaar / Voter ID"),
        (ADDRESS_PROOF_UTILITY, "EB bill / Water bill"),
        (ADDRESS_PROOF_RENTAL, "Rental agreement"),
    ]

    ITEM_TYPE_RING = "ring"
    ITEM_TYPE_CHAIN = "chain"
    ITEM_TYPE_NECKLACE = "necklace"
    ITEM_TYPE_BRACELET = "bracelet"
    ITEM_TYPE_BANGLE = "bangle"
    ITEM_TYPE_EARRING = "earring"
    ITEM_TYPE_OTHER = "other"

    METAL_GOLD = "gold"
    METAL_SILVER = "silver"
    METAL_PLATINUM = "platinum"
    METAL_OTHER = "other"

    CONDITION_NEW = "new"
    CONDITION_EXCELLENT = "excellent"
    CONDITION_GOOD = "good"
    CONDITION_FAIR = "fair"

    item_type_choices = [
        (ITEM_TYPE_RING, "Ring"),
        (ITEM_TYPE_CHAIN, "Chain"),
        (ITEM_TYPE_NECKLACE, "Necklace"),
        (ITEM_TYPE_BRACELET, "Bracelet"),
        (ITEM_TYPE_BANGLE, "Bangle"),
        (ITEM_TYPE_EARRING, "Earring"),
        (ITEM_TYPE_OTHER, "Other"),
    ]

    metal_type_choices = [
        (METAL_GOLD, "Gold"),
        (METAL_SILVER, "Silver"),
        (METAL_PLATINUM, "Platinum"),
        (METAL_OTHER, "Other"),
    ]

    condition_choices = [
        (CONDITION_NEW, "New"),
        (CONDITION_EXCELLENT, "Excellent"),
        (CONDITION_GOOD, "Good"),
        (CONDITION_FAIR, "Fair"),
    ]

    sno = models.CharField(max_length=80, unique=True, blank=True, null=True, default=None)
    sno_sequence = models.PositiveIntegerField(default=0, db_index=True)
    ano = models.CharField(max_length=80, unique=True, blank=True, null=True, default=None)
    ano_sequence = models.PositiveIntegerField(default=0, db_index=True)
    full_name = models.CharField(max_length=150)
    father_or_husband_name = models.CharField(max_length=150)
    date_of_birth = models.DateField(blank=True, null=True)
    age = models.PositiveSmallIntegerField(blank=True, null=True)
    mobile_number = models.CharField(
        max_length=10,
        blank=True,
        default="",
        validators=[
            RegexValidator(
                regex=r"^[6-9]\d{9}$",
                message="Mobile number must be a valid 10-digit Indian number.",
            )
        ],
    )
    address = models.TextField(blank=True, default="")
    occupation = models.CharField(max_length=120, blank=True, default="")
    identity_proof_type = models.CharField(
        max_length=20,
        choices=identity_proof_choices,
        blank=True,
        default="",
    )
    identity_proof_name = models.CharField(max_length=150, blank=True, default="")
    identity_proof_number = models.CharField(max_length=50, blank=True, default="")
    identity_proof_file = models.FileField(
        upload_to="customers/identity/",
        validators=[
            FileExtensionValidator(
                allowed_extensions=["pdf", "jpg", "jpeg", "png", "webp"],
            )
        ],
        blank=True,
        null=True,
    )
    address_proof_type = models.CharField(
        max_length=20,
        choices=address_proof_choices,
        blank=True,
        default="",
    )
    address_proof_file = models.FileField(
        upload_to="customers/address/",
        validators=[
            FileExtensionValidator(
                allowed_extensions=["pdf", "jpg", "jpeg", "png", "webp"],
            )
        ],
        blank=True,
        null=True,
    )
    photo = models.FileField(
        upload_to="customers/photos/",
        validators=[
            FileExtensionValidator(
                allowed_extensions=["jpg", "jpeg", "png", "webp"],
            ),
            validate_photo_size,
        ],
        blank=True,
        null=True,
    )
    item_type = models.CharField(
        max_length=20,
        choices=item_type_choices,
        blank=True,
        default="",
    )
    metal_type = models.CharField(
        max_length=20,
        choices=metal_type_choices,
        blank=True,
        default="",
    )
    purity_or_karat = models.CharField(max_length=30, blank=True, default="")
    weight_grams = models.DecimalField(
        max_digits=8,
        decimal_places=3,
        blank=True,
        null=True,
    )
    number_of_stones = models.PositiveIntegerField(blank=True, null=True)
    gemstone_type = models.CharField(max_length=60, blank=True, default="")
    gemstone_carat_or_quantity = models.CharField(max_length=60, blank=True, default="")
    hallmark_or_makers_mark = models.CharField(max_length=120, blank=True, default="")
    remarks = models.TextField(blank=True, default="")
    item_condition = models.CharField(
        max_length=20,
        choices=condition_choices,
        blank=True,
        default="",
    )
    jewelry_photo = models.FileField(
        upload_to="customers/jewelry/",
        validators=[
            FileExtensionValidator(
                allowed_extensions=["jpg", "jpeg", "png", "webp"],
            ),
            validate_photo_size,
        ],
        blank=True,
        null=True,
        default=None,
    )
    jewel_entries = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.sno or self.full_name

    def save(self, *args, **kwargs):
        generated_field_names = []
        settings_fields_to_update = []

        if not self.sno or not self.ano:
            with transaction.atomic():
                workspace_settings = WorkspaceSettings.get_solo_for_update()

                if not self.sno:
                    self.sno_sequence = workspace_settings.next_sno_number
                    self.sno = render_sequence_value(
                        workspace_settings.sno_format,
                        workspace_settings.next_sno_number,
                    )
                    workspace_settings.next_sno_number += 1
                    generated_field_names.extend(["sno", "sno_sequence"])
                    settings_fields_to_update.append("next_sno_number")

                if not self.ano:
                    self.ano_sequence = workspace_settings.next_ano_number
                    self.ano = render_sequence_value(
                        workspace_settings.ano_format,
                        workspace_settings.next_ano_number,
                    )
                    workspace_settings.next_ano_number += 1
                    generated_field_names.extend(["ano", "ano_sequence"])
                    settings_fields_to_update.append("next_ano_number")

                if settings_fields_to_update:
                    workspace_settings.save(update_fields=settings_fields_to_update)

                update_fields = kwargs.get("update_fields")

                if update_fields is not None:
                    kwargs["update_fields"] = list(set(update_fields) | set(generated_field_names))

                return super().save(*args, **kwargs)

        return super().save(*args, **kwargs)

    def clean(self):
        super().clean()

        if self.identity_proof_type and not self.identity_proof_name:
            self.identity_proof_name = self.full_name

        if self.date_of_birth and self.age is not None:
            today = date.today()
            derived_age = today.year - self.date_of_birth.year
            if (today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day):
                derived_age -= 1

            if self.age != derived_age:
                raise ValidationError(
                    {
                        "age": "Age must match the selected date of birth.",
                    }
                )

        if self.date_of_birth and self.age is None:
            raise ValidationError(
                {
                    "age": "Age must be provided when date of birth is set.",
                }
            )

        if (
            self.identity_proof_type == self.IDENTITY_PROOF_AADHAAR
            and self.identity_proof_name.strip().lower() != self.full_name.strip().lower()
        ):
            raise ValidationError(
                {
                    "identity_proof_name": "Aadhaar card name must match the full name exactly.",
                }
            )

        if self.identity_proof_type == self.IDENTITY_PROOF_AADHAAR:
            normalized_aadhaar = re.sub(r"\D", "", self.identity_proof_number or "")

            if not re.fullmatch(r"\d{12}", normalized_aadhaar):
                raise ValidationError(
                    {
                        "identity_proof_number": "Aadhaar number must be exactly 12 digits.",
                    }
                )

            self.identity_proof_number = normalized_aadhaar

        if self.weight_grams is not None and self.weight_grams <= 0:
            raise ValidationError(
                {
                    "weight_grams": "Weight must be greater than zero.",
                }
            )

        if self.number_of_stones is not None and self.number_of_stones < 0:
            raise ValidationError(
                {
                    "number_of_stones": "Number of stones cannot be negative.",
                }
            )
