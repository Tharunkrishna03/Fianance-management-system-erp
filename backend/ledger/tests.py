import shutil
from datetime import date
from pathlib import Path

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import Client, TestCase
from django.test.utils import override_settings
from django.urls import reverse

from .models import Customer, UserProfile


TEST_MEDIA_ROOT = Path(__file__).resolve().parent.parent / "test_media"


def calculate_age(date_of_birth):
    today = date.today()
    age = today.year - date_of_birth.year

    if (today.month, today.day) < (date_of_birth.month, date_of_birth.day):
        age -= 1

    return age


def build_customer_payload(**overrides):
    date_of_birth = overrides.pop("date_of_birth", date(1995, 1, 1))
    full_name = overrides.pop("full_name", "Tharun Admin")

    payload = {
        "full_name": full_name,
        "father_or_husband_name": overrides.pop("father_or_husband_name", "Kumar"),
        "date_of_birth": date_of_birth.isoformat(),
        "age": overrides.pop("age", str(calculate_age(date_of_birth))),
        "mobile_number": overrides.pop("mobile_number", "9876543210"),
        "occupation": overrides.pop("occupation", "Business"),
        "identity_proof_type": overrides.pop("identity_proof_type", "aadhaar_card"),
        "identity_proof_name": overrides.pop("identity_proof_name", full_name),
        "identity_proof_number": overrides.pop("identity_proof_number", "123412341234"),
        "identity_proof_file": overrides.pop(
            "identity_proof_file",
            SimpleUploadedFile("identity.pdf", b"identity-proof", content_type="application/pdf"),
        ),
        "address_proof_type": overrides.pop("address_proof_type", "eb_water_bill"),
        "address_proof_file": overrides.pop(
            "address_proof_file",
            SimpleUploadedFile("address.pdf", b"address-proof", content_type="application/pdf"),
        ),
        "photo": overrides.pop(
            "photo",
            SimpleUploadedFile("photo.jpg", b"photo-proof", content_type="image/jpeg"),
        ),
        "item_type": overrides.pop("item_type", "ring"),
        "metal_type": overrides.pop("metal_type", "gold"),
        "purity_or_karat": overrides.pop("purity_or_karat", "22K"),
        "weight_grams": overrides.pop("weight_grams", "12.500"),
        "gemstone_type": overrides.pop("gemstone_type", "Diamond"),
        "gemstone_carat_or_quantity": overrides.pop("gemstone_carat_or_quantity", "0.80 ct"),
        "hallmark_or_makers_mark": overrides.pop("hallmark_or_makers_mark", "BIS-HM-2026"),
        "item_condition": overrides.pop("item_condition", "excellent"),
        "jewelry_photo": overrides.pop(
            "jewelry_photo",
            SimpleUploadedFile("jewel.jpg", b"jewel-photo", content_type="image/jpeg"),
        ),
    }

    payload.update(overrides)
    return payload


class LoginViewTests(TestCase):
    def setUp(self):
        cache.clear()

    @override_settings(ENABLE_DEMO_ACCOUNTS=True)
    def test_login_demo_accounts_are_available_in_debug(self):
        response = self.client.get(reverse('login-demo'))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['success'], True)
        self.assertEqual(
            {account['username'] for account in response.json()['accounts']},
            {'tharun', 'jeweladmin'},
        )

    @override_settings(ENABLE_DEMO_ACCOUNTS=False)
    def test_login_demo_accounts_are_hidden_outside_debug(self):
        response = self.client.get(reverse('login-demo'))

        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json()['success'], False)

    def test_login_succeeds_with_valid_credentials(self):
        response = self.client.post(
            reverse('login'),
            data='{"username":"tharun","password":"123"}',
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['success'], True)
        self.assertEqual(str(self.client.session.get('_auth_user_id')), str(get_user_model().objects.get(username='tharun').pk))
        self.assertIn(settings.CSRF_COOKIE_NAME, response.cookies)

    def test_login_succeeds_with_case_insensitive_username(self):
        response = self.client.post(
            reverse('login'),
            data='{"username":"THARUN","password":"123"}',
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['success'], True)

    def test_login_fails_with_invalid_credentials(self):
        response = self.client.post(
            reverse('login'),
            data='{"username":"jeweladmin","password":"wrong-password"}',
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json()['success'], False)

    @override_settings(ENABLE_DEMO_ACCOUNTS=False)
    def test_login_still_succeeds_when_demo_endpoint_is_disabled(self):
        response = self.client.post(
            reverse('login'),
            data='{"username":"tharun","password":"123"}',
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['success'], True)

    @override_settings(LOGIN_RATE_LIMIT_ATTEMPTS=1, LOGIN_RATE_LIMIT_WINDOW_SECONDS=300)
    def test_login_rate_limits_repeated_failures(self):
        first_response = self.client.post(
            reverse('login'),
            data='{"username":"jeweladmin","password":"wrong-password"}',
            content_type='application/json',
        )
        second_response = self.client.post(
            reverse('login'),
            data='{"username":"jeweladmin","password":"wrong-password"}',
            content_type='application/json',
        )

        self.assertEqual(first_response.status_code, 401)
        self.assertEqual(second_response.status_code, 429)
        self.assertEqual(second_response.json()['success'], False)


@override_settings(MEDIA_ROOT=TEST_MEDIA_ROOT)
class ProfileViewTests(TestCase):
    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        shutil.rmtree(TEST_MEDIA_ROOT, ignore_errors=True)

    def setUp(self):
        self.user = get_user_model().objects.get(username='tharun')
        self.client.post(
            reverse('login'),
            data='{"username":"tharun","password":"123"}',
            content_type='application/json',
        )

    def test_profile_get_returns_authenticated_user_profile(self):
        response = self.client.get(reverse('profile'))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['success'], True)
        self.assertEqual(response.json()['profile']['username'], 'tharun')

    def test_profile_update_changes_display_name(self):
        response = self.client.post(
            reverse('profile'),
            data='{"display_name":"Finance Admin"}',
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['success'], True)
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, 'Finance Admin')

    def test_profile_password_change_requires_correct_current_password(self):
        response = self.client.post(
            reverse('profile-password'),
            data='{"current_password":"wrong","new_password":"NewStrong@123","confirm_password":"NewStrong@123"}',
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()['success'], False)
        self.assertIn('current_password', response.json()['errors'])

    def test_profile_password_change_updates_saved_password(self):
        response = self.client.post(
            reverse('profile-password'),
            data='{"current_password":"123","new_password":"NewStrong@123","confirm_password":"NewStrong@123"}',
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['success'], True)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('NewStrong@123'))
        follow_up_response = self.client.get(reverse('profile'))
        self.assertEqual(follow_up_response.status_code, 200)

    def test_profile_photo_update_saves_photo(self):
        response = self.client.post(
            reverse('profile-photo'),
            data={
                'photo': SimpleUploadedFile(
                    'avatar.jpg',
                    b'avatar-photo',
                    content_type='image/jpeg',
                )
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['success'], True)
        self.assertIn('/media/profiles/photos/', response.json()['profile']['photo_url'])
        self.assertTrue(UserProfile.objects.filter(user=self.user).exists())

    def test_profile_requires_authenticated_session(self):
        anonymous_client = Client()
        response = anonymous_client.get(reverse('profile'))

        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json()['success'], False)

    def test_profile_post_rejects_missing_csrf_token_when_enforced(self):
        csrf_client = Client(enforce_csrf_checks=True)
        login_response = csrf_client.post(
            reverse('login'),
            data='{"username":"tharun","password":"123"}',
            content_type='application/json',
        )
        self.assertEqual(login_response.status_code, 200)
        csrf_token = csrf_client.cookies[settings.CSRF_COOKIE_NAME].value

        response = csrf_client.post(
            reverse('profile'),
            data='{"display_name":"Finance Admin"}',
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 403)

        response_with_csrf = csrf_client.post(
            reverse('profile'),
            data='{"display_name":"Finance Admin"}',
            content_type='application/json',
            HTTP_X_CSRFTOKEN=csrf_token,
            HTTP_ORIGIN='http://localhost:3000',
            HTTP_REFERER='http://localhost:3000/dashboard/profile',
        )

        self.assertEqual(response_with_csrf.status_code, 200)
        self.assertEqual(response_with_csrf.json()['success'], True)


@override_settings(MEDIA_ROOT=TEST_MEDIA_ROOT)
class CustomerCreateViewTests(TestCase):
    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        shutil.rmtree(TEST_MEDIA_ROOT, ignore_errors=True)

    def setUp(self):
        self.client.post(
            reverse('login'),
            data='{"username":"tharun","password":"123"}',
            content_type='application/json',
        )

    def test_customer_create_succeeds_with_valid_payload(self):
        response = self.client.post(reverse('create-customer'), data=build_customer_payload())

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()['success'], True)
        self.assertEqual(Customer.objects.count(), 1)
        self.assertEqual(Customer.objects.get().full_name, "Tharun Admin")

    def test_customer_create_rejects_aadhaar_name_mismatch(self):
        response = self.client.post(
            reverse('create-customer'),
            data=build_customer_payload(identity_proof_name="Different Name"),
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()['success'], False)
        self.assertIn('identity_proof_name', response.json()['errors'])

    def test_customer_create_rejects_aadhaar_without_twelve_digits(self):
        response = self.client.post(
            reverse('create-customer'),
            data=build_customer_payload(identity_proof_number="12345"),
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()['success'], False)
        self.assertIn('identity_proof_number', response.json()['errors'])

    def test_customer_create_rejects_photo_over_one_mb(self):
        large_photo = SimpleUploadedFile(
            "large-photo.jpg",
            b"x" * ((1024 * 1024) + 1),
            content_type="image/jpeg",
        )

        response = self.client.post(
            reverse('create-customer'),
            data=build_customer_payload(photo=large_photo, identity_proof_type="voter_id"),
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()['success'], False)
        self.assertIn('photo', response.json()['errors'])

    def test_customer_list_returns_saved_customers_with_photo_url(self):
        self.client.post(reverse('create-customer'), data=build_customer_payload())

        response = self.client.get(reverse('create-customer'))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['success'], True)
        self.assertEqual(len(response.json()['customers']), 1)
        self.assertEqual(response.json()['customers'][0]['full_name'], "Tharun Admin")
        self.assertIn('/media/customers/photos/', response.json()['customers'][0]['photo_url'])

    def test_customer_detail_returns_customer_record(self):
        self.client.post(reverse('create-customer'), data=build_customer_payload())
        customer = Customer.objects.get()

        response = self.client.get(reverse('customer-detail', args=[customer.id]))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['success'], True)
        self.assertEqual(response.json()['customer']['full_name'], "Tharun Admin")

    def test_customer_update_changes_saved_record(self):
        self.client.post(reverse('create-customer'), data=build_customer_payload())
        customer = Customer.objects.get()

        response = self.client.post(
            reverse('customer-detail', args=[customer.id]),
            data=build_customer_payload(
                full_name="Updated Customer",
                identity_proof_type="voter_id",
                identity_proof_name="Updated Customer",
                identity_proof_number="ABCD1234",
                address_proof_type="rental_agreement",
            ),
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['success'], True)
        customer.refresh_from_db()
        self.assertEqual(customer.full_name, "Updated Customer")

    def test_customer_delete_removes_saved_record(self):
        self.client.post(reverse('create-customer'), data=build_customer_payload())
        customer = Customer.objects.get()

        response = self.client.delete(reverse('customer-detail', args=[customer.id]))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['success'], True)
        self.assertEqual(Customer.objects.count(), 0)

    def test_customer_endpoints_require_authenticated_session(self):
        anonymous_client = Client()
        response = anonymous_client.get(reverse('create-customer'))

        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json()['success'], False)
