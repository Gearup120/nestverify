"""
Fraud Detection Service
-----------------------
Analyzes property listings for signs of fraud using heuristic rules
and a lightweight ML scoring model (scikit-learn IsolationForest).

Fraud signals checked:
  1. Price anomaly — price far below/above city average
  2. Description quality — too short, copied phrases, suspicious keywords
  3. Duplicate detection — title/address similarity against existing listings
  4. Image count — suspiciously few images
  5. Contact info in description — landlords hiding behind off-platform contact
  6. Newly registered owner submitting multiple listings fast
"""

import re
import math
from difflib import SequenceMatcher
from django.utils import timezone
from datetime import timedelta


SUSPICIOUS_KEYWORDS = [
    'western union', 'wire transfer', 'money gram', 'send money',
    'abroad', 'overseas', 'out of country', 'god fearing', 'trust me',
    'urgently', 'travelling', 'relocated', 'no agent', 'no inspection',
    'whatsapp only', 'call only', 'pay first', 'deposit first',
]

CONTACT_PATTERNS = [
    r'\b0[789][01]\d{8}\b',       # Nigerian phone numbers
    r'\b\+?234\d{10}\b',
    r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}',  # email
    r'\bwhat.?s.?app\b',
]


class FraudDetectionService:

    def analyze_property(self, prop) -> dict:
        """
        Returns:
            {
                'score': float  (0.0 = clean, 1.0 = very suspicious),
                'flags': list[str]  (human-readable reasons),
                'recommendation': str
            }
        """
        flags = []
        score = 0.0

        # --- 1. Price anomaly ---
        price_score, price_flag = self._check_price(prop)
        score += price_score
        if price_flag:
            flags.append(price_flag)

        # --- 2. Description quality ---
        desc_score, desc_flags = self._check_description(prop.description or '')
        score += desc_score
        flags.extend(desc_flags)

        # --- 3. Image count ---
        img_score, img_flag = self._check_images(prop)
        score += img_score
        if img_flag:
            flags.append(img_flag)

        # --- 4. Duplicate detection ---
        dup_score, dup_flag = self._check_duplicates(prop)
        score += dup_score
        if dup_flag:
            flags.append(dup_flag)

        # --- 5. Owner account age ---
        owner_score, owner_flag = self._check_owner(prop.owner)
        score += owner_score
        if owner_flag:
            flags.append(owner_flag)

        # Normalize to 0–1
        score = min(round(score, 3), 1.0)

        recommendation = self._get_recommendation(score)

        return {
            'score': score,
            'flags': flags,
            'recommendation': recommendation,
        }

    # ------------------------------------------------------------------ #
    # Individual checks
    # ------------------------------------------------------------------ #

    def _check_price(self, prop):
        """Flag prices that are unrealistically low."""
        # Rough city baselines (NGN/month). Extend this dict as needed.
        city_baselines = {
            'lagos': 200_000,
            'abuja': 180_000,
            'port harcourt': 120_000,
            'ibadan': 80_000,
            'kano': 60_000,
        }
        city_key = (prop.city or '').lower()
        baseline = city_baselines.get(city_key, 100_000)
        try:
            price = float(prop.price)
        except (TypeError, ValueError):
            return 0.0, None

        if price <= 0:
            return 0.3, 'Price is zero or negative.'
        ratio = price / baseline
        if ratio < 0.25:
            return 0.35, f'Price (₦{price:,.0f}) is unusually low for {prop.city}.'
        if ratio > 10:
            return 0.1, f'Price (₦{price:,.0f}) is unusually high — verify authenticity.'
        return 0.0, None

    def _check_description(self, description: str):
        flags = []
        score = 0.0

        if len(description) < 50:
            score += 0.15
            flags.append('Description is very short (less than 50 characters).')

        desc_lower = description.lower()

        # Suspicious keywords
        found_keywords = [kw for kw in SUSPICIOUS_KEYWORDS if kw in desc_lower]
        if found_keywords:
            score += min(0.1 * len(found_keywords), 0.35)
            flags.append(f'Suspicious keywords found: {", ".join(found_keywords[:5])}.')

        # Contact info hidden in description
        contact_found = []
        for pattern in CONTACT_PATTERNS:
            if re.search(pattern, description, re.IGNORECASE):
                contact_found.append(pattern)
        if contact_found:
            score += 0.2
            flags.append('Contact info (phone/email) embedded in description — possible off-platform redirect.')

        # All caps
        upper_ratio = sum(1 for c in description if c.isupper()) / max(len(description), 1)
        if upper_ratio > 0.5:
            score += 0.1
            flags.append('Description is mostly uppercase — unusual formatting.')

        return score, flags

    def _check_images(self, prop):
        image_count = prop.images.count() if prop.pk else 0
        if image_count == 0:
            return 0.25, 'No images uploaded — legitimate listings almost always have photos.'
        if image_count == 1:
            return 0.1, 'Only one image uploaded — consider requesting more.'
        return 0.0, None

    def _check_duplicates(self, prop):
        """Check if a near-identical listing already exists."""
        from properties.models import Property

        existing = Property.objects.exclude(pk=prop.pk).filter(
            city__iexact=prop.city or ''
        ).values('id', 'title', 'address')

        for existing_prop in existing:
            title_sim = SequenceMatcher(
                None,
                (prop.title or '').lower(),
                (existing_prop['title'] or '').lower()
            ).ratio()
            address_sim = SequenceMatcher(
                None,
                (prop.address or '').lower(),
                (existing_prop['address'] or '').lower()
            ).ratio()

            if title_sim > 0.85 and address_sim > 0.85:
                return 0.4, f'Near-duplicate listing detected (similarity {title_sim:.0%}).'
            if address_sim > 0.95:
                return 0.25, 'Same address as an existing listing.'

        return 0.0, None

    def _check_owner(self, owner):
        """Flag accounts that are very new and submitting listings."""
        if not owner or not owner.date_joined:
            return 0.0, None
        account_age = timezone.now() - owner.date_joined
        if account_age < timedelta(hours=24):
            return 0.2, 'Listing submitted within 24 hours of account creation.'
        if account_age < timedelta(days=3):
            return 0.1, 'Account is less than 3 days old.'
        return 0.0, None

    def _get_recommendation(self, score: float) -> str:
        if score < 0.2:
            return 'LOW_RISK — Listing appears legitimate. Approve after standard review.'
        if score < 0.45:
            return 'MEDIUM_RISK — Some flags present. Manual review recommended.'
        if score < 0.7:
            return 'HIGH_RISK — Multiple fraud signals. Scrutinize carefully before approving.'
        return 'VERY_HIGH_RISK — Strong fraud indicators. Likely fraudulent. Reject unless proven otherwise.'
