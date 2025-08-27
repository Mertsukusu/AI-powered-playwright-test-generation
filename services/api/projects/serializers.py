from rest_framework import serializers
from .models import Project, Run, Crawl, Artifact


class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ['id', 'name', 'url', 'created_at', 'updated_at']


class CrawlSerializer(serializers.ModelSerializer):
    class Meta:
        model = Crawl
        fields = ['id', 'url', 'page_title', 'elements_count', 'created_at']


class ArtifactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Artifact
        fields = ['id', 'artifact_type', 'filename', 'file_path', 'file_size', 'content', 'created_at']


class RunSerializer(serializers.ModelSerializer):
    project = ProjectSerializer(read_only=True)
    crawls = CrawlSerializer(many=True, read_only=True)
    artifacts = ArtifactSerializer(many=True, read_only=True)

    class Meta:
        model = Run
        fields = [
            'id', 'project', 'status', 'scenarios_count', 'started_at', 
            'completed_at', 'error_message', 'page_objects', 'scenarios', 'test_results',
            'created_at', 'updated_at', 'crawls', 'artifacts'
        ]


class CreateRunSerializer(serializers.ModelSerializer):
    project_url = serializers.URLField(write_only=True)
    project_name = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = Run
        fields = ['project_url', 'project_name', 'scenarios_count']

    def create(self, validated_data):
        project_url = validated_data.pop('project_url')
        project_name = validated_data.pop('project_name', None)
        
        if not project_name:
            from urllib.parse import urlparse
            parsed_url = urlparse(project_url)
            project_name = parsed_url.netloc

        project, created = Project.objects.get_or_create(
            url=project_url,
            defaults={'name': project_name}
        )

        return Run.objects.create(project=project, **validated_data)
