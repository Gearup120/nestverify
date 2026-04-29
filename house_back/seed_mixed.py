import os
import django
import random

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'nestverify.settings')
django.setup()

from users.models import User
from properties.models import Property, PropertyImage
from fraud.models import FraudReport

def seed_mixed():
    print("Starting mixed seed (50 properties with fraud/verified mix)...")
    
    # 1. Get or create a landlord user
    email = "super@nestverify.com"
    try:
        admin_user = User.objects.get(email=email)
    except User.DoesNotExist:
        admin_user = User.objects.create_superuser(
            email=email,
            password='SuperPassword123!',
            first_name='Super',
            last_name='Admin'
        )

    # 2. Get or create a reporter user for fraud
    reporter_email = "reporter@nestverify.com"
    try:
        reporter_user = User.objects.get(email=reporter_email)
    except User.DoesNotExist:
        reporter_user = User.objects.create_user(
            email=reporter_email,
            password='Password123!',
            first_name='Vigilante',
            last_name='Reporter'
        )

    # Base data
    property_types = ['apartment', 'house', 'studio', 'duplex', 'shared']
    cities = ['Lagos', 'Abuja', 'Ibadan', 'Port Harcourt', 'Kano', 'Enugu', 'Benin City', 'Jos']
    states = ['Lagos', 'FCT', 'Oyo', 'Rivers', 'Kano', 'Enugu', 'Edo', 'Plateau']
    
    adjectives = ["Modern", "Spacious", "Luxury", "Cozy", "Elegant", "Minimalist", "Quaint", "Stunning", "Charming", "Grand"]
    nouns = ["Apartment", "Villa", "Bungalow", "Penthouse", "Studio", "Duplex", "Terrace", "Loft", "Mansion", "Suite"]

    fraud_reasons = [
        "The agent asked for money before inspection.",
        "The pictures look like they were taken from another website.",
        "The price is suspiciously low for this area.",
        "The address provided does not exist on Google Maps.",
        "Landlord is acting very aggressively and pushing for immediate payment."
    ]

    total_properties_to_create = 50
    existing_count = Property.objects.count()
    
    # If there are already > 40 properties, let's assume it's seeded and skip to avoid duplicates.
    if existing_count >= 40:
        print(f"Database already has {existing_count} properties. Skipping seed to prevent duplicates.")
        return

    for i in range(total_properties_to_create):
        title = f"{random.choice(adjectives)} {random.choice(nouns)} in {random.choice(cities)}"
        city_idx = random.randint(0, len(cities)-1)
        
        # Decide the type of this property (mix)
        # 60% Verified, 20% Unverified, 20% Fraud Flagged
        rand_val = random.random()
        is_verified = False
        fraud_score = 0.0
        fraud_flags = []
        status = 'pending'

        if rand_val < 0.6:
            # Verified
            is_verified = True
            status = 'approved'
        elif rand_val < 0.8:
            # Normal pending
            is_verified = False
            status = 'pending'
        else:
            # Fraud Flagged
            is_verified = False
            status = 'pending'
            fraud_score = round(random.uniform(0.6, 0.99), 2)
            fraud_flags = ["Price too low", "Suspicious agent"]

        p = Property.objects.create(
            owner=admin_user,
            title=title,
            description=f"This is a property located in {cities[city_idx]}. It features {random.randint(1, 5)} bedrooms.",
            property_type=random.choice(property_types),
            price=random.randint(50000, 2500000),
            address=f"{random.randint(1, 200)} Test Street",
            city=cities[city_idx],
            state=states[city_idx],
            bedrooms=random.randint(1, 6),
            bathrooms=random.randint(1, 4),
            area_sqm=random.randint(60, 800),
            status=status,
            is_verified=is_verified,
            fraud_score=fraud_score,
            fraud_flags=fraud_flags,
            amenities=["WiFi", "Parking"]
        )

        # Create a Fraud Report if it's flagged
        if fraud_score > 0:
            FraudReport.objects.create(
                property=p,
                reported_by=reporter_user,
                reason=random.choice(fraud_reasons),
                status='open',
                auto_generated=(random.random() > 0.5)
            )

    print(f"Successfully seeded {total_properties_to_create} mixed properties and fraud reports!")

if __name__ == "__main__":
    seed_mixed()
