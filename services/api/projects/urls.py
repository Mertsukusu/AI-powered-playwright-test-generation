from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProjectViewSet, RunViewSet, CrawlViewSet, ArtifactViewSet

router = DefaultRouter()
router.register(r'projects', ProjectViewSet)
router.register(r'runs', RunViewSet)
router.register(r'crawls', CrawlViewSet)
router.register(r'artifacts', ArtifactViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
