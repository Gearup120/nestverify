import os
import django
from django.conf import settings
from django.core.mail import send_mail

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'nestverify.settings')
django.setup()

def test_email():
    print(f"Testing email with:")
    print(f"Host: {settings.EMAIL_HOST}")
    print(f"Port: {settings.EMAIL_PORT}")
    print(f"User: {settings.EMAIL_HOST_USER}")
    print(f"Password: {settings.EMAIL_HOST_PASSWORD[:5]}...")
    
    try:
        send_mail(
            'Test Email from NestVerify',
            'This is a test email to verify SMTP settings.',
            settings.DEFAULT_FROM_EMAIL,
            [settings.EMAIL_HOST_USER], # send to self
            fail_silently=False,
        )
        print("Successfully sent test email!")
    except Exception as e:
        print(f"Failed to send email: {e}")

if __name__ == "__main__":
    test_email()
