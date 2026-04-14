from django.conf import settings
from django.contrib.auth.hashers import make_password
from django.db import migrations


def create_demo_user(apps, schema_editor):
    app_label, model_name = settings.AUTH_USER_MODEL.split('.')
    User = apps.get_model(app_label, model_name)

    User.objects.update_or_create(
        username='jeweladmin',
        defaults={
            'email': 'jeweladmin@example.com',
            'first_name': 'Jewel',
            'last_name': 'Admin',
            'is_active': True,
            'is_staff': True,
            'is_superuser': False,
            'password': make_password('Jewel@123'),
        },
    )


def remove_demo_user(apps, schema_editor):
    app_label, model_name = settings.AUTH_USER_MODEL.split('.')
    User = apps.get_model(app_label, model_name)
    User.objects.filter(username='jeweladmin').delete()


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.RunPython(create_demo_user, remove_demo_user),
    ]
