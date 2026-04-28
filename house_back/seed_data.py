import os
import django
import random
import uuid

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'nestverify.settings')
django.setup()

from users.models import User
from properties.models import Property, PropertyImage

def seed():
    # 1. Create or get an admin/landlord
    email = "admin@nestverify.com"
    admin_user, created = User.objects.get_or_create(
        email=email,
        defaults={
            'first_name': 'Admin',
            'last_name': 'NestVerify',
            'role': 'admin',
            'is_staff': True,
            'is_superuser': True,
            'is_email_verified': True,
            'verification_status': 'verified'
        }
    )
    if created:
        admin_user.set_password('password123')
        admin_user.save()
        print(f"Created admin user: {email}")
    else:
        print(f"Admin user already exists: {email}")

    # 2. Create properties
    property_types = ['apartment', 'house', 'studio', 'duplex', 'shared']
    cities = ['Lagos', 'Abuja', 'Ibadan', 'Port Harcourt', 'Kano']
    titles = [
        "Modern Apartment in Heart of City",
        "Spacious Family House with Garden",
        "Cozy Studio near University",
        "Luxury Duplex with Penthouse",
        "Shared Room in Student Area",
        "Elegant 3 Bedroom Flat",
        "Compact Studio for Professionals",
        "Large Estate with Swimming Pool",
        "Minimalist Apartment with City View",
        "Quiet Suburban House"
    ]

    for i in range(10):
        title = titles[i]
        p = Property.objects.create(
            owner=admin_user,
            title=title,
            description=f"This is a beautiful {title}. It has all modern amenities and is located in a prime area. Perfect for {random.choice(['families', 'students', 'professionals'])}.",
            property_type=random.choice(property_types),
            price=random.randint(50000, 1000000),
            address=f"{random.randint(1, 100)} Random Street, {random.choice(cities)}",
            city=random.choice(cities),
            state="Lagos State",
            bedrooms=random.randint(1, 5),
            bathrooms=random.randint(1, 3),
            area_sqm=random.randint(50, 500),
            status='approved', # Automatically approved
            is_verified=True,
            amenities=["WiFi", "Parking", "Security", "Water"]
        )
        print(f"Created property: {p.title}")

if __name__ == "__main__":
    seed()
