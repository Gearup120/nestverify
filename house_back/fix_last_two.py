import os
import django
import cloudinary.uploader

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'nestverify.settings')
django.setup()

from properties.models import Property, PropertyImage

EXTRA_IMAGES = {
    "Shared Room in Student Area": "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&q=80&w=1000",
    "Cozy Studio near University": "https://images.unsplash.com/photo-1522770179533-24471fcdba45?auto=format&fit=crop&q=80&w=1000"
}

def fix_last():
    for title, url in EXTRA_IMAGES.items():
        p = Property.objects.filter(title=title).first()
        if p:
            upload_result = cloudinary.uploader.upload(url, folder="properties")
            PropertyImage.objects.create(
                property=p,
                image=upload_result['public_id'],
                is_primary=True
            )
            print(f"Fixed {title}")

if __name__ == "__main__":
    fix_last()
