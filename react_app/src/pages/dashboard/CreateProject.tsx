import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useContractStore } from '@/hooks/useContractStore'
import { useNotificationStore } from '@/hooks/useNotifications'
import { useAuthStore } from '@/hooks/useAuthStore'
import { api } from '@/lib/api'
import { ROUTES } from '@/constants'
import { formatCurrency } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Plus,
  Trash2,
  DollarSign,
  FileText,
  Loader2,
  Eye,
  Megaphone,
  AlertCircle,
  MessageCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import type { Milestone } from '@/types/contract'

type WizardStep = 1 | 2 | 3 | 4 | 5

interface EditableCriterion {
  title: string
  evidenceType: string
}

interface EditableMilestone {
  id: string
  title: string
  description: string
  amount: number
  deadline: string
  criteria: EditableCriterion[]
}

interface ClarifyQuestion {
  id: string
  question: string
}

const WIZARD_STORAGE_KEY = 'tb_contract_wizard_v1'

const CATEGORIES = [
  { value: 'software', label: 'Software' },
  { value: 'design', label: 'Design' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'research', label: 'Research' },
] as const

const EVIDENCE_TYPES = [
  { value: 'url', label: 'Live URL' },
  { value: 'screenshot', label: 'Screenshot' },
  { value: 'file', label: 'File / PDF' },
  { value: 'text', label: 'Text / notes' },
]

const STEPS = [
  { num: 1, label: '1. Brief' },
  { num: 2, label: '2. Clarify' },
  { num: 3, label: '3. SOW' },
  { num: 4, label: '4. Preview' },
  { num: 5, label: '5. Publish' },
]

function defaultDeadline(daysAhead: number) {
  const d = new Date()
  d.setDate(d.getDate() + daysAhead)
  return d.toISOString().slice(0, 10)
}

function mapSowMilestones(res: any, fallbackBudget: number, targetDate: string): EditableMilestone[] {
  const raw = Array.isArray(res?.milestones) ? res.milestones : []
  if (raw.length === 0) {
    const half = Math.round(fallbackBudget / 2)
    return [
      {
        id: `m-1-${Date.now()}`,
        title: 'Milestone 1: Foundation',
        description: 'Initial setup and first verifiable deliverable.',
        amount: half,
        deadline: targetDate || defaultDeadline(7),
        criteria: [
          { title: 'Working preview URL or file', evidenceType: 'url' },
          { title: 'Scope for this milestone is complete', evidenceType: 'text' },
        ],
      },
      {
        id: `m-2-${Date.now()}`,
        title: 'Milestone 2: Final delivery',
        description: 'Remaining scope, QA, and handover.',
        amount: Math.max(0, fallbackBudget - half),
        deadline: targetDate || defaultDeadline(14),
        criteria: [{ title: 'Final assets delivered', evidenceType: 'file' }],
      },
    ]
  }
  return raw.map((m: any, idx: number) => ({
    id: `m-${idx + 1}-${Date.now()}`,
    title: m.title || `Milestone ${idx + 1}`,
    description: m.description || '',
    amount: Number(m.amount) || 0,
    deadline: targetDate || defaultDeadline((idx + 1) * 7),
    criteria: Array.isArray(m.acceptance_criteria) && m.acceptance_criteria.length > 0
      ? m.acceptance_criteria.map((c: any) => ({
          title: typeof c === 'string' ? c : c.title || c.description || 'Verifiable criterion',
          evidenceType: c.evidence_type || 'text',
        }))
      : [{ title: 'Deliverable meets the written scope', evidenceType: 'text' }],
  }))
}

function toStoreMilestones(milestones: EditableMilestone[]): Milestone[] {
  return milestones.map((m, idx) => ({
    id: m.id,
    title: m.title,
    description: m.description,
    amount: Number(m.amount) || 0,
    currency: 'USD',
    deadline: m.deadline,
    status: 'pending' as const,
    paymentStatus: 'not_started' as const,
    acceptanceCriteria: m.criteria.map((c, cIdx) => ({
      id: `crit-${idx}-${cIdx}`,
      title: c.title,
      description: c.title,
      evidenceType: c.evidenceType,
      status: 'pending' as const,
    })),
  }))
}

export const CreateProject: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { createContractDraft, publishContract } = useContractStore()
  const { addNotification } = useNotificationStore()
  const user = useAuthStore((state) => state.user)

  const [step, setStep] = useState<WizardStep>(1)
  const [category, setCategory] = useState('software')
  const [budget, setBudget] = useState(2500)
  const [targetDate, setTargetDate] = useState(defaultDeadline(21))
  const [brief, setBrief] = useState('')
  const [projectTitle, setProjectTitle] = useState('')
  const [projectDesc, setProjectDesc] = useState('')
  const [milestones, setMilestones] = useState<EditableMilestone[]>([])
  const [questions, setQuestions] = useState<ClarifyQuestion[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [aiFallback, setAiFallback] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isClarifying, setIsClarifying] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [draftId, setDraftId] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false)

  const milestoneSum = useMemo(
    () => milestones.reduce((sum, m) => sum + (Number(m.amount) || 0), 0),
    [milestones]
  )
  const budgetMismatch = Math.abs(milestoneSum - (Number(budget) || 0)) > 0.009
  const budgetDelta = Math.round((milestoneSum - Number(budget)) * 100) / 100

  useEffect(() => {
    if (searchParams.get('fresh') === '1') {
      localStorage.removeItem(WIZARD_STORAGE_KEY)
      setHydrated(true)
      return
    }
    try {
      const raw = localStorage.getItem(WIZARD_STORAGE_KEY)
      if (raw) {
        const saved = JSON.parse(raw)
        if (saved.step) setStep(saved.step)
        if (saved.category) setCategory(saved.category)
        if (saved.budget) setBudget(saved.budget)
        if (saved.targetDate) setTargetDate(saved.targetDate)
        if (saved.brief) setBrief(saved.brief)
        if (saved.projectTitle) setProjectTitle(saved.projectTitle)
        if (saved.projectDesc) setProjectDesc(saved.projectDesc)
        if (Array.isArray(saved.milestones)) setMilestones(saved.milestones)
        if (Array.isArray(saved.questions)) setQuestions(saved.questions)
        if (saved.answers) setAnswers(saved.answers)
        if (saved.draftId) setDraftId(saved.draftId)
        if (saved.aiFallback) setAiFallback(true)
      }
    } catch {
      /* ignore corrupt draft */
    }
    setHydrated(true)
  }, [searchParams])

  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem(
      WIZARD_STORAGE_KEY,
      JSON.stringify({
        step,
        category,
        budget,
        targetDate,
        brief,
        projectTitle,
        projectDesc,
        milestones,
        questions,
        answers,
        draftId,
        aiFallback,
      })
    )
  }, [
    hydrated,
    step,
    category,
    budget,
    targetDate,
    brief,
    projectTitle,
    projectDesc,
    milestones,
    questions,
    answers,
    draftId,
    aiFallback,
  ])

  const applySowResult = (res: any, usedFallback: boolean) => {
    setAiFallback(usedFallback)
    if (res?.title) setProjectTitle(res.title)
    if (res?.description) setProjectDesc(res.description)
    setMilestones(mapSowMilestones(res, Number(budget) || 2500, targetDate))
  }

  const composedPrompt = () => {
    const qa = questions
      .map((q) => {
        const answer = (answers[q.id] || '').trim()
        return answer ? `${q.question}\nAnswer: ${answer}` : null
      })
      .filter(Boolean)
      .join('\n\n')
    return [brief.trim(), qa].filter(Boolean).join('\n\nClarifications:\n')
  }

  const runDraftAndClarify = async () => {
    setIsGenerating(true)
    setAiError(null)
    try {
      let usedFallback = false
      try {
        const res = await api.ai.draftSOW({
          prompt: brief,
          category,
          total_budget: Number(budget) || 1000,
          currency: 'USD',
        })
        usedFallback = String(res?.provider_used || '').includes('fallback')
        applySowResult(res, usedFallback)
      } catch (err: any) {
        usedFallback = true
        setAiError(err?.detail || 'AI draft is unavailable. Using a starter template.')
        applySowResult(null, true)
      }

      setIsClarifying(true)
      try {
        const clarify = await api.ai.clarify({
          prompt: brief,
          category,
          total_budget: Number(budget) || 1000,
        })
        setQuestions(Array.isArray(clarify.questions) ? clarify.questions : [])
      } catch {
        setQuestions([
          { id: 'q1', question: 'What must be true for the first milestone to count as done?' },
          { id: 'q2', question: 'Are there tools, brands, or repos the freelancer must use?' },
          { id: 'q3', question: 'Who reviews the work besides you?' },
        ])
        usedFallback = true
      }
      setAiFallback(usedFallback)
      setStep(2)
    } finally {
      setIsGenerating(false)
      setIsClarifying(false)
    }
  }

  const refineWithAnswers = async () => {
    setIsGenerating(true)
    setAiError(null)
    try {
      const res = await api.ai.draftSOW({
        prompt: composedPrompt(),
        category,
        total_budget: Number(budget) || 1000,
        currency: 'USD',
      })
      applySowResult(res, String(res?.provider_used || '').includes('fallback'))
      setStep(3)
    } catch (err: any) {
      setAiError(err?.detail || 'Could not refine the draft. You can still edit the current SOW.')
      toast.info('Continuing with the current draft.')
      setStep(3)
    } finally {
      setIsGenerating(false)
    }
  }

  const validateStep1 = () => {
    if (!brief.trim()) {
      toast.error('Add a short brief so AI has something to work with.')
      return false
    }
    if (!budget || Number(budget) <= 0) {
      toast.error('Set a total budget greater than $0.')
      return false
    }
    if (!targetDate) {
      toast.error('Pick a target date.')
      return false
    }
    return true
  }

  const validateStep3 = () => {
    if (!projectTitle.trim()) {
      toast.error('Add a contract title.')
      return false
    }
    if (milestones.length < 1) {
      toast.error('Add at least one milestone.')
      return false
    }
    if (milestones.some((m) => !m.title.trim() || Number(m.amount) <= 0)) {
      toast.error('Every milestone needs a title and amount greater than $0.')
      return false
    }
    if (milestones.some((m) => m.criteria.length < 1 || m.criteria.some((c) => !c.title.trim()))) {
      toast.error('Each milestone needs at least one named acceptance criterion.')
      return false
    }
    if (budgetMismatch) {
      toast.error(`Milestone amounts must sum to the budget (${formatCurrency(Number(budget))}).`)
      return false
    }
    return true
  }

  const persistDraft = async () => {
    const createdId = await createContractDraft(
      projectTitle || 'Untitled contract',
      projectDesc || brief,
      toStoreMilestones(milestones),
      { category, requiredSkills: [category] }
    )
    setDraftId(createdId)
    return createdId
  }

  const handleSaveDraft = async () => {
    if (!validateStep3()) {
      setStep(3)
      return
    }
    setIsSaving(true)
    try {
      const id = await persistDraft()
      addNotification({
        title: 'Draft saved',
        description: `"${projectTitle}" is saved. Resume from New Project anytime.`,
        type: 'contract',
        link: ROUTES.CONTRACT_DETAIL(id),
      })
      toast.success('Draft saved. You can resume this wizard later.')
    } catch (err: any) {
      toast.error(err?.detail || 'Could not save draft.')
    } finally {
      setIsSaving(false)
    }
  }

  const handlePublish = async () => {
    if (!validateStep3()) {
      setStep(3)
      return
    }
    setIsSaving(true)
    try {
      let id = draftId
      if (!id || id.startsWith('contract-')) {
        id = await persistDraft()
      }
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
      if (isUuid) {
        await publishContract(id)
      }
      localStorage.removeItem(WIZARD_STORAGE_KEY)
      addNotification({
        title: 'Contract published',
        description: `"${projectTitle}" is open. Freelancers can apply.`,
        type: 'contract',
        link: `${ROUTES.CONTRACT_DETAIL(id)}?tab=applicants`,
      })
      toast.success('Open contract published.')
      navigate(`${ROUTES.CONTRACT_DETAIL(id)}?tab=applicants`)
    } catch (err: any) {
      toast.error(err?.detail || 'Publish failed. Check that every milestone has criteria.')
    } finally {
      setIsSaving(false)
    }
  }

  const updateMilestone = (id: string, patch: Partial<EditableMilestone>) => {
    setMilestones((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)))
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#222A3D]">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Create a contract</h1>
            <p className="text-xs text-[#ACB9D2] mt-0.5">
              One step at a time. Publish as an open listing — no freelancer invite.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Budget</span>
            <span className="font-bold text-white font-mono text-sm bg-[#171F33] px-2.5 py-1 rounded-lg border border-[#2D3449]">
              {formatCurrency(Number(budget) || 0)} USD
            </span>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-1 sm:gap-2 text-center text-[11px] sm:text-xs">
          {STEPS.map((s) => {
            const isActive = step === s.num
            const isCompleted = step > s.num
            return (
              <button
                key={s.num}
                type="button"
                disabled={!isCompleted}
                onClick={() => isCompleted && setStep(s.num as WizardStep)}
                className={`py-2 px-1 rounded-lg border transition-all ${
                  isActive
                    ? 'bg-blue-600/20 border-blue-500 text-blue-400 font-semibold'
                    : isCompleted
                      ? 'bg-[#171F33] border-[#2D3449] text-emerald-400 hover:bg-[#222A3D]'
                      : 'bg-[#131B2E] border-[#222A3D] text-slate-500 opacity-60'
                }`}
              >
                <span className="truncate block">{s.label}</span>
              </button>
            )
          })}
        </div>

        {step === 1 && (
          <Card className="border-[#222A3D] bg-[#131B2E] text-white">
            <CardHeader>
              <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold">
                <Sparkles className="w-4 h-4" />
                <span>Step 1: Category, budget, date, brief</span>
              </div>
              <CardTitle className="text-lg font-bold mt-1">What do you need done?</CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Freelancers will apply after you publish. Do not pick a person yet.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs text-slate-300">Category</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setCategory(c.value)}
                      className={`p-2.5 rounded-lg border text-xs font-semibold ${
                        category === c.value
                          ? 'border-blue-500 bg-blue-600/20 text-blue-300'
                          : 'border-[#2D3449] bg-[#171F33] text-slate-300 hover:border-blue-500/50'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="budget" className="text-xs text-slate-300">
                    Total budget (USD)
                  </Label>
                  <div className="relative">
                    <DollarSign className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <Input
                      id="budget"
                      type="number"
                      min={1}
                      value={budget}
                      onChange={(e) => setBudget(Number(e.target.value))}
                      className="pl-8 bg-[#0B1326] border-[#2D3449] text-white text-xs font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="target-date" className="text-xs text-slate-300">
                    Target date
                  </Label>
                  <Input
                    id="target-date"
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="bg-[#0B1326] border-[#2D3449] text-white text-xs font-mono"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="brief" className="text-xs text-slate-300">
                  Brief in plain language
                </Label>
                <Textarea
                  id="brief"
                  rows={6}
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                  placeholder="Describe the work, constraints, and what good looks like..."
                  className="bg-[#0B1326] border-[#2D3449] text-white placeholder:text-slate-500 text-xs leading-relaxed"
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t border-[#222A3D] pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(ROUTES.DASHBOARD)}
                className="border-[#2D3449] text-slate-400 hover:text-white text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={isGenerating || !brief.trim()}
                onClick={() => {
                  if (validateStep1()) void runDraftAndClarify()
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    {isClarifying ? 'Writing clarifying questions...' : 'Drafting SOW...'}
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        )}

        {step === 2 && (
          <Card className="border-[#222A3D] bg-[#131B2E] text-white">
            <CardHeader>
              <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold">
                <MessageCircle className="w-4 h-4" />
                <span>Step 2: AI clarification</span>
              </div>
              <CardTitle className="text-lg font-bold mt-1">Answer a few questions</CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Optional after the first draft. Skip if you want to edit the SOW now.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {aiError && (
                <div className="flex gap-2 text-xs text-amber-300 bg-amber-950/30 border border-amber-900/40 rounded-lg p-3">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{aiError}</span>
                </div>
              )}
              {aiFallback && !aiError && (
                <p className="text-[11px] text-slate-400">Using a starter template. You can edit everything on the next step.</p>
              )}
              {questions.length === 0 && !isClarifying && (
                <p className="text-xs text-slate-400">No extra questions. Generate anyway to review the SOW.</p>
              )}
              <div className="space-y-3">
                {questions.map((q) => (
                  <div key={q.id} className="p-3 rounded-xl bg-[#0B1326] border border-[#2D3449] space-y-2">
                    <p className="text-xs text-blue-200">{q.question}</p>
                    <Textarea
                      rows={2}
                      value={answers[q.id] || ''}
                      onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                      placeholder="Your answer"
                      className="bg-[#131B2E] border-[#2D3449] text-white text-xs"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row justify-between gap-2 border-t border-[#222A3D] pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep(1)}
                className="border-[#2D3449] text-slate-400 text-xs gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStep(3)}
                  className="border-[#2D3449] text-slate-300 text-xs"
                >
                  Generate anyway
                </Button>
                <Button
                  size="sm"
                  disabled={isGenerating}
                  onClick={() => void refineWithAnswers()}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-2"
                >
                  {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Apply answers
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        )}

        {step === 3 && (
          <Card className="border-[#222A3D] bg-[#131B2E] text-white">
            <CardHeader>
              <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold">
                <FileText className="w-4 h-4" />
                <span>Step 3: Edit the statement of work</span>
              </div>
              <CardTitle className="text-lg font-bold mt-1">Milestones must sum to the budget</CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Live total {formatCurrency(milestoneSum)} vs budget {formatCurrency(Number(budget) || 0)}
                {budgetMismatch ? ` · off by ${formatCurrency(Math.abs(budgetDelta))}` : ' · matched'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {budgetMismatch && (
                <p className="text-[11px] text-amber-300 bg-amber-950/30 border border-amber-900/40 rounded-lg p-2.5">
                  Next is blocked until milestone amounts equal the budget from step 1.
                </p>
              )}
              <div className="grid grid-cols-1 gap-3 p-3.5 rounded-xl bg-[#0B1326] border border-[#2D3449]">
                <div className="space-y-1">
                  <Label className="text-xs text-slate-300">Title</Label>
                  <Input
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    className="bg-[#131B2E] border-[#2D3449] text-white text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-300">Scope</Label>
                  <Textarea
                    rows={3}
                    value={projectDesc}
                    onChange={(e) => setProjectDesc(e.target.value)}
                    className="bg-[#131B2E] border-[#2D3449] text-white text-xs"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Milestones ({milestones.length})</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setMilestones((prev) => [
                      ...prev,
                      {
                        id: `m-${Date.now()}`,
                        title: `Milestone ${prev.length + 1}`,
                        description: '',
                        amount: 0,
                        deadline: targetDate,
                        criteria: [{ title: '', evidenceType: 'url' }],
                      },
                    ])
                  }
                  className="border-[#2D3449] text-blue-400 text-xs gap-1.5 h-7"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </Button>
              </div>
              {milestones.map((m, idx) => (
                <div key={m.id} className="p-4 rounded-xl border border-[#2D3449] bg-[#0E172E] space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold">Milestone {idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (milestones.length <= 1) {
                          toast.error('Keep at least one milestone.')
                          return
                        }
                        setMilestones((prev) => prev.filter((x) => x.id !== m.id))
                      }}
                      className="text-slate-400 hover:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-7 space-y-1">
                      <Label className="text-[11px] text-slate-400">Title</Label>
                      <Input
                        value={m.title}
                        onChange={(e) => updateMilestone(m.id, { title: e.target.value })}
                        className="bg-[#131B2E] border-[#2D3449] text-white text-xs"
                      />
                    </div>
                    <div className="sm:col-span-2 space-y-1">
                      <Label className="text-[11px] text-slate-400">Amount</Label>
                      <Input
                        type="number"
                        value={m.amount}
                        onChange={(e) => updateMilestone(m.id, { amount: Number(e.target.value) })}
                        className="bg-[#131B2E] border-[#2D3449] text-white text-xs font-mono"
                      />
                    </div>
                    <div className="sm:col-span-3 space-y-1">
                      <Label className="text-[11px] text-slate-400">Due</Label>
                      <Input
                        type="date"
                        value={m.deadline}
                        onChange={(e) => updateMilestone(m.id, { deadline: e.target.value })}
                        className="bg-[#131B2E] border-[#2D3449] text-white text-xs font-mono"
                      />
                    </div>
                  </div>
                  <Input
                    value={m.description}
                    onChange={(e) => updateMilestone(m.id, { description: e.target.value })}
                    placeholder="What this milestone covers"
                    className="bg-[#131B2E] border-[#2D3449] text-white text-xs"
                  />
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Acceptance criteria</span>
                      <button
                        type="button"
                        className="text-blue-400"
                        onClick={() =>
                          updateMilestone(m.id, {
                            criteria: [...m.criteria, { title: '', evidenceType: 'url' }],
                          })
                        }
                      >
                        + Add criterion
                      </button>
                    </div>
                    {m.criteria.map((c, cIdx) => (
                      <div key={cIdx} className="flex flex-col sm:flex-row gap-2">
                        <Input
                          value={c.title}
                          onChange={(e) => {
                            const next = [...m.criteria]
                            next[cIdx] = { ...c, title: e.target.value }
                            updateMilestone(m.id, { criteria: next })
                          }}
                          placeholder="Measurable check"
                          className="bg-[#131B2E] border-[#2D3449] text-white text-xs h-8 flex-1"
                        />
                        <select
                          value={c.evidenceType}
                          onChange={(e) => {
                            const next = [...m.criteria]
                            next[cIdx] = { ...c, evidenceType: e.target.value }
                            updateMilestone(m.id, { criteria: next })
                          }}
                          className="h-8 rounded-md bg-[#131B2E] border border-[#2D3449] text-xs text-slate-200 px-2"
                        >
                          {EVIDENCE_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="text-slate-500 hover:text-red-400 text-xs px-1"
                          onClick={() =>
                            updateMilestone(m.id, {
                              criteria: m.criteria.filter((_, i) => i !== cIdx),
                            })
                          }
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
            <CardFooter className="flex justify-between border-t border-[#222A3D] pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep(2)}
                className="border-[#2D3449] text-slate-400 text-xs gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </Button>
              <Button
                size="sm"
                disabled={budgetMismatch}
                onClick={() => {
                  if (validateStep3()) setStep(4)
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-2 disabled:opacity-40"
              >
                Preview listing
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {step === 4 && (
          <Card className="border-[#222A3D] bg-[#131B2E] text-white">
            <CardHeader>
              <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold">
                <Eye className="w-4 h-4" />
                <span>Step 4: Freelancer preview</span>
              </div>
              <CardTitle className="text-lg font-bold mt-1">This is how applicants will see it</CardTitle>
              <CardDescription className="text-xs text-slate-400">Read-only. Go back to edit.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-xl bg-[#0B1326] border border-[#2D3449] space-y-3">
                <div className="flex justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-emerald-400 font-semibold">Open contract</p>
                    <h3 className="font-bold text-sm mt-1">{projectTitle}</h3>
                    <p className="text-xs text-slate-400 mt-1">{projectDesc}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[11px] text-slate-400">Budget</p>
                    <p className="font-mono font-bold text-emerald-400">{formatCurrency(milestoneSum)}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 text-[11px]">
                  <span className="px-2 py-0.5 rounded bg-[#171F33] border border-[#2D3449] capitalize">{category}</span>
                  <span className="px-2 py-0.5 rounded bg-[#171F33] border border-[#2D3449]">Due {targetDate}</span>
                  <span className="px-2 py-0.5 rounded bg-[#171F33] border border-[#2D3449]">
                    Posted by {user?.name || 'You'}
                  </span>
                </div>
                <div className="space-y-2">
                  {milestones.map((m, idx) => (
                    <div key={m.id} className="p-2.5 rounded-lg bg-[#131B2E] border border-[#222A3D] text-xs">
                      <div className="flex justify-between gap-2">
                        <span className="font-medium">
                          M{idx + 1}. {m.title}
                        </span>
                        <span className="font-mono">{formatCurrency(m.amount)}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">{m.description}</p>
                      <ul className="mt-2 space-y-1 text-[11px] text-slate-300">
                        {m.criteria.map((c, i) => (
                          <li key={i}>
                            • {c.title}{' '}
                            <span className="text-slate-500">
                              ({EVIDENCE_TYPES.find((t) => t.value === c.evidenceType)?.label || c.evidenceType})
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t border-[#222A3D] pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep(3)}
                className="border-[#2D3449] text-slate-400 text-xs gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Edit SOW
              </Button>
              <Button
                size="sm"
                onClick={() => setStep(5)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-2"
              >
                Continue to publish
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {step === 5 && (
          <Card className="border-[#222A3D] bg-[#131B2E] text-white">
            <CardHeader>
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                <Megaphone className="w-4 h-4" />
                <span>Step 5: Publish or save</span>
              </div>
              <CardTitle className="text-lg font-bold mt-1">Open this contract to freelancers</CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Publishing does not fund PayPal and does not assign a freelancer. Applicants appear on the next screen.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-4 rounded-xl bg-[#0B1326] border border-[#2D3449] text-xs space-y-2">
                <p className="font-semibold text-white">{projectTitle}</p>
                <p className="text-slate-400">
                  {milestones.length} milestones · {formatCurrency(milestoneSum)} · {category}
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row justify-between gap-2 border-t border-[#222A3D] pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep(4)}
                className="border-[#2D3449] text-slate-400 text-xs gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isSaving}
                  onClick={() => void handleSaveDraft()}
                  className="border-[#2D3449] text-slate-200 text-xs"
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Save draft
                </Button>
                <Button
                  size="sm"
                  disabled={isSaving}
                  onClick={() => void handlePublish()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-2"
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  Publish open contract
                </Button>
              </div>
            </CardFooter>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}

export default CreateProject
