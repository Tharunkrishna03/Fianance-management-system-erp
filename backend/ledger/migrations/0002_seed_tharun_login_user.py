from django.conf import settings
from django.contrib.auth.hashers import make_password
from django.db import migrations


def create_login_user(apps, schema_editor):
    app_label, model_name = settings.AUTH_USER_MODEL.split('.')
    User = apps.get_model(app_label, model_name)

    User.objects.update_or_create(
        username='Tharunadmin',
        defaults={
            'email': 'tharunadmin@example.com',
            'first_name': 'Tharun',
            'last_name': 'Admin',
            'is_active': True,
            'is_staff': True,
            'is_superuser': False,
            'password': make_password('Tharun@123'),
        },
    )


def remove_login_user(apps, schema_editor):
    app_label, model_name = settings.AUTH_USER_MODEL.split('.')
    User = apps.get_model(app_label, model_name)
    User.objects.filter(username='Tharunadmin').delete()


class Migration(migrations.Migration):
    dependencies = [
        ('ledger', '0001_seed_demo_user'),
    ]

    operations = [
        migrations.RunPython(create_login_user, remove_login_user),
    ]
