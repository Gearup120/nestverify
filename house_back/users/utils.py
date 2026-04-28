import random
from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from .models import OTP


def generate_otp():
    return str(random.randint(100000, 999999))


def get_otp_email_html(first_name: str, code: str) -> str:
    return f"""
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Verify your email – NestVerify</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0"
               style="background:#ffffff;border-radius:12px;overflow:hidden;
                      box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a3c5e 0%,#2d6a9f 100%);
                        padding:36px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;
                         letter-spacing:-0.5px;">
                🏠 NestVerify
              </h1>
              <p style="margin:6px 0 0;color:#a8c8e8;font-size:13px;letter-spacing:1px;
                        text-transform:uppercase;">
                Secure Property Verification
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <p style="margin:0 0 8px;color:#1a3c5e;font-size:22px;font-weight:600;">
                Hi {first_name}, 👋
              </p>
              <p style="margin:0 0 28px;color:#5a6a7a;font-size:15px;line-height:1.6;">
                Use the code below to verify your email address. It expires in
                <strong>10 minutes</strong>.
              </p>

              <!-- OTP Box -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center"
                      style="background:#f0f7ff;border:2px dashed #2d6a9f;
                             border-radius:10px;padding:28px 20px;">
                    <p style="margin:0 0 6px;color:#5a6a7a;font-size:12px;
                               letter-spacing:2px;text-transform:uppercase;">
                      Verification Code
                    </p>
                    <p style="margin:0;color:#1a3c5e;font-size:42px;font-weight:700;
                               letter-spacing:12px;font-family:'Courier New',monospace;">
                      {code}
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:28px 0 0;color:#8a9aaa;font-size:13px;line-height:1.6;">
                If you didn't create a NestVerify account, you can safely ignore this email.
                Someone may have entered your email address by mistake.
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <hr style="border:none;border-top:1px solid #edf0f4;margin:0;" />
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;text-align:center;">
              <p style="margin:0;color:#aab4be;font-size:12px;line-height:1.8;">
                © 2026 NestVerify Nigeria · Lagos, NG<br/>
                This is an automated message — please do not reply.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
"""


def send_otp_email(user) -> bool:
    """Send OTP verification email via Brevo SMTP. Returns True on success."""
    import traceback
    import smtplib

    # Cooldown: don't resend within 60 seconds
    recent = OTP.objects.filter(
        user=user,
        created_at__gt=timezone.now() - timedelta(seconds=60)
    ).first()
    if recent:
        print(f"[NestVerify] OTP cooldown active for {user.email}, skipping send")
        return True

    # Invalidate previous unused OTPs
    OTP.objects.filter(user=user, is_used=False).update(is_used=True)

    code = generate_otp()
    OTP.objects.create(user=user, code=code, expires_at=timezone.now() + timedelta(minutes=10))

    subject = "Your NestVerify verification code"
    first_name = user.first_name or "there"
    plain_text = (
        f"Hi {first_name},\n\n"
        f"Your verification code is: {code}\n\n"
        f"It expires in 10 minutes.\n\n"
        f"If you didn't request this, ignore this email."
    )
    html_content = get_otp_email_html(first_name, code)

    # --- Attempt 1: Django EmailMultiAlternatives (uses settings.py config) ---
    try:
        msg = EmailMultiAlternatives(
            subject=subject,
            body=plain_text,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[user.email],
        )
        msg.attach_alternative(html_content, "text/html")
        msg.send(fail_silently=False)
        print(f"[NestVerify] [SUCCESS] OTP email sent to {user.email} (code={code})")
        return True
    except smtplib.SMTPAuthenticationError as e:
        print(f"[NestVerify] [ERROR] SMTP AUTH FAILED: {e}")
        print(f"  → Login: {settings.EMAIL_HOST_USER}")
        print(f"  → Key starts with: {settings.EMAIL_HOST_PASSWORD[:12]}...")
        print(f"  → Check your Brevo SMTP credentials in .env")
        traceback.print_exc()
    except smtplib.SMTPException as e:
        print(f"[NestVerify] [ERROR] SMTP error: {type(e).__name__}: {e}")
        traceback.print_exc()
    except Exception as e:
        print(f"[NestVerify] [ERROR] Email send error: {type(e).__name__}: {e}")
        traceback.print_exc()

    # --- Attempt 2: Direct smtplib fallback ---
    try:
        print(f"[NestVerify] Trying direct smtplib fallback...")
        from email.mime.multipart import MIMEMultipart
        from email.mime.text import MIMEText

        smtp_msg = MIMEMultipart("alternative")
        smtp_msg["Subject"] = subject
        smtp_msg["From"] = settings.DEFAULT_FROM_EMAIL
        smtp_msg["To"] = user.email
        smtp_msg.attach(MIMEText(plain_text, "plain"))
        smtp_msg.attach(MIMEText(html_content, "html"))

        with smtplib.SMTP(settings.EMAIL_HOST, settings.EMAIL_PORT, timeout=30) as server:
            server.set_debuglevel(1)  # Verbose SMTP log
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(settings.EMAIL_HOST_USER, settings.EMAIL_HOST_PASSWORD)
            server.sendmail(settings.DEFAULT_FROM_EMAIL, [user.email], smtp_msg.as_string())
        print(f"[NestVerify] [SUCCESS] OTP email sent via fallback to {user.email} (code={code})")
        return True
    except Exception as fallback_err:
        print(f"[NestVerify] [ERROR] Fallback also failed: {type(fallback_err).__name__}: {fallback_err}")
        traceback.print_exc()

    return False