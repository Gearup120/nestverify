import os
from pathlib import Path
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from properties.models import Property


def get_api_key():
    """Read GROQ_API_KEY directly from .env file."""
    key = os.environ.get('GROQ_API_KEY', '')
    if key:
        return key
    base_dir = Path(__file__).resolve().parent.parent
    env_file = base_dir / '.env'
    if env_file.exists():
        with open(env_file) as f:
            for line in f:
                line = line.strip()
                if line.startswith('GROQ_API_KEY='):
                    return line.split('=', 1)[1].strip()
    return ''


SYSTEM_PROMPT = """You are NestAI, a smart and friendly housing assistant for NestVerify — a verified rental platform in Nigeria.

You help users with:
1. Finding the right property based on their needs (budget, location, size, amenities)
2. Answering questions about specific listings
3. General housing advice (renting tips, lease agreements, red flags to watch for)
4. Life questions and general assistance — you are helpful, warm, and conversational

RECOMMENDATION RULES:
- When you recommend a specific property from the list below, you MUST include the property ID in this exact format: [PROPERTY_CARD: <id>]
- If you find multiple matches, you can include multiple tags.
- If no matches are found, tell the user politely and offer general advice.

Always be concise, friendly, and helpful.
Respond in plain text, avoid excessive markdown.
"""


def get_available_properties_context():
    try:
        props = Property.objects.filter(status='approved').values(
            'id', 'title', 'city', 'state', 'price', 'bedrooms',
            'bathrooms', 'property_type', 'amenities'
        )[:30]
        if not props:
            return "No approved listings currently available."
        lines = ["Currently available properties on NestVerify:"]
        for p in props:
            lines.append(
                f"- ID: {p['id']} | {p['title']} | {p['city']}, {p['state']} | "
                f"N{p['price']:,}/mo | {p['bedrooms']}bed {p['bathrooms']}bath | "
                f"{p['property_type']} | Amenities: {', '.join(p['amenities'] or [])}"
            )
        return "\n".join(lines)
    except Exception:
        return ""


class AIAssistantView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        messages = request.data.get('messages', [])
        if not messages:
            return Response({'error': 'messages array is required.'}, status=400)

        api_key = get_api_key()
        if not api_key:
            return Response({
                'error': 'AI service not configured. Add GROQ_API_KEY to .env'
            }, status=500)

        property_context = get_available_properties_context()
        full_system = f"{SYSTEM_PROMPT}\n\n{property_context}"

        try:
            # Forcefully remove proxy environment variables that cause the Groq client to crash on Render
            for var in ['HTTP_PROXY', 'HTTPS_PROXY', 'http_proxy', 'https_proxy']:
                os.environ.pop(var, None)

            from groq import Groq
            client = Groq(api_key=api_key)

            response = client.chat.completions.create(
                model='llama-3.1-8b-instant',
                messages=[
                    {'role': 'system', 'content': full_system},
                    *messages
                ],
                max_tokens=1024,
                temperature=0.7,
            )

            reply = response.choices[0].message.content
            return Response({'reply': reply})

        except Exception as e:
            return Response({'error': f'AI service error: {str(e)}'}, status=500)