from django.urls import path
from .views import (
    PropertyListCreateView,
    MyPropertiesView,
    PropertyDetailView,
    AdminPendingPropertiesView,
    AdminApprovePropertyView,
    SavedPropertyToggleView,
    SavedPropertiesListView,
)

urlpatterns = [
    path('', PropertyListCreateView.as_view(), name='property-list-create'),
    path('mine/', MyPropertiesView.as_view(), name='my-properties'),
    path('saved/', SavedPropertiesListView.as_view(), name='saved-properties'),
    path('saved/<uuid:pk>/', SavedPropertyToggleView.as_view(), name='toggle-save-property'),
    path('<uuid:pk>/', PropertyDetailView.as_view(), name='property-detail'),
    path('admin/pending/', AdminPendingPropertiesView.as_view(), name='admin-pending-properties'),
    path('admin/<uuid:pk>/review/', AdminApprovePropertyView.as_view(), name='admin-review-property'),
]