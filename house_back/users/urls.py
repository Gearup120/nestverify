from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', views.ProfileView.as_view(), name='profile'),
    path('verify-otp/', views.VerifyOTPView.as_view(), name='verify-otp'),
    path('resend-otp/', views.ResendOTPView.as_view(), name='resend-otp'),
    path('upload-id/', views.UploadIDView.as_view(), name='upload-id'),
    path('admin/users/', views.AdminUsersListView.as_view(), name='admin-users'),
    path('admin/verify/<uuid:user_id>/', views.AdminVerifyUserView.as_view(), name='admin-verify'),
    path('contact/', views.ContactView.as_view(), name='contact'),
]
