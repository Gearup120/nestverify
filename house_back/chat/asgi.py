# import os
# import django

# os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'nestverify.settings')
# django.setup()

# from django.core.asgi import get_asgi_application
# from channels.routing import ProtocolTypeRouter, URLRouter
# from channels.security.websocket import AllowedHostsOriginValidator
# from chat.routing import websocket_urlpatterns
# from chat.middleware import JWTAuthMiddleware

# application = ProtocolTypeRouter({
#     'http': get_asgi_application(),
#     'websocket': AllowedHostsOriginValidator(
#         JWTAuthMiddleware(
#             URLRouter(websocket_urlpatterns)
#         )
#     ),
# })