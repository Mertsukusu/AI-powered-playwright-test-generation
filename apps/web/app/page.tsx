'use client'

import { useState } from 'react'
import { Sparkles, Globe, Play, Download, Clock, CheckCircle, XCircle, Zap, Target, Shield, BarChart3, Users, TrendingUp } from 'lucide-react'
import { TestGenerator } from '@/components/TestGenerator'
import { RunList } from '@/components/RunList'

export default function Home() {
  const [activeTab, setActiveTab] = useState<'generate' | 'runs'>('generate')

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                     <div className="flex justify-between items-center h-32">
                         <div className="flex items-center space-x-6">
               <img src="/logo.png" alt="TestSynth Logo" className="w-32 h-32" />
               <h1 className="text-3xl font-bold text-gray-900">
                 AI Test Generator
               </h1>
             </div>
            
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('generate')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  activeTab === 'generate'
                    ? 'bg-primary-100 text-primary-700 shadow-md'
                    : 'text-gray-600 hover:text-primary-600 hover:bg-primary-50'
                }`}
              >
                Generate Tests
              </button>
              <button
                onClick={() => setActiveTab('runs')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  activeTab === 'runs'
                    ? 'bg-primary-100 text-primary-700 shadow-md'
                    : 'text-gray-600 hover:text-primary-600 hover:bg-primary-50'
                }`}
              >
                Test Runs
              </button>
              <a
                href="/results"
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 text-gray-600 hover:text-primary-600 hover:bg-primary-50"
              >
                Results
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'generate' ? (
          <div className="space-y-12">
            {/* Hero Section */}
            <div className="text-center">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Generate AI-Powered Playwright Tests
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Enter any website URL and automatically generate comprehensive test suites with Page Object Models, 
                positive and negative scenarios, and runnable Playwright tests.
              </p>
            </div>

                         {/* Features */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
               <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                 <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl mb-6 shadow-lg">
                   <Globe className="w-8 h-8 text-white" />
                 </div>
                 <h3 className="text-xl font-bold text-gray-900 mb-4">Smart Crawling</h3>
                 <p className="text-gray-600 leading-relaxed">
                   Automatically crawls up to 5 pages and discovers stable locators using semantic selectors.
                 </p>
               </div>
               
               <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                 <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl mb-6 shadow-lg">
                   <Sparkles className="w-8 h-8 text-white" />
                 </div>
                 <h3 className="text-xl font-bold text-gray-900 mb-4">AI Generation</h3>
                 <p className="text-gray-600 leading-relaxed">
                   Uses GPT-5 mini to generate Page Object Models and realistic test scenarios.
                 </p>
               </div>
               
               <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                 <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl mb-6 shadow-lg">
                   <Play className="w-8 h-8 text-white" />
                 </div>
                 <h3 className="text-xl font-bold text-gray-900 mb-4">Ready to Run</h3>
                 <p className="text-gray-600 leading-relaxed">
                   Generates complete TypeScript Playwright tests with 3 positive and 2 negative scenarios.
                 </p>
               </div>
             </div>

             {/* Test Generator */}
             <TestGenerator />

             {/* Benefits Section */}
             <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 p-8">
               <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">Benefits</h3>
               
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                 {/* Card 1 */}
                 <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
                   <div className="flex items-center space-x-3 mb-4">
                     <div className="flex items-center justify-center w-12 h-12 bg-blue-500 rounded-lg shadow-md">
                       <Target className="w-6 h-6 text-white" />
                     </div>
                     <h4 className="text-lg font-bold text-blue-900">Improve Test Coverage</h4>
                   </div>
                   <p className="text-blue-800 mb-4">Cross-browser, real device, visual, accessibility testing</p>
                   <div className="bg-white/60 rounded-lg p-3">
                     <div className="flex items-center justify-between text-sm">
                       <span className="text-blue-700 font-medium">Coverage</span>
                       <span className="text-blue-900 font-bold">95%+</span>
                     </div>
                     <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                       <div className="bg-blue-500 h-2 rounded-full" style={{width: '95%'}}></div>
                     </div>
                   </div>
                 </div>

                 {/* Card 2 */}
                 <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
                   <div className="flex items-center space-x-3 mb-4">
                     <div className="flex items-center justify-center w-12 h-12 bg-purple-500 rounded-lg shadow-md">
                       <Zap className="w-6 h-6 text-white" />
                     </div>
                     <h4 className="text-lg font-bold text-purple-900">Boost Productivity with AI</h4>
                   </div>
                   <p className="text-purple-800 mb-4">AI agents across the testing lifecycle harnessing a unified data store</p>
                   <div className="bg-white/60 rounded-lg p-3">
                     <div className="flex items-center justify-between text-sm">
                       <span className="text-purple-700 font-medium">Time Saved</span>
                       <span className="text-purple-900 font-bold">80%</span>
                     </div>
                     <div className="w-full bg-purple-200 rounded-full h-2 mt-2">
                       <div className="bg-purple-500 h-2 rounded-full" style={{width: '80%'}}></div>
                     </div>
                   </div>
                 </div>

                 {/* Card 3 */}
                 <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
                   <div className="flex items-center space-x-3 mb-4">
                     <div className="flex items-center justify-center w-12 h-12 bg-green-500 rounded-lg shadow-md">
                       <TrendingUp className="w-6 h-6 text-white" />
                     </div>
                     <h4 className="text-lg font-bold text-green-900">Accelerate Testing Cycles</h4>
                   </div>
                   <p className="text-green-800 mb-4">Achieve faster and reliable test automation at scale</p>
                   <div className="bg-white/60 rounded-lg p-3">
                     <div className="flex items-center justify-between text-sm">
                       <span className="text-green-700 font-medium">Speed</span>
                       <span className="text-green-900 font-bold">10x</span>
                     </div>
                     <div className="w-full bg-green-200 rounded-full h-2 mt-2">
                       <div className="bg-green-500 h-2 rounded-full" style={{width: '90%'}}></div>
                     </div>
                   </div>
                 </div>
               </div>

               {/* Stats Table */}
               <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                 <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                   <h4 className="text-lg font-bold text-gray-900">Performance Metrics</h4>
                 </div>
                 <div className="overflow-x-auto">
                   <table className="w-full">
                     <thead className="bg-gray-50">
                       <tr>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Metric</th>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Before AI</th>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">With AI</th>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Improvement</th>
                       </tr>
                     </thead>
                     <tbody className="bg-white divide-y divide-gray-200">
                       <tr className="hover:bg-gray-50">
                         <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Test Creation Time</td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">4-6 hours</td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">10-15 minutes</td>
                         <td className="px-6 py-4 whitespace-nowrap">
                           <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                             <TrendingUp className="w-3 h-3 mr-1" />
                             90% faster
                           </span>
                         </td>
                       </tr>
                       <tr className="hover:bg-gray-50">
                         <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Test Coverage</td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">60-70%</td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">95%+</td>
                         <td className="px-6 py-4 whitespace-nowrap">
                           <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                             <Target className="w-3 h-3 mr-1" />
                             35% increase
                           </span>
                         </td>
                       </tr>
                       <tr className="hover:bg-gray-50">
                         <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Maintenance Effort</td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">High</td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Low</td>
                         <td className="px-6 py-4 whitespace-nowrap">
                           <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                             <Shield className="w-3 h-3 mr-1" />
                             75% reduction
                           </span>
                         </td>
                       </tr>
                       <tr className="hover:bg-gray-50">
                         <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Bug Detection</td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">70%</td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">95%</td>
                         <td className="px-6 py-4 whitespace-nowrap">
                           <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                             <CheckCircle className="w-3 h-3 mr-1" />
                             25% increase
                           </span>
                         </td>
                       </tr>
                     </tbody>
                   </table>
                 </div>
               </div>
             </div>
          </div>
        ) : (
          <RunList />
        )}
      </main>
    </div>
  )
}
