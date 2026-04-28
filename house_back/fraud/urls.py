from django.urls import path
from . import views

urlpatterns = [
    path('analyze/<uuid:property_id>/', views.AnalyzePropertyView.as_view(), name='fraud-analyze'),
    path('report/', views.ReportPropertyView.as_view(), name='fraud-report'),
    path('admin/reports/', views.AdminFraudReportsView.as_view(), name='admin-fraud-reports'),
    path('admin/reports/<uuid:pk>/resolve/', views.AdminResolveReportView.as_view(), name='admin-resolve-report'),
]
