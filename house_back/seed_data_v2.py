import os
import django
import random
import uuid
import cloudinary.uploader

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'nestverify.settings')
django.setup()

from users.models import User
from properties.models import Property, PropertyImage

# Sample house images from Unsplash
HOUSE_IMAGES = [
    "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&q=80&w=1000",
    "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&q=80&w=1000",
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=1000",
    "https://images.unsplash.com/photo-1600585154340-be6191da95b8?auto=format&fit=crop&q=80&w=1000",
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=1000",
    "https://images.unsplash.com/photo-1600607687940-47a04b629753?auto=format&fit=crop&q=80&w=1000",
    "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&q=80&w=1000",
    "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&q=80&w=1000",
    "https://images.unsplash.com/photo-1448630360428-65456885c650?auto=format&fit=crop&q=80&w=1000",
    "https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?auto=format&fit=crop&q=80&w=1000"
]

def seed_more(count=140):
    # 1. Get the admin/landlord
    email = "admin@nestverify.com"
    try:
        admin_user = User.objects.get(email=email)
    except User.DoesNotExist:
        admin_user = User.objects.create_superuser(
            email=email,
            password='password123',
            first_name='Admin',
            last_name='NestVerify'
        )
        print(f"Created admin user: {email}")

    # 2. Upload images to Cloudinary once and reuse the IDs to avoid excessive uploads
    print("Uploading sample images to Cloudinary...")
    image_ids = []
    for url in HOUSE_IMAGES:
        try:
            upload_result = cloudinary.uploader.upload(url, folder="seed_properties")
            image_ids.append(upload_result['public_id'])
            print(f"Uploaded: {upload_result['public_id']}")
        except Exception as e:
            print(f"Failed to upload {url}: {e}")
    
    if not image_ids:
        print("No images uploaded. Using placeholders.")
        image_ids = ["sample"]

    # 3. Create properties
    property_types = ['apartment', 'house', 'studio', 'duplex', 'shared']
    cities = ['Lagos', 'Abuja', 'Ibadan', 'Port Harcourt', 'Kano', 'Enugu', 'Benin City', 'Jos']
    states = ['Lagos', 'FCT', 'Oyo', 'Rivers', 'Kano', 'Enugu', 'Edo', 'Plateau']
    
    adjectives = ["Modern", "Spacious", "Luxury", "Cozy", "Elegant", "Minimalist", "Quaint", "Stunning", "Charming", "Grand"]
    nouns = ["Apartment", "Villa", "Bungalow", "Penthouse", "Studio", "Duplex", "Terrace", "Loft", "Mansion", "Suite"]

    print(f"Seeding {count} properties...")
    for i in range(count):
        title = f"{random.choice(adjectives)} {random.choice(nouns)} in {random.choice(cities)}"
        city_idx = random.randint(0, len(cities)-1)
        
        p = Property.objects.create(
            owner=admin_user,
            title=title,
            description=f"This is a {random.choice(adjectives).lower()} property located in the heart of {cities[city_idx]}. It features {random.randint(1, 5)} bedrooms and {random.randint(1, 3)} bathrooms. Perfect for anyone looking for a {random.choice(['comfortable', 'luxurious', 'secure'])} living space.",
            property_type=random.choice(property_types),
            price=random.randint(50000, 2500000),
            address=f"{random.randint(1, 200)} {random.choice(['Victoria', 'Lekki', 'Maitama', 'Garki', 'Bodija'])} Close",
            city=cities[city_idx],
            state=states[city_idx],
            bedrooms=random.randint(1, 6),
            bathrooms=random.randint(1, 4),
            area_sqm=random.randint(60, 800),
            status='approved',
            is_verified=True,
            amenities=random.sample(["WiFi", "Parking", "Security", "Swimming Pool", "Gym", "Power Backup", "Borehole"], random.randint(3, 6))
        )
        
        # Add 1-3 images per property
        num_images = random.randint(1, 3)
        selected_ids = random.sample(image_ids, min(num_images, len(image_ids)))
        for j, img_id in enumerate(selected_ids):
            PropertyImage.objects.create(
                property=p,
                image=img_id,
                is_primary=(j == 0)
            )
        
        if (i + 1) % 10 == 0:
            print(f"Progress: {i + 1}/{count} properties created.")

    print("Seeding completed successfully!")

if __name__ == "__main__":
    seed_more(140) # Add 140 more to reach ~150 total
