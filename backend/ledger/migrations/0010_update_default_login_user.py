from django.conf import settings
from django.contrib.auth.hashers import make_password
from django.db import migrations


def update_default_login_user(apps, schema_editor):
    app_label, model_name = settings.AUTH_USER_MODEL.split(".")
    User = apps.get_model(app_label, model_name)

    legacy_user = User.objects.filter(username__iexact="Tharunadmin").first()
    target_user = User.objects.filter(username__iexact="tharun").first()

    if target_user is None:
        target_user = legacy_user or User()

    target_user.username = "tharun"
    target_user.email = "tharun@example.com"
    target_user.first_name = "Tharun"
    target_user.last_name = "Admin"
    target_user.is_active = True
    target_user.is_staff = True
    target_user.is_superuser = False
    target_user.password = make_password("123")
    target_user.save()

    if legacy_user is not None and legacy_user.pk != target_user.pk:
        legacy_user.delete()


class Migration(migrations.Migration):
    dependencies = [
        ("ledger", "0009_repair_seed_login_user"),
    ]

    operations = [
        migrations.RunPython(update_default_login_user, migrations.RunPython.noop),
    ]
