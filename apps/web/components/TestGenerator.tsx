'use client'

import { useState } from 'react'
import { Sparkles, Globe, Settings, AlertCircle, Zap, ArrowRight } from 'lucide-react'

interface GenerationForm {
  url: string
  scenarios: number
  projectName?: string
  language: 'typescript' | 'javascript' | 'python' | 'java' | 'csharp'
}

export function TestGenerator() {
  const [form, setForm] = useState<GenerationForm>({
    url: '',
    scenarios: 5,
    projectName: '',
    language: 'typescript'
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!form.url.trim()) {
      setError('Please enter a website URL')
      return
    }
    
    setIsGenerating(true)

    try {
      console.log('Making request to:', 'http://localhost:8000/api/runs/')
      console.log('Request data:', {
        project_url: form.url,
        project_name: form.projectName,
        scenarios_count: form.scenarios
      })
      
      const response = await fetch(`http://localhost:8000/api/runs/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_url: form.url,
          project_name: form.projectName,
          scenarios_count: form.scenarios
        }),
      })

      console.log('Response status:', response.status)
      console.log('Response headers:', response.headers)

      if (!response.ok) {
        const responseText = await response.text()
        console.error('Error response:', responseText)
        throw new Error(`Failed to start generation: ${response.status} ${responseText}`)
      }

      const data = await response.json()
      console.log('Generation started:', data)
      
      // Show success message and redirect to results page
      setIsGenerating(false)
      alert('Test generation started successfully! Redirecting to results page...')
      window.location.href = '/results'
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setIsGenerating(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        <div className="flex items-center space-x-4 mb-8">
          <div className="flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl shadow-lg">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Generate Test Cases</h3>
            <p className="text-gray-600">Enter a website URL to start generating comprehensive Playwright tests</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* URL Input */}
          <div>
            <label htmlFor="url" className="block text-sm font-semibold text-gray-700 mb-2">
              Website URL
            </label>
            <input
              type="url"
              id="url"
              value={form.url}
              onChange={(e) => setForm(prev => ({ ...prev, url: e.target.value }))}
              placeholder="https://example.com"
              className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isGenerating}
            />
          </div>

          {/* Project Name */}
          <div>
            <label htmlFor="projectName" className="block text-sm font-semibold text-gray-700 mb-2">
              Project Name (Optional)
            </label>
            <input
              type="text"
              id="projectName"
              value={form.projectName || ''}
              onChange={(e) => setForm(prev => ({ ...prev, projectName: e.target.value }))}
              placeholder="My Test Project"
              className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isGenerating}
            />
          </div>

                     {/* Programming Language */}
           <div>
             <label htmlFor="language" className="block text-sm font-semibold text-gray-700 mb-2">
               Programming Language
             </label>
             <select
               id="language"
               value={form.language}
               onChange={(e) => setForm(prev => ({ ...prev, language: e.target.value as any }))}
               className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
               disabled={isGenerating}
             >
               <option value="typescript">TypeScript (Recommended)</option>
               <option value="javascript">JavaScript</option>
               <option value="python">Python</option>
               <option value="java">Java</option>
               <option value="csharp">C#</option>
             </select>
           </div>

           {/* Scenarios Count */}
           <div>
             <label htmlFor="scenarios" className="block text-sm font-semibold text-gray-700 mb-2">
               Number of Test Scenarios
             </label>
             <select
               id="scenarios"
               value={form.scenarios}
               onChange={(e) => setForm(prev => ({ ...prev, scenarios: parseInt(e.target.value) }))}
               className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
               disabled={isGenerating}
             >
               <option value={3}>3 scenarios (2 positive, 1 negative)</option>
               <option value={5}>5 scenarios (3 positive, 2 negative)</option>
               <option value={7}>7 scenarios (4 positive, 3 negative)</option>
               <option value={10}>10 scenarios (6 positive, 4 negative)</option>
             </select>
           </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Generate Button - ALWAYS BLUE */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isGenerating}
              className="w-full text-white font-bold py-4 px-6 rounded-lg shadow-lg transition-colors duration-200 flex items-center justify-center space-x-3"
              style={{
                backgroundColor: '#1D4ED8',
                opacity: isGenerating ? '0.6' : '1',
                cursor: isGenerating ? 'not-allowed' : 'pointer'
              }}
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  <span>Generating Test Cases...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-6 h-6" />
                  <span>Generate Test Cases</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
            
            <p className="text-center text-sm text-gray-500 mt-3">
              Click the button above to start generating Playwright tests
            </p>
          </div>
        </form>

        {/* Generation Progress */}
        {isGenerating && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <p className="text-blue-800">Generation in progress...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
