import os
import django
import cloudinary.uploader

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'nestverify.settings')
django.setup()

from properties.models import Property, PropertyImage

PROPERTY_IMAGES = {
    "Minimalist Apartment with City View": "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&q=80&w=1000",
    "Large Estate with Swimming Pool": "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=1000",
    "Compact Studio for Professionals": "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=1000",
    "Elegant 3 Bedroom Flat": "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&q=80&w=1000",
    "Shared Room in Student Area": "https://images.unsplash.com/photo-1555854816-809d28af9961?auto=format&fit=crop&q=80&w=1000",
    "Luxury Duplex with Penthouse": "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=1000",
    "Cozy Studio near University": "https://images.unsplash.com/photo-1536376074432-8f6405f6760a?auto=format&fit=crop&q=80&w=1000",
    "Spacious Family House with Garden": "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&q=80&w=1000",
    "Modern Apartment in Heart of City": "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&q=80&w=1000"
}

def fix_images():
    for title, url in PROPERTY_IMAGES.items():
        try:
            p = Property.objects.filter(title=title).first()
            if p:
                print(f"Fixing image for: {title}")
                # Remove old images if any
                p.images.all().delete()
                
                # Upload and create new
                upload_result = cloudinary.uploader.upload(url, folder="properties")
                PropertyImage.objects.create(
                    property=p,
                    image=upload_result['public_id'],
                    is_primary=True
                )
                print(f"Successfully updated: {title}")
            else:
                print(f"Property not found: {title}")
        except Exception as e:
            print(f"Error updating {title}: {e}")

if __name__ == "__main__":
    fix_images()
