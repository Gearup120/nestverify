from django.urls import path
from . import views

urlpatterns = [
    path('', views.BookViewingView.as_view(), name='book-viewing'),
    path('mine/', views.MyViewingsView.as_view(), name='my-viewings'),
    path('landlord/', views.LandlordViewingsView.as_view(), name='landlord-viewings'),
    path('<uuid:pk>/respond/', views.RespondViewingView.as_view(), name='respond-viewing'),
    path('<uuid:pk>/cancel/', views.CancelViewingView.as_view(), name='cancel-viewing'),
]