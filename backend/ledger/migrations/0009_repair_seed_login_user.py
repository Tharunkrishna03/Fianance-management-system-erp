from django.conf import settings
from django.contrib.auth.hashers import make_password
from django.db import migrations


def sync_seed_users(apps, schema_editor):
    app_label, model_name = settings.AUTH_USER_MODEL.split(".")
    User = apps.get_model(app_label, model_name)

    seed_users = [
        {
            "username": "jeweladmin",
            "email": "jeweladmin@example.com",
            "first_name": "Jewel",
            "last_name": "Admin",
            "password": "Jewel@123",
        },
        {
            "username": "Tharunadmin",
            "email": "tharunadmin@example.com",
            "first_name": "Tharun",
            "last_name": "Admin",
            "password": "Tharun@123",
        },
    ]

    for seed_user in seed_users:
        User.objects.update_or_create(
            username=seed_user["username"],
            defaults={
                "email": seed_user["email"],
                "first_name": seed_user["first_name"],
                "last_name": seed_user["last_name"],
                "is_active": True,
                "is_staff": True,
                "is_superuser": False,
                "password": make_password(seed_user["password"]),
            },
        )


class Migration(migrations.Migration):
    dependencies = [
        ("ledger", "0008_alter_customer_photo"),
    ]

    operations = [
        migrations.RunPython(sync_seed_users, migrations.RunPython.noop),
    ]
