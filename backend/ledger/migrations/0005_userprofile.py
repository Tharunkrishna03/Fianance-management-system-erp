from django.conf import settings
from django.db import migrations, models
import django.core.validators
import django.db.models.deletion
import ledger.models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('ledger', '0004_customer_gemstone_carat_or_quantity_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='UserProfile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                (
                    'photo',
                    models.FileField(
                        blank=True,
                        null=True,
                        upload_to='profiles/photos/',
                        validators=[
                            django.core.validators.FileExtensionValidator(
                                allowed_extensions=['jpg', 'jpeg', 'png', 'webp']
                            ),
                            ledger.models.validate_photo_size,
                        ],
                    ),
                ),
                (
                    'user',
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='profile',
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
    ]
