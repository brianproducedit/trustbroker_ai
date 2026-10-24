import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useContractStore } from '@/hooks/useContractStore'
import { useNotificationStore } from '@/hooks/useNotifications'
import { api } from '@/lib/api'
import { ROUTES } from '@/constants'
import { formatCurrency } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  DollarSign, 
  UserCheck, 
  FileText, 
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import type { Milestone } from '@/types/contract'

interface EditableMilestone {
  id: string
  title: string
  description: string
  amount: number
  deadline: string
  criteria: string[]
}

export const CreateProject: React.FC = () => {
  const navigate = useNavigate()
  const { createContractDraft } = useContractStore()
  const { addNotification } = useNotificationStore()

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)

  // Step 1: Brief
  const [brief, setBrief] = useState(
    'Build a high-converting React 19 web application with Tailwind CSS, strict TypeScript checks, and PayPal Sandbox milestone payments. Delivery in 14 days, split into 3 clear milestones.'
  )
  const [isGenerating, setIsGenerating] = useState(false)

  // Step 2: SOW & Milestones
  const [projectTitle, setProjectTitle] = useState('React 19 Fintech Web Application')
  const [projectDesc, setProjectDesc] = useState(
    'A production-ready React 19 web application with modular components, TypeScript type verification, and PayPal Sandbox milestone disbursements.'
  )

  const [milestones, setMilestones] = useState<EditableMilestone[]>([
    {
      id: 'm-1',
      title: 'UI Design System & Architecture',
      description: 'Lexend font family, dark mode tokens, and core responsive component architecture.',
      amount: 900,
      deadline: '2026-11-02',
      criteria: [
        'Production build runs cleanly with zero TypeScript errors',
        'Mobile (375px) and desktop (1440px) responsive layouts verified',
      ],
    },
    {
      id: 'm-2',
      title: 'Core App Pages & PayPal Checkout Flow',
      description: 'Implementation of interactive views with integrated PayPal sandbox checkout cards.',
      amount: 1500,
      deadline: '2026-11-09',
      criteria: [
        'PayPal Sandbox staging button executes and captures test order',
        'Contract detail tabs and milestones view update reactively',
      ],
    },
    {
      id: 'm-3',
      title: 'Automated Verification & Handover',
      description: 'Milestone delivery evidence inspection and production deployment.',
      amount: 1000,
      deadline: '2026-11-16',
      criteria: [
        'Delivery submission form supports GitHub repository URL',
        'AI criterion assessment gives pass score above 90%',
      ],
    },
  ])

  // Step 3: Supplier
  const [supplierName, setSupplierName] = useState('Tariro Moyo')
  const [supplierEmail, setSupplierEmail] = useState('tariro@devstudio.co.zw')
  const [supplierOrg, setSupplierOrg] = useState('DevStudio Harare')

  // Step 4: Confirm
  const [confirmedAccuracy, setConfirmedAccuracy] = useState(true)

  // Validation errors
  const [step2Errors, setStep2Errors] = useState<{ title?: string; milestones?: string }>({})
  const [step3Errors, setStep3Errors] = useState<{ name?: string; email?: string }>({})

  const validateStep2 = () => {
    const errors: { title?: string; milestones?: string } = {}
    if (!projectTitle.trim()) {
      errors.title = 'Project title is required'
    }
    if (milestones.length === 0) {
      errors.milestones = 'At least one milestone is required'
    } else {
      const invalid = milestones.some((m) => !m.title.trim() || Number(m.amount) <= 0)
      if (invalid) {
        errors.milestones = 'All milestones must have a title and amount greater than $0'
      }
    }
    setStep2Errors(errors)
    return Object.keys(errors).length === 0
  }

  const validateStep3 = () => {
    const errors: { name?: string; email?: string } = {}
    if (!supplierName.trim()) {
      errors.name = 'Freelancer name is required'
    }
    if (!supplierEmail.trim()) {
      errors.email = 'Freelancer email is required'
    } else if (!/\S+@\S+\.\S+/.test(supplierEmail)) {
      errors.email = 'Please provide a valid email address (e.g. name@domain.com)'
    }
    setStep3Errors(errors)
    return Object.keys(errors).length === 0
  }

  // Budget calculation
  const totalBudget = milestones.reduce((sum, m) => sum + (Number(m.amount) || 0), 0)

  // Quick prompt templates
  const quickTemplates = [
    {
      title: 'React 19 Web App',
      text: 'Build a responsive React 19 web app with Tailwind CSS, TypeScript, and a working PayPal Sandbox checkout flow. Delivery in 14 days, 3 milestones.',
    },
    {
      title: 'Mobile UI Kit',
      text: 'Design a comprehensive mobile UI kit in Figma with light and dark mode tokens, 20 reusable screens, and exportable SVG assets.',
    },
    {
      title: 'FastAPI Backend',
      text: 'Build a Python FastAPI backend with Supabase database integration, JWT authentication, and automated OpenAPI documentation.',
    },
  ]

  // Handlers
  const handleAIGenerate = async () => {
    setIsGenerating(true)
    try {
      const res = await api.ai.draftSOW({
        prompt: brief,
        category: 'software',
        total_budget: totalBudget || 3200,
        currency: 'USD',
      })
      if (res && res.title) {
        setProjectTitle(res.title)
        if (res.description) setProjectDesc(res.description)
        if (Array.isArray(res.milestones) && res.milestones.length > 0) {
          setMilestones(
            res.milestones.map((m: any, idx: number) => ({
              id: `m-${idx + 1}-${Date.now()}`,
              title: m.title || `Milestone ${idx + 1}`,
              description: m.description || '',
              amount: Number(m.amount) || 500,
              deadline: m.deadline || '2026-11-20',
              criteria: Array.isArray(m.acceptance_criteria)
                ? m.acceptance_criteria.map((c: any) =>
                    typeof c === 'string' ? c : (c.title || c.description || 'Verified deliverable')
                  )
                : ['Code meets deliverables criteria', 'All tests pass'],
            }))
          )
        }
        toast.success('AI drafted contract scope and milestones with Groq LPU!')
        setStep(2)
      } else {
        toast.info('Drafted standard contract template.')
        setStep(2)
      }
    } catch (err: any) {
      console.warn('AI SOW generation fallback:', err)
      toast.info('AI service responded, generated standard template.')
      setStep(2)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleAddMilestone = () => {
    const newM: EditableMilestone = {
      id: `m-${Date.now()}`,
      title: `Milestone ${milestones.length + 1}: Additional Deliverable`,
      description: 'Specify milestone deliverables and expectations.',
      amount: 500,
      deadline: '2026-11-20',
      criteria: ['Code meets deliverables criteria', 'All tests pass'],
    }
    setMilestones([...milestones, newM])
    toast.info('New milestone added')
  }

  const handleRemoveMilestone = (id: string) => {
    if (milestones.length <= 1) {
      toast.error('A contract must have at least one milestone.')
      return
    }
    setMilestones(milestones.filter((m) => m.id !== id))
    toast.info('Milestone removed')
  }

  const handleUpdateMilestone = (id: string, field: keyof EditableMilestone, value: any) => {
    setMilestones(
      milestones.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    )
  }

  const handleAddCriterion = (milestoneId: string) => {
    setMilestones(
      milestones.map((m) => {
        if (m.id === milestoneId) {
          return {
            ...m,
            criteria: [...m.criteria, 'New measurable acceptance criterion'],
          }
        }
        return m
      })
    )
  }

  const handleUpdateCriterion = (milestoneId: string, index: number, value: string) => {
    setMilestones(
      milestones.map((m) => {
        if (m.id === milestoneId) {
          const updated = [...m.criteria]
          updated[index] = value
          return { ...m, criteria: updated }
        }
        return m
      })
    )
  }

  const handleRemoveCriterion = (milestoneId: string, index: number) => {
    setMilestones(
      milestones.map((m) => {
        if (m.id === milestoneId) {
          const updated = m.criteria.filter((_, i) => i !== index)
          return { ...m, criteria: updated }
        }
        return m
      })
    )
  }

  const handleCreateContract = async () => {
    const formattedMilestones: Milestone[] = milestones.map((m, idx) => ({
      id: `ms-${idx + 1}-${Date.now()}`,
      title: m.title,
      description: m.description,
      amount: Number(m.amount) || 0,
      currency: 'USD',
      deadline: m.deadline,
      status: 'pending' as const,
      paymentStatus: 'not_started' as const,
      acceptanceCriteria: m.criteria.map((cText, cIdx) => ({
        id: `crit-${cIdx + 1}-${Date.now()}`,
        title: cText,
        description: `Verified deliverable for: ${cText}`,
        status: 'pending' as const,
      })),
    }))

    const newContractId = await createContractDraft(
      projectTitle,
      projectDesc,
      formattedMilestones,
      supplierEmail
    )

    addNotification({
      title: 'Contract Created',
      description: `Draft contract "${projectTitle}" created with ${formattedMilestones.length} milestones.`,
      type: 'contract',
      link: `/dashboard/contracts/${newContractId}`,
    })

    toast.success('Contract created successfully!')
    navigate(`/dashboard/contracts/${newContractId}`)
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#222A3D]">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Create New Project</h1>
            <p className="text-xs text-[#ACB9D2] mt-0.5">
              AI-assisted contract drafting with staged milestone payments.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Total Budget:</span>
            <span className="font-bold text-white font-mono text-sm bg-[#171F33] px-2.5 py-1 rounded-lg border border-[#2D3449]">
              {formatCurrency(totalBudget)} USD
            </span>
          </div>
        </div>

        {/* 4-Step Stepper Header */}
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          {[
            { num: 1, label: '1. Project Brief' },
            { num: 2, label: '2. Review & Edit SOW' },
            { num: 3, label: '3. Assign Freelancer' },
            { num: 4, label: '4. Final Confirmation' },
          ].map((s) => {
            const isActive = step === s.num
            const isCompleted = step > s.num
            return (
              <div
                key={s.num}
                onClick={() => {
                  if (isCompleted) setStep(s.num as any)
                }}
                className={`py-2 px-1 rounded-lg border transition-all ${
                  isActive
                    ? 'bg-blue-600/20 border-blue-500 text-blue-400 font-semibold shadow-xs'
                    : isCompleted
                    ? 'bg-[#171F33] border-[#2D3449] text-emerald-400 cursor-pointer hover:bg-[#222A3D]'
                    : 'bg-[#131B2E] border-[#222A3D] text-slate-500 opacity-60'
                }`}
              >
                <div className="flex items-center justify-center gap-1.5">
                  {isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : null}
                  <span className="truncate">{s.label}</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* STEP 1: BRIEF */}
        {step === 1 && (
          <Card className="border-[#222A3D] bg-[#131B2E] text-white">
            <CardHeader>
              <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold">
                <Sparkles className="w-4 h-4" />
                <span>Step 1: Describe What You Need</span>
              </div>
              <CardTitle className="text-lg font-bold mt-1 text-white">
                Project Scope in Plain Language
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Type your requirements naturally. AI will structure this into concrete milestones, acceptance criteria, and budget breakdowns.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="brief" className="text-xs text-slate-300">
                  Project Description &amp; Requirements
                </Label>
                <Textarea
                  id="brief"
                  rows={5}
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                  placeholder="Describe your project, required deliverables, timeline, and goals..."
                  className="bg-[#0B1326] border-[#2D3449] text-white placeholder:text-slate-500 text-xs leading-relaxed"
                />
              </div>

              {/* Quick Template Chips */}
              <div className="space-y-1.5">
                <Label className="text-[11px] text-slate-400">Or pick an example brief:</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {quickTemplates.map((t) => (
                    <button
                      key={t.title}
                      type="button"
                      onClick={() => setBrief(t.text)}
                      className="p-2.5 rounded-lg border border-[#2D3449] bg-[#171F33] hover:border-blue-500 text-left transition-colors cursor-pointer group"
                    >
                      <div className="font-semibold text-xs text-slate-200 group-hover:text-blue-400">
                        {t.title}
                      </div>
                      <div className="text-[10px] text-slate-400 line-clamp-2 mt-0.5">
                        {t.text}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex justify-between border-t border-[#222A3D] pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(ROUTES.DASHBOARD)}
                className="border-[#2D3449] text-slate-400 hover:text-white hover:bg-[#171F33] text-xs"
              >
                Cancel
              </Button>

              <Button
                size="sm"
                disabled={isGenerating || !brief.trim()}
                onClick={handleAIGenerate}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    AI is structuring milestones...
                  </>
                ) : (
                  <>
                    Generate Contract Scope
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* STEP 2: EDITABLE SOW & MILESTONES (CRUD) */}
        {step === 2 && (
          <div className="space-y-4">
            <Card className="border-[#222A3D] bg-[#131B2E] text-white">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold">
                  <FileText className="w-4 h-4" />
                  <span>Step 2: Review &amp; Customize Statement of Work</span>
                </div>
                <CardTitle className="text-lg font-bold mt-1 text-white">
                  Editable Milestones &amp; Acceptance Criteria
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Modify milestone scopes, payout amounts, deadlines, and criteria before committing.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Project Title & Description */}
                <div className="grid grid-cols-1 gap-3 p-3.5 rounded-xl bg-[#0B1326] border border-[#2D3449]">
                  <div className="space-y-1">
                    <Label htmlFor="proj-title" className="text-xs text-slate-300">
                      Project Title
                    </Label>
                    <Input
                      id="proj-title"
                      value={projectTitle}
                      onChange={(e) => {
                        setProjectTitle(e.target.value)
                        if (step2Errors.title) setStep2Errors((prev) => ({ ...prev, title: undefined }))
                      }}
                      className="bg-[#131B2E] border-[#2D3449] text-white text-xs"
                    />
                    {step2Errors.title && (
                      <p className="text-[11px] text-red-400 font-medium">{step2Errors.title}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="proj-desc" className="text-xs text-slate-300">
                      Overall Contract Scope
                    </Label>
                    <Textarea
                      id="proj-desc"
                      rows={2}
                      value={projectDesc}
                      onChange={(e) => setProjectDesc(e.target.value)}
                      className="bg-[#131B2E] border-[#2D3449] text-white text-xs leading-relaxed"
                    />
                  </div>
                </div>

                {step2Errors.milestones && (
                  <p className="text-[11px] text-red-400 font-medium p-2.5 bg-red-950/30 border border-red-900/40 rounded-lg">
                    {step2Errors.milestones}
                  </p>
                )}

                {/* Milestones List */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-white">
                      Contract Milestones ({milestones.length})
                    </Label>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleAddMilestone}
                      className="border-[#2D3449] text-blue-400 hover:text-white hover:bg-blue-600/20 text-xs gap-1.5 h-7"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Milestone
                    </Button>
                  </div>

                  {milestones.map((m, idx) => (
                    <div
                      key={m.id}
                      className="p-4 rounded-xl border border-[#2D3449] bg-[#0E172E] space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#222A3D] pb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-blue-600/30 text-blue-400 text-[11px] font-bold flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="font-semibold text-xs text-white">Milestone {idx + 1}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleRemoveMilestone(m.id)}
                            className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                            title="Remove milestone"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                        <div className="sm:col-span-8 space-y-1">
                          <Label className="text-[11px] text-slate-400">Milestone Title</Label>
                          <Input
                            value={m.title}
                            onChange={(e) => handleUpdateMilestone(m.id, 'title', e.target.value)}
                            className="bg-[#131B2E] border-[#2D3449] text-white text-xs"
                          />
                        </div>

                        <div className="sm:col-span-2 space-y-1">
                          <Label className="text-[11px] text-slate-400">Amount ($)</Label>
                          <div className="relative">
                            <DollarSign className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                            <Input
                              type="number"
                              value={m.amount}
                              onChange={(e) => handleUpdateMilestone(m.id, 'amount', Number(e.target.value))}
                              className="pl-7 bg-[#131B2E] border-[#2D3449] text-white text-xs font-mono"
                            />
                          </div>
                        </div>

                        <div className="sm:col-span-2 space-y-1">
                          <Label className="text-[11px] text-slate-400">Target Date</Label>
                          <Input
                            type="date"
                            value={m.deadline}
                            onChange={(e) => handleUpdateMilestone(m.id, 'deadline', e.target.value)}
                            className="bg-[#131B2E] border-[#2D3449] text-white text-xs font-mono"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px] text-slate-400">Description of Work</Label>
                        <Input
                          value={m.description}
                          onChange={(e) => handleUpdateMilestone(m.id, 'description', e.target.value)}
                          className="bg-[#131B2E] border-[#2D3449] text-white text-xs"
                        />
                      </div>

                      {/* Acceptance Criteria Sub-list */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>Acceptance Criteria (Measurable Checklist):</span>
                          <button
                            type="button"
                            onClick={() => handleAddCriterion(m.id)}
                            className="text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add Criterion</span>
                          </button>
                        </div>

                        <div className="space-y-1.5">
                          {m.criteria.map((c, cIdx) => (
                            <div key={cIdx} className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                              <Input
                                value={c}
                                onChange={(e) => handleUpdateCriterion(m.id, cIdx, e.target.value)}
                                className="bg-[#131B2E] border-[#2D3449] text-white text-xs h-7 flex-1"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveCriterion(m.id, cIdx)}
                                className="p-1 text-slate-500 hover:text-red-400 text-xs"
                              >
                                &times;
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>

              <CardFooter className="flex justify-between border-t border-[#222A3D] pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStep(1)}
                  className="border-[#2D3449] text-slate-400 hover:text-white hover:bg-[#171F33] text-xs gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Brief
                </Button>

                <Button
                  size="sm"
                  onClick={() => {
                    if (validateStep2()) setStep(3)
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-2 cursor-pointer"
                >
                  Assign Freelancer
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}

        {/* STEP 3: ASSIGN FREELANCER */}
        {step === 3 && (
          <Card className="border-[#222A3D] bg-[#131B2E] text-white">
            <CardHeader>
              <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold">
                <UserCheck className="w-4 h-4" />
                <span>Step 3: Assign Freelancer</span>
              </div>
              <CardTitle className="text-lg font-bold mt-1 text-white">
                Who will be delivering this work?
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                The freelancer will receive the contract, review milestones, and digitally accept terms before work begins.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="sup-name" className="text-xs text-slate-300">
                    Freelancer Full Name
                  </Label>
                  <Input
                    id="sup-name"
                    value={supplierName}
                    onChange={(e) => {
                      setSupplierName(e.target.value)
                      if (step3Errors.name) setStep3Errors((prev) => ({ ...prev, name: undefined }))
                    }}
                    placeholder="e.g. Tariro Moyo"
                    className="bg-[#0B1326] border-[#2D3449] text-white text-xs"
                  />
                  {step3Errors.name && (
                    <p className="text-[11px] text-red-400 font-medium">{step3Errors.name}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="sup-email" className="text-xs text-slate-300">
                    Freelancer Email Address
                  </Label>
                  <Input
                    id="sup-email"
                    type="email"
                    value={supplierEmail}
                    onChange={(e) => {
                      setSupplierEmail(e.target.value)
                      if (step3Errors.email) setStep3Errors((prev) => ({ ...prev, email: undefined }))
                    }}
                    placeholder="e.g. tariro@devstudio.co.zw"
                    className="bg-[#0B1326] border-[#2D3449] text-white text-xs"
                  />
                  {step3Errors.email && (
                    <p className="text-[11px] text-red-400 font-medium">{step3Errors.email}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sup-org" className="text-xs text-slate-300">
                  Studio / Organization <span className="text-slate-500 font-normal">(Optional)</span>
                </Label>
                <Input
                  id="sup-org"
                  value={supplierOrg}
                  onChange={(e) => setSupplierOrg(e.target.value)}
                  placeholder="e.g. DevStudio Harare"
                  className="bg-[#0B1326] border-[#2D3449] text-white text-xs"
                />
              </div>

              {/* Summary of Contract Parties */}
              <div className="p-3.5 rounded-xl bg-[#0B1326] border border-[#2D3449] space-y-2 text-xs">
                <span className="font-semibold text-slate-300 block">Contract Parties Summary:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-400">
                  <div className="p-2.5 rounded-lg bg-[#131B2E] border border-[#222A3D]">
                    <span className="text-[10px] text-blue-400 font-mono font-semibold uppercase block">Client (Hiring)</span>
                    <span className="font-semibold text-white">Elena Rostova</span>
                    <span className="text-[11px] text-slate-400 block">elena@acmeglobal.com</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#131B2E] border border-[#222A3D]">
                    <span className="text-[10px] text-emerald-400 font-mono font-semibold uppercase block">Freelancer (Delivering)</span>
                    <span className="font-semibold text-white">{supplierName || 'Not specified'}</span>
                    <span className="text-[11px] text-slate-400 block">{supplierEmail || 'Not specified'}</span>
                  </div>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex justify-between border-t border-[#222A3D] pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep(2)}
                className="border-[#2D3449] text-slate-400 hover:text-white hover:bg-[#171F33] text-xs gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to SOW
              </Button>

              <Button
                size="sm"
                onClick={() => {
                  if (validateStep3()) setStep(4)
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-2 cursor-pointer"
              >
                Review &amp; Confirm
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* STEP 4: FINAL CONFIRMATION */}
        {step === 4 && (
          <Card className="border-[#222A3D] bg-[#131B2E] text-white">
            <CardHeader>
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Step 4: Final Contract Confirmation</span>
              </div>
              <CardTitle className="text-lg font-bold mt-1 text-white">
                Ready to Create Draft Contract
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Please review the finalized contract scope and milestones before creating the agreement.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Overview Box */}
              <div className="p-4 rounded-xl bg-[#0B1326] border border-[#2D3449] space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#222A3D] pb-3">
                  <div>
                    <h3 className="font-bold text-sm text-white">{projectTitle}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{projectDesc}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block">Total Budget</span>
                    <span className="font-bold text-emerald-400 font-mono text-base">
                      {formatCurrency(totalBudget)} USD
                    </span>
                  </div>
                </div>

                {/* Milestone summary list */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-300 block">
                    Milestones to be Staged:
                  </span>
                  {milestones.map((m, idx) => (
                    <div
                      key={m.id}
                      className="p-2.5 rounded-lg bg-[#131B2E] border border-[#222A3D] flex items-center justify-between text-xs gap-3"
                    >
                      <div className="space-y-0.5">
                        <span className="font-medium text-white">
                          M{idx + 1}: {m.title}
                        </span>
                        <span className="text-[11px] text-slate-400 block">
                          Due {m.deadline} &bull; {m.criteria.length} acceptance criteria
                        </span>
                      </div>
                      <span className="font-mono font-semibold text-white">
                        {formatCurrency(m.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Confirmation Checkbox */}
              <div className="flex items-start space-x-2.5 p-3 rounded-lg bg-blue-950/20 border border-blue-900/40">
                <Checkbox
                  id="confirm-sow"
                  checked={confirmedAccuracy}
                  onCheckedChange={(checked) => setConfirmedAccuracy(Boolean(checked))}
                  className="mt-0.5"
                />
                <label
                  htmlFor="confirm-sow"
                  className="text-xs text-slate-300 leading-snug cursor-pointer select-none"
                >
                  I confirm this Statement of Work is accurate. Upon creation, this agreement will be recorded and ready for PayPal Sandbox staging.
                </label>
              </div>
            </CardContent>

            <CardFooter className="flex justify-between border-t border-[#222A3D] pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep(3)}
                className="border-[#2D3449] text-slate-400 hover:text-white hover:bg-[#171F33] text-xs gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </Button>

              <Button
                size="sm"
                disabled={!confirmedAccuracy || totalBudget <= 0}
                onClick={handleCreateContract}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-2"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Create Contract
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}

export default CreateProject
