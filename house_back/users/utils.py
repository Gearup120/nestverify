import random
from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from .models import OTP


def generate_otp():
    return "123456"

def get_otp_email_html(first_name: str, code: str) -> str:
    return ""

def send_otp_email(user) -> bool:
    """Mock sending OTP verification email for Render Free Tier demo."""
    # Invalidate previous unused OTPs
    OTP.objects.filter(user=user, is_used=False).update(is_used=True)

    code = generate_otp()
    OTP.objects.create(user=user, code=code, expires_at=timezone.now() + timedelta(minutes=10))

    print(f"[NestVerify - DEMO MODE] Skipping real email send due to Render free tier limits.")
    print(f"[NestVerify - DEMO MODE] OTP for {user.email} is ALWAYS: {code}")
    
    return True