from django.db import migrations


def remove_seed_demo_users(apps, schema_editor):
    User = apps.get_model("auth", "User")
    seeded_users = [
        ("jeweladmin", "jeweladmin@example.com", "Jewel", "Admin"),
        ("Tharunadmin", "tharunadmin@example.com", "Tharun", "Admin"),
        ("tharun", "tharun@example.com", "Tharun", "Admin"),
    ]

    for username, email, first_name, last_name in seeded_users:
        User.objects.filter(
            username=username,
            email=email,
            first_name=first_name,
            last_name=last_name,
        ).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("ledger", "0010_update_default_login_user"),
    ]

    operations = [
        migrations.RunPython(remove_seed_demo_users, migrations.RunPython.noop),
    ]
