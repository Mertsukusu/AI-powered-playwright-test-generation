from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
import requests
import os
from .models import Project, Run, Crawl, Artifact
from .serializers import (
    ProjectSerializer, RunSerializer, CreateRunSerializer,
    CrawlSerializer, ArtifactSerializer
)


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer


class RunViewSet(viewsets.ModelViewSet):
    queryset = Run.objects.all()
    serializer_class = RunSerializer

    def get_serializer_class(self):
        if self.action == 'create':
            return CreateRunSerializer
        return RunSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        run = serializer.save()
        
        # Start generation process
        try:
            self._start_generation(run)
            return Response(RunSerializer(run).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            run.status = 'failed'
            run.error_message = str(e)
            run.save()
            return Response(
                {'error': f'Failed to start generation: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def _start_generation(self, run):
        """Start the test generation process via generator service"""
        generator_url = os.getenv('NEXT_PUBLIC_GENERATOR_URL', 'http://generator:3001')
        
        payload = {
            'projectId': str(run.project.id),
            'runId': str(run.id),
            'url': run.project.url,
            'scenarios': run.scenarios_count
        }
        
        try:
            response = requests.post(
                f'{generator_url}/generate',
                json=payload,
                timeout=30
            )
            response.raise_for_status()
            
            run.status = 'running'
            run.started_at = timezone.now()
            run.save()
            
        except requests.exceptions.RequestException as e:
            raise Exception(f"Generator service error: {str(e)}")

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        run = self.get_object()
        if run.status in ['pending', 'running']:
            run.status = 'cancelled'
            run.save()
            return Response({'status': 'cancelled'})
        return Response(
            {'error': 'Cannot cancel completed or failed runs'}, 
            status=status.HTTP_400_BAD_REQUEST
        )

    @action(detail=True, methods=['get'])
    def artifacts(self, request, pk=None):
        run = self.get_object()
        artifacts = run.artifacts.all()
        serializer = ArtifactSerializer(artifacts, many=True)
        return Response(serializer.data)


class CrawlViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Crawl.objects.all()
    serializer_class = CrawlSerializer


class ArtifactViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Artifact.objects.all()
    serializer_class = ArtifactSerializer
