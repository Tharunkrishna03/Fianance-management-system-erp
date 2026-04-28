from django.urls import path

from .views import (
    csrf_token_view,
    create_customer_view,
    customer_detail_view,
    login_demo_accounts_view,
    login_view,
    logout_view,
    profile_password_view,
    profile_photo_view,
    profile_view,
    signup_view,
    workspace_settings_view,
)


urlpatterns = [
    path('csrf/', csrf_token_view, name='csrf-token'),
    path('login/demo/', login_demo_accounts_view, name='login-demo'),
    path('login/', login_view, name='login'),
    path('signup/', signup_view, name='signup'),
    path('logout/', logout_view, name='logout'),
    path('profile/', profile_view, name='profile'),
    path('profile/password/', profile_password_view, name='profile-password'),
    path('profile/photo/', profile_photo_view, name='profile-photo'),
    path('settings/', workspace_settings_view, name='workspace-settings'),
    path('customers/', create_customer_view, name='create-customer'),
    path('customers/<int:customer_id>/', customer_detail_view, name='customer-detail'),
]
