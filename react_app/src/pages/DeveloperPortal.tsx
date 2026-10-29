import React, { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Code2, Copy, Check, Key, Terminal, Send } from 'lucide-react'
import { toast } from 'sonner'

export const DeveloperPortal: React.FC = () => {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    toast.success('Snippet copied to clipboard')
    setTimeout(() => setCopiedId(null), 2000)
  }

  const curlDraftSow = `curl -X POST "https://api.trustbroker.ai/v1/contracts/draft" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "brief": "React web application with PayPal checkout flow and TypeScript validation.",
    "budget": 3400,
    "currency": "USD"
  }'`

  const curlVerify = `curl -X POST "https://api.trustbroker.ai/v1/deliveries/verify" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "contract_id": "TB-2026-084",
    "milestone_id": "ms-2",
    "repo_url": "https://github.com/devstudio/react-landing-verified",
    "live_url": "https://react-landing-demo.vercel.app"
  }'`

  const pythonSdk = `from trustbroker import TrustBrokerClient

client = TrustBrokerClient(api_key="YOUR_API_KEY")

# 1. Generate contract from plain language
contract = client.contracts.create_from_brief(
    brief="Next.js SaaS dashboard with PayPal Orders v2",
    budget=4500,
    currency="USD"
)
print(f"Created contract: {contract.id} with {len(contract.milestones)} milestones")`

  return (
    <div className="min-h-screen bg-[#F6F8FC] text-[#1A2940] flex flex-col font-sans">
      <Header />

      <main className="w-full pt-[68px] flex-1">
        {/* Hero */}
        <section className="py-12 bg-white border-b border-[#DDE4EF]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
            <Badge variant="outline" className="px-3.5 py-1 rounded-full bg-blue-50 border-blue-200 text-blue-700 text-xs font-semibold gap-1.5">
              <Code2 className="w-3.5 h-3.5 text-blue-600" />
              REST API &amp; SDKs
            </Badge>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1A2940]">
              TrustBroker Developer Platform
            </h1>
            <p className="text-sm text-[#5D6B82] max-w-2xl leading-relaxed">
              Integrate AI contract drafting, PayPal milestone payments and automated delivery evaluation directly into your marketplace or agency workflow.
            </p>
          </div>
        </section>

        {/* Content Tabs */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="bg-slate-100 p-1 border border-slate-200">
              <TabsTrigger value="overview" className="text-xs font-medium">Overview</TabsTrigger>
              <TabsTrigger value="endpoints" className="text-xs font-medium">API Endpoints</TabsTrigger>
              <TabsTrigger value="authentication" className="text-xs font-medium">Authentication</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-[#DDE4EF] bg-white">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-blue-600" />
                      REST API
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Predictable JSON endpoints with standard HTTP status codes.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-xs text-slate-600">
                    Base URL: <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-600 font-mono">https://api.trustbroker.ai/v1</code>
                  </CardContent>
                </Card>

                <Card className="border-[#DDE4EF] bg-white">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <Send className="w-4 h-4 text-emerald-600" />
                      Webhooks
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Instant events for milestone verification and payment releases.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-xs text-slate-600">
                    Real-time HMAC SHA-256 signed event payloads.
                  </CardContent>
                </Card>

                <Card className="border-[#DDE4EF] bg-white">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <Key className="w-4 h-4 text-indigo-600" />
                      PayPal Orders v2
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Native PayPal SDK compatibility with server authorization.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-xs text-slate-600">
                    Seamless staging and capture synchronization.
                  </CardContent>
                </Card>
              </div>

              {/* Code Sample Card */}
              <Card className="border-[#DDE4EF] bg-white">
                <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold">Python SDK Quickstart</CardTitle>
                    <CardDescription className="text-xs">Create a contract from natural language in 3 lines.</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyCode(pythonSdk, 'py')}
                    className="h-7 text-xs gap-1 border-slate-200"
                  >
                    {copiedId === 'py' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedId === 'py' ? 'Copied' : 'Copy'}
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <pre className="p-4 bg-slate-900 text-slate-100 rounded-b-xl text-xs font-mono overflow-x-auto leading-relaxed">
                    {pythonSdk}
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Endpoints Tab */}
            <TabsContent value="endpoints" className="space-y-6">
              <Card className="border-[#DDE4EF] bg-white">
                <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-600 text-white font-mono text-[10px]">POST</Badge>
                      <span className="font-mono text-xs font-semibold text-slate-800">/contracts/draft</span>
                    </div>
                    <CardDescription className="text-xs">Generate an SOW draft with milestones from brief.</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyCode(curlDraftSow, 'c1')}
                    className="h-7 text-xs gap-1 border-slate-200"
                  >
                    {copiedId === 'c1' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedId === 'c1' ? 'Copied' : 'Copy cURL'}
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <pre className="p-4 bg-slate-900 text-slate-100 rounded-b-xl text-xs font-mono overflow-x-auto leading-relaxed">
                    {curlDraftSow}
                  </pre>
                </CardContent>
              </Card>

              <Card className="border-[#DDE4EF] bg-white">
                <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-emerald-600 text-white font-mono text-[10px]">POST</Badge>
                      <span className="font-mono text-xs font-semibold text-slate-800">/deliveries/verify</span>
                    </div>
                    <CardDescription className="text-xs">Trigger AI evaluation of submitted repository or live link.</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyCode(curlVerify, 'c2')}
                    className="h-7 text-xs gap-1 border-slate-200"
                  >
                    {copiedId === 'c2' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedId === 'c2' ? 'Copied' : 'Copy cURL'}
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <pre className="p-4 bg-slate-900 text-slate-100 rounded-b-xl text-xs font-mono overflow-x-auto leading-relaxed">
                    {curlVerify}
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Authentication Tab */}
            <TabsContent value="authentication" className="space-y-6">
              <Card className="border-[#DDE4EF] bg-white">
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Key className="w-4 h-4 text-blue-600" />
                    Bearer Token Authentication
                  </CardTitle>
                  <CardDescription className="text-xs">
                    All API requests require an API key passed in the Authorization header.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-xs text-slate-600">
                  <p>Pass your token in the request headers:</p>
                  <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg font-mono text-xs">
                    Authorization: Bearer tb_live_sandbox_994a8e32
                  </pre>
                  <p className="text-slate-500 text-[11px]">
                    Sandbox keys begin with <code className="text-blue-600 font-mono">tb_live_sandbox_</code> and interact only with PayPal Sandbox endpoints.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default DeveloperPortal
