#!/usr/bin/env bash
# exit on error
set -o errexit

pip install -r requirements.txt

python manage.py collectstatic --no-input
python manage.py migrate

# Auto-create superuser if it doesn't exist
python manage.py shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.filter(email='super@nestverify.com').exists() or User.objects.create_superuser('super@nestverify.com', 'SuperPassword123!', first_name='Super', last_name='Admin')"
