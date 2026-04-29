#!/usr/bin/env bash
# exit on error
set -o errexit

pip install -r requirements.txt

python manage.py collectstatic --no-input
python manage.py migrate

# Auto-create superuser if it doesn't exist
python manage.py shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); u, _ = User.objects.get_or_create(email='super@nestverify.com', defaults={'first_name':'Super', 'last_name':'Admin', 'is_staff':True, 'is_superuser':True, 'role':'admin', 'is_email_verified':True}); u.set_password('SuperPassword123!'); u.is_email_verified=True; u.save()"

# Run the mixed seeder
python seed_mixed.py
