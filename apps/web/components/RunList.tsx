'use client'

import { useState, useEffect } from 'react'
import { Download, Clock, CheckCircle, XCircle, Play, FileText, Folder } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Run {
  id: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  project: {
    name: string
    url: string
  }
  scenarios_count: number
  started_at: string
  completed_at: string
  error_message: string
  artifacts: Artifact[]
  crawls: Crawl[]
}

interface Artifact {
  id: string
  artifact_type: string
  filename: string
  file_path: string
  file_size: number
  created_at: string
}

interface Crawl {
  id: string
  url: string
  page_title: string
  elements_count: number
  created_at: string
}

export function RunList() {
  const [runs, setRuns] = useState<Run[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchRuns()
  }, [])

  const fetchRuns = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/runs/`)
      if (!response.ok) {
        throw new Error('Failed to fetch runs')
      }
      const data = await response.json()
      setRuns(data.results || data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load runs')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />
      case 'running':
        return <Play className="w-5 h-5 text-blue-500 animate-pulse" />
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-gray-500" />
      default:
        return <Clock className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'running':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const downloadArtifact = async (artifact: Artifact) => {
    try {
              const response = await fetch(`http://localhost:8000/api/artifacts/${artifact.id}/download/`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = artifact.filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (err) {
      console.error('Failed to download artifact:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchRuns}
          className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Retry
        </button>
      </div>
    )
  }

  if (runs.length === 0) {
    return (
      <div className="text-center py-12">
        <Folder className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No test runs yet</h3>
        <p className="text-gray-600">Generate your first test suite to see results here.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Test Runs</h2>
        <button
          onClick={fetchRuns}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Refresh
        </button>
      </div>

      <div className="grid gap-6">
        {runs.map((run) => (
          <div key={run.id} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                {getStatusIcon(run.status)}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {run.project.name}
                  </h3>
                  <p className="text-sm text-gray-600">{run.project.url}</p>
                </div>
              </div>
              <span className={cn(
                "px-3 py-1 rounded-full text-xs font-medium",
                getStatusColor(run.status)
              )}>
                {run.status}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500">Scenarios</p>
                <p className="font-medium">{run.scenarios_count}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Started</p>
                <p className="font-medium">{formatDate(run.started_at)}</p>
              </div>
              {run.completed_at && (
                <div>
                  <p className="text-sm text-gray-500">Completed</p>
                  <p className="font-medium">{formatDate(run.completed_at)}</p>
                </div>
              )}
            </div>

            {run.error_message && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{run.error_message}</p>
              </div>
            )}

            {run.crawls && run.crawls.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Crawled Pages</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {run.crawls.map((crawl) => (
                    <div key={crawl.id} className="text-sm text-gray-600">
                      <p className="font-medium">{crawl.page_title}</p>
                      <p className="text-xs">{crawl.url}</p>
                      <p className="text-xs text-gray-500">{crawl.elements_count} elements</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {run.artifacts && run.artifacts.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Generated Artifacts</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {run.artifacts.map((artifact) => (
                    <div
                      key={artifact.id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-700">{artifact.filename}</span>
                      </div>
                      <button
                        onClick={() => downloadArtifact(artifact)}
                        className="p-1 text-gray-500 hover:text-gray-700"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
