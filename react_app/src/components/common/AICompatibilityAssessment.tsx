import React from 'react'
import {
  Sparkles,
  Bot,
  CheckCircle2,
  AlertTriangle,
  Code2,
  Briefcase,
  MessageSquare,
  Lightbulb,
  ShieldAlert,
  Info,
} from 'lucide-react'

interface AICompatibilityAssessmentProps {
  vetting: any
  applicantName?: string
  workspace?: 'client' | 'freelancer'
}

export const AICompatibilityAssessment: React.FC<AICompatibilityAssessmentProps> = ({
  vetting,
}) => {
  if (!vetting) {
    return (
      <div className="bg-[#0B1120] border border-[#222A3D] rounded-xl p-4 text-xs text-slate-400 flex items-center gap-2">
        <Info className="w-4 h-4 text-slate-500" />
        <span>No automated AI evaluation report available for this proposal yet.</span>
      </div>
    )
  }

  const score = Number(vetting.score ?? 0)
  const rawRec = String(vetting.recommendation || '').toLowerCase()

  // Safely parse reasons object if it's a string
  let reasons: any = vetting.reasons || {}
  if (typeof reasons === 'string') {
    try {
      reasons = JSON.parse(reasons)
    } catch {
      reasons = {}
    }
  }

  // Extract core narrative & rationale
  const rationale: string =
    reasons.rationale ||
    (typeof reasons.reason === 'string' ? reasons.reason : '') ||
    (typeof vetting.rationale === 'string' ? vetting.rationale : '')

  // Extract dimension scores
  const dims = reasons.dimension_scores || {}

  // Extract trial milestone suggestion
  const trial = reasons.trial_milestone_suggestion || null

  // Extract matched skills
  const matchedSkills: string[] =
    vetting.matched_skills ||
    vetting.matchedSkills ||
    reasons.matched_skills ||
    []

  // Legacy list fallback if reasons is an array of strings
  const fallbackPoints: string[] = Array.isArray(reasons)
    ? reasons
    : Array.isArray(vetting.reasons)
    ? vetting.reasons
    : []

  // Profile metadata
  const completeness = reasons.profile_completeness ?? null
  const pastContracts = reasons.past_contracts_count ?? null
  const isNewcomer = Boolean(reasons.newcomer || pastContracts === 0)

  // Verdict config
  const isStrong = score >= 80 || rawRec.includes('strong')
  const isMedium = (score >= 50 && score < 80) || rawRec.includes('good') || rawRec.includes('talent') || rawRec.includes('possible')

  const verdict = isStrong
    ? {
        label: 'High Compatibility — Recommended Candidate',
        badge: 'Strong Fit',
        summary: 'Candidate shows strong alignment with project requirements, core skills and verified past work.',
        badgeClass: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60',
        barClass: 'bg-emerald-500',
        scoreColor: 'text-emerald-400',
        accentBorder: 'border-emerald-900/40',
        Icon: CheckCircle2,
      }
    : isMedium
    ? {
        label: rawRec.includes('talent')
          ? 'Promising New Talent — Verification Recommended'
          : 'Moderate Compatibility — Review Required',
        badge: rawRec.includes('talent') ? 'New Talent' : 'Moderate Match',
        summary:
          'Candidate has foundational skills or relevant background, but lacks direct mobile proof or past track record.',
        badgeClass: 'bg-amber-950/80 text-amber-300 border-amber-800/60',
        barClass: 'bg-amber-500',
        scoreColor: 'text-amber-400',
        accentBorder: 'border-amber-900/40',
        Icon: Sparkles,
      }
    : {
        label: 'Low Match — High Delivery Risk',
        badge: 'Insufficient Evidence',
        summary:
          'Candidate is missing critical required technologies or has not provided verifiable proof for this project scope.',
        badgeClass: 'bg-rose-950/80 text-rose-300 border-rose-800/60',
        barClass: 'bg-rose-500',
        scoreColor: 'text-rose-400',
        accentBorder: 'border-rose-900/40',
        Icon: AlertTriangle,
      }

  // Parse numeric dimension score (supports 0-10 or 0-100)
  const parseDimScore = (val: any): { scoreText: string; pct: number } => {
    if (val === undefined || val === null) return { scoreText: 'N/A', pct: 0 }
    if (typeof val === 'string') {
      if (val.toLowerCase().includes('insufficient')) {
        return { scoreText: 'No Track Record', pct: 15 }
      }
      const num = Number(val)
      if (!isNaN(num)) val = num
      else return { scoreText: val, pct: 50 }
    }
    const num = Number(val)
    if (isNaN(num)) return { scoreText: 'N/A', pct: 0 }
    if (num <= 10) {
      return { scoreText: `${num}/10`, pct: Math.min(100, num * 10) }
    }
    return { scoreText: `${num}/100`, pct: Math.min(100, num) }
  }

  const skillsMatchData = parseDimScore(dims.skills_match)
  const portfolioData = parseDimScore(dims.portfolio_relevance)
  const commsData = parseDimScore(dims.communication)
  const riskData = parseDimScore(dims.risk)

  return (
    <div className={`bg-[#0B1120] border ${verdict.accentBorder} rounded-xl p-5 space-y-4 shadow-sm`}>
      {/* Header Verdict Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1E293B]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <verdict.Icon className={`w-4 h-4 ${verdict.scoreColor}`} />
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
              Automated AI Compatibility Analysis
            </span>
          </div>
          <h4 className="text-sm font-bold text-white tracking-tight">
            {verdict.label}
          </h4>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="bg-[#131B2E] px-3 py-1.5 rounded-lg border border-[#222A3D] text-right">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">
              Match Score
            </span>
            <span className={`text-base font-mono font-extrabold ${verdict.scoreColor}`}>
              {score}/100
            </span>
          </div>
          <span
            className={`text-[10px] font-semibold uppercase px-2 py-1 rounded border font-mono ${verdict.badgeClass}`}
          >
            {verdict.badge}
          </span>
        </div>
      </div>

      {/* Visual Match Meter */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>Project Conformance Level</span>
          <span className="font-mono text-slate-300 font-medium">
            {score < 50 ? 'Low Conformance (< 50%)' : score < 80 ? 'Moderate Conformance' : 'High Conformance (≥ 80%)'}
          </span>
        </div>
        <div className="w-full bg-[#131B2E] rounded-full h-2.5 border border-[#222A3D] overflow-hidden p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-700 ${verdict.barClass}`}
            style={{ width: `${Math.min(100, Math.max(5, score))}%` }}
          />
        </div>
      </div>

      {/* Executive Narrative / Plain English Explanation */}
      {rationale ? (
        <div className="bg-[#131B2E] border border-blue-900/30 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-blue-400 shrink-0" />
            <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Executive AI Evaluation Summary
            </span>
          </div>
          <p className="text-xs text-slate-200 leading-relaxed">
            {rationale}
          </p>
        </div>
      ) : fallbackPoints.length > 0 ? (
        <div className="bg-[#131B2E] border border-[#222A3D] rounded-lg p-4 space-y-2">
          <span className="text-xs font-semibold text-slate-300">Key Takeaways:</span>
          <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
            {fallbackPoints.map((pt, i) => (
              <li key={i}>{pt}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* 4-Dimension Evaluation Grid */}
      {(dims.skills_match !== undefined || dims.portfolio_relevance !== undefined) && (
        <div className="space-y-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold block">
            Core Assessment Dimensions
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* 1. Skills Match */}
            <div className="bg-[#131B2E] border border-[#222A3D] rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code2 className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-xs font-semibold text-slate-200">
                    Required Skills Match
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-white">
                  {skillsMatchData.scoreText}
                </span>
              </div>
              <div className="w-full bg-[#0B1120] rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${skillsMatchData.pct}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 leading-normal">
                Alignment between the project brief's required tech stack and the freelancer's profile.
              </p>
            </div>

            {/* 2. Portfolio Relevance */}
            <div className="bg-[#131B2E] border border-[#222A3D] rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-xs font-semibold text-slate-200">
                    Portfolio Relevance
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-white">
                  {portfolioData.scoreText}
                </span>
              </div>
              <div className="w-full bg-[#0B1120] rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full"
                  style={{ width: `${portfolioData.pct}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 leading-normal">
                Direct applicability of the candidate's verified case studies and past deliverables.
              </p>
            </div>

            {/* 3. Communication & Proposal Quality */}
            <div className="bg-[#131B2E] border border-[#222A3D] rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-teal-400" />
                  <span className="text-xs font-semibold text-slate-200">
                    Proposal Clarity
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-white">
                  {commsData.scoreText}
                </span>
              </div>
              <div className="w-full bg-[#0B1120] rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-teal-500 rounded-full"
                  style={{ width: `${commsData.pct}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 leading-normal">
                Thoroughness, professionalism and technical articulation in the submitted cover proposal.
              </p>
            </div>

            {/* 4. Platform Track Record / Risk */}
            <div className="bg-[#131B2E] border border-[#222A3D] rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs font-semibold text-slate-200">
                    Track Record & Risk
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-white">
                  {isNewcomer ? 'Newcomer' : riskData.scoreText}
                </span>
              </div>
              <div className="w-full bg-[#0B1120] rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full ${isNewcomer ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: `${isNewcomer ? 25 : riskData.pct}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 leading-normal">
                {isNewcomer
                  ? 'First contract on platform. Zero completed escrow history on record.'
                  : `Completed past contracts: ${pastContracts}. Risk index: ${riskData.scoreText}.`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Strategic Recommendation: Trial Milestone Banner */}
      {trial && (
        <div className="bg-amber-950/30 border border-amber-900/50 rounded-lg p-4 flex items-start gap-3">
          <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1.5 text-xs">
            <span className="font-semibold text-amber-300 block">
              💡 Recommended Hiring Strategy: Trial Milestone
            </span>
            <p className="text-slate-200 leading-relaxed">
              {trial.reason || 'Award a small first milestone before funding the rest of the contract.'}
            </p>
            {trial.amount && (
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] text-slate-400 font-mono">Suggested Trial Escrow:</span>
                <span className="font-mono text-xs bg-amber-900/50 text-amber-200 px-2.5 py-0.5 rounded border border-amber-800/60 font-bold">
                  ${trial.amount} {trial.currency || 'USD'}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Matched Skills & Profile Metadata Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs border-t border-[#1E293B]">
        {matchedSkills.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-slate-400 font-medium mr-1">Skills Found:</span>
            {matchedSkills.map((s, idx) => (
              <span
                key={idx}
                className="bg-blue-950/80 text-blue-300 border border-blue-800/50 text-[10px] font-mono px-2 py-0.5 rounded-full"
              >
                {s}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-[11px] text-slate-500 italic">No specific core skill matches confirmed</span>
        )}

        {completeness !== null && (
          <span className="text-[10px] font-mono text-slate-400 bg-[#131B2E] px-2 py-0.5 rounded border border-[#222A3D]">
            Profile Completeness: <strong className="text-white">{completeness}%</strong>
          </span>
        )}
      </div>
    </div>
  )
}
export default AICompatibilityAssessment

