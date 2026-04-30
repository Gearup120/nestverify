from rest_framework import generics, status, permissions
from django.core.mail import send_mail
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model
from .models import User, OTP
from .serializers import (
    RegisterSerializer, UserProfileSerializer,
    UploadIDSerializer, AdminUserSerializer
)
from .utils import send_otp_email


# ── Email Backend (defined here to avoid circular import in models.py) ────────
class EmailBackend(ModelBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        email = username or kwargs.get('email')
        if not email or not password:
            return None
        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return None
        if user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None


# ── Views ─────────────────────────────────────────────────────────────────────
class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        print(f"[RegisterView] Incoming data: {request.data}")
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print(f"[RegisterView] Validation failed: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        user = serializer.save()
        
        # Send OTP email
        sent, error_msg = send_otp_email(user)
        
        return Response({
            'message': 'Account created successfully. Please check your email for the verification code.',
            'user': UserProfileSerializer(user).data,
            'email_sent': sent,
            'email_error': error_msg
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        if not email or not password:
            return Response(
                {'error': 'Email and password are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Manually authenticate using EmailBackend
        backend = EmailBackend()
        user = backend.authenticate(request, email=email, password=password)

        if not user:
            return Response(
                {'error': 'Invalid credentials.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not user.is_email_verified:
            # If not verified, resend OTP and inform the user
            sent, error_msg = send_otp_email(user)
            return Response({
                'error': 'Email not verified.',
                'needs_verification': True,
                'email': user.email,
                'email_sent': sent,
                'email_error': error_msg
            }, status=status.HTTP_403_FORBIDDEN)

        refresh = RefreshToken.for_user(user)
        return Response({
            'message': 'Login successful.',
            'user': UserProfileSerializer(user).data,
            'tokens': {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            }
        })


class VerifyOTPView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        code = request.data.get('code')

        if not email or not code:
            return Response({'error': 'Email and code are required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email__iexact=email)
            otp = OTP.objects.filter(user=user, code=code, is_used=False).first()

            if not otp or otp.is_expired():
                return Response({'error': 'Invalid or expired code.'}, status=status.HTTP_400_BAD_REQUEST)

            # Mark OTP as used and user as verified
            otp.is_used = True
            otp.save()
            user.is_email_verified = True
            user.save()

            refresh = RefreshToken.for_user(user)
            return Response({
                'message': 'Email verified successfully.',
                'tokens': {
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                }
            })
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)


class ResendOTPView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'error': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email__iexact=email)
            if user.is_email_verified:
                return Response({'message': 'Email already verified.'})
            
            sent, error_msg = send_otp_email(user)
            return Response({
                'message': 'New verification code sent.' if sent else 'Failed to send email.',
                'email_sent': sent,
                'email_error': error_msg
            })
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)


class LogoutView(APIView):
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({'message': 'Logged out successfully.'})
        except Exception:
            return Response(
                {'error': 'Invalid or expired token.'},
                status=status.HTTP_400_BAD_REQUEST
            )


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer

    def get_object(self):
        if self.request.user.is_authenticated:
            return self.request.user
        # Return a dummy user for development if not authenticated
        return User(
            email='guest@nestverify.ng',
            full_name='Guest User',
            is_staff=True,
            is_email_verified=True,
            verification_status='verified'
        )


class UploadIDView(generics.UpdateAPIView):
    serializer_class = UploadIDSerializer

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        response.data['message'] = 'ID document uploaded. Pending admin review.'
        return response


class AdminVerifyUserView(APIView):
    permission_classes = [permissions.AllowAny]

    def patch(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        action = request.data.get('action')
        if action == 'approve':
            user.verification_status = 'verified'
            user.save()
            return Response({'message': f'{user.full_name} has been verified.'})
        elif action == 'reject':
            user.verification_status = 'rejected'
            user.save()
            return Response({'message': f'{user.full_name} has been rejected.'})
        return Response(
            {'error': 'Action must be "approve" or "reject".'},
            status=status.HTTP_400_BAD_REQUEST
        )


class AdminUsersListView(generics.ListAPIView):
    serializer_class = AdminUserSerializer
    permission_classes = [permissions.AllowAny]
    queryset = User.objects.all().order_by('-date_joined')


class ContactView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        name = request.data.get('name')
        email = request.data.get('email')
        subject = request.data.get('subject')
        message = request.data.get('message')

        if not all([name, email, subject, message]):
            return Response({'error': 'All fields are required.'}, status=status.HTTP_400_BAD_REQUEST)

        full_message = f"Message from {name} ({email}):\n\n{message}"
        
        try:
            send_mail(
                subject=f"[NestVerify Support] {subject}",
                message=full_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=['tboad04@gmail.com'],
                fail_silently=False,
            )
            return Response({'message': 'Message sent successfully.'})
        except Exception as e:
            return Response({'error': f'Failed to send message: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)