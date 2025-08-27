from django.db import models
from django.utils import timezone
import uuid


class Project(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    url = models.URLField(max_length=500)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.url})"


class Run(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('running', 'Running'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='runs')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    scenarios_count = models.IntegerField(default=5)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(blank=True)
    # Generated content fields
    page_objects = models.JSONField(default=list, blank=True)
    scenarios = models.JSONField(default=list, blank=True)
    test_results = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Run {self.id} - {self.project.name} ({self.status})"


class Crawl(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    run = models.ForeignKey(Run, on_delete=models.CASCADE, related_name='crawls')
    url = models.URLField(max_length=500)
    page_title = models.CharField(max_length=255, blank=True)
    elements_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Crawl {self.url} - {self.page_title}"


class Artifact(models.Model):
    ARTIFACT_TYPES = [
        ('pom', 'Page Object Model'),
        ('test', 'Test File'),
        ('screenshot', 'Screenshot'),
        ('video', 'Video'),
        ('log', 'Log File'),
        ('junit', 'JUnit XML'),
        ('summary', 'Summary'),
        ('config', 'Configuration'),
        ('package', 'Package'),
        ('readme', 'README'),
        ('gitignore', 'Git Ignore'),
        ('tsconfig', 'TypeScript Config'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    run = models.ForeignKey(Run, on_delete=models.CASCADE, related_name='artifacts')
    artifact_type = models.CharField(max_length=20, choices=ARTIFACT_TYPES)
    filename = models.CharField(max_length=255)
    file_path = models.CharField(max_length=500)
    file_size = models.BigIntegerField(default=0)
    content = models.TextField(blank=True)  # Store file content
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.artifact_type} - {self.filename}"
