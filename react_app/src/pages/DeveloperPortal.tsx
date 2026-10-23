import React, { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { SandboxBanner } from '@/components/common/SandboxBanner'
import { 
  Code2, 
  Copy, 
  Check, 
  ExternalLink
} from 'lucide-react'

export const DeveloperPortal: React.FC = () => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(id)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const curlExample = `curl -X POST "https://api.trustbroker.ai/v1/deliveries/verify" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "contract_id": "TB-2026-084",
    "milestone_id": "ms-2",
    "repo_url": "https://github.com/devstudio/react-landing-verified",
    "live_url": "https://react-landing-demo.vercel.app",
    "evidence_notes": "Completed React 18 frontend with strict TypeScript compiler validation."
  }'`

  const pythonExample = `import httpx

client = httpx.Client(base_url="https://api.trustbroker.ai/v1")
response = client.post(
    "/ai/draft-sow",
    headers={"Authorization": "Bearer YOUR_API_KEY"},
    json={
        "brief": "I need a React 18 landing page with Tailwind CSS, strict TypeScript checks, and PayPal checkout.",
        "budget": 3200,
        "currency": "USD"
    }
)
sow_data = response.json()
print("Drafted Milestones:", len(sow_data["milestones"]))`

  return (
    <div className="min-h-screen bg-[#F6F8FC] text-[#1A2940] flex flex-col font-sans">
      <Header />

      <main className="w-full pt-[68px] flex-1">
        <SandboxBanner />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-10">
          {/* Header */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs font-mono text-blue-600 font-semibold">
              <Code2 className="w-4 h-4" />
              <span>DEVELOPER RESOURCES &bull; REST API V1</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1A2940]">
              TrustBroker AI Developer Portal
            </h1>
            <p className="text-sm sm:text-base text-[#5D6B82] max-w-2xl leading-relaxed">
              Programmatic interface for agentic commerce, AI statement of work synthesis, and conditional PayPal release orchestration.
            </p>
          </div>

          {/* Quick Links Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col gap-2">
              <span className="text-xs font-mono text-blue-600 font-bold uppercase">OpenAPI 3.1</span>
              <h3 className="text-sm font-bold text-slate-900">FastAPI OpenAPI Spec</h3>
              <p className="text-xs text-slate-500">Auto-generated interactive Swagger schema.</p>
              <a
                href="#swagger"
                className="text-xs text-blue-600 font-semibold hover:underline inline-flex items-center gap-1 mt-2"
              >
                <span>Explore /docs</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col gap-2">
              <span className="text-xs font-mono text-emerald-600 font-bold uppercase">PayPal API</span>
              <h3 className="text-sm font-bold text-slate-900">Orders v2 Sandbox</h3>
              <p className="text-xs text-slate-500">Direct server-to-server webhook endpoints.</p>
              <a
                href="https://developer.paypal.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 font-semibold hover:underline inline-flex items-center gap-1 mt-2"
              >
                <span>PayPal Dev Portal</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col gap-2">
              <span className="text-xs font-mono text-indigo-600 font-bold uppercase">Gemini AI</span>
              <h3 className="text-sm font-bold text-slate-900">Gemini 1.5 Pro JSON Mode</h3>
              <p className="text-xs text-slate-500">Structured criteria evaluation schemas.</p>
              <a
                href="https://ai.google.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 font-semibold hover:underline inline-flex items-center gap-1 mt-2"
              >
                <span>Google AI Studio</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Core Endpoints Table */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#DDE4EF] flex flex-col gap-4">
            <h3 className="text-base font-bold text-[#1A2940]">Key REST Endpoints</h3>
            <div className="flex flex-col divide-y divide-slate-100 text-xs">
              <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    POST
                  </span>
                  <span className="font-mono font-semibold text-slate-900">/api/ai/draft-sow</span>
                </div>
                <span className="text-slate-500">Parses natural language brief into structured milestones and criteria.</span>
              </div>

              <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                    POST
                  </span>
                  <span className="font-mono font-semibold text-slate-900">/api/payments/create-order</span>
                </div>
                <span className="text-slate-500">Stages pre-authorized reserve funds using PayPal Orders API.</span>
              </div>

              <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                    POST
                  </span>
                  <span className="font-mono font-semibold text-slate-900">/api/deliveries/verify</span>
                </div>
                <span className="text-slate-500">Evaluates evidence artifacts and outputs pass/fail gate decision.</span>
              </div>

              <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded">
                    POST
                  </span>
                  <span className="font-mono font-semibold text-slate-900">/api/payments/release-milestone</span>
                </div>
                <span className="text-slate-500">Captures and disburses payment to supplier once criteria pass.</span>
              </div>
            </div>
          </div>

          {/* Interactive Code Snippets */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* cURL Example */}
            <div className="bg-[#0E1B35] rounded-2xl p-5 border border-slate-800 text-white flex flex-col justify-between">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="font-mono text-xs text-blue-400 font-semibold">cURL Request</span>
                <button
                  onClick={() => copyCode(curlExample, 'curl')}
                  className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
                >
                  {copiedCode === 'curl' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="py-4 font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed">
                {curlExample}
              </pre>
            </div>

            {/* Python Example */}
            <div className="bg-[#0E1B35] rounded-2xl p-5 border border-slate-800 text-white flex flex-col justify-between">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="font-mono text-xs text-emerald-400 font-semibold">Python Client (httpx)</span>
                <button
                  onClick={() => copyCode(pythonExample, 'python')}
                  className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
                >
                  {copiedCode === 'python' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="py-4 font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed">
                {pythonExample}
              </pre>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
