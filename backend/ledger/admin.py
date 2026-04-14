from django.contrib import admin

from .models import Customer, UserProfile


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = (
        "full_name",
        "mobile_number",
        "occupation",
        "identity_proof_type",
        "address_proof_type",
        "created_at",
    )
    list_filter = ("identity_proof_type", "address_proof_type", "occupation")
    search_fields = ("full_name", "mobile_number", "identity_proof_number")


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "photo")
    search_fields = ("user__username", "user__first_name", "user__last_name")
