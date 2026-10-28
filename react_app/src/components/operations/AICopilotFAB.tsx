import React, { useState, useEffect, useRef } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Bot,
  // Sparkles,
  Send,
  X,
  // Minimize2,
  // Maximize2,
  // MessageSquare,
  // ShieldCheck,
  RefreshCw,
} from 'lucide-react'

interface Message {
  id: string
  sender: 'user' | 'assistant'
  text: string
  timestamp: string
  suggestedActions?: string[]
  dataSummary?: Record<string, any>
}

interface AICopilotFABProps {
  workspace: 'client' | 'freelancer'
  promptStarters?: string[]
  contextData?: Record<string, any>
}

export const AICopilotFAB: React.FC<AICopilotFABProps> = ({
  workspace,
  promptStarters = [
    'Summarize total escrow funds and pending milestone verifications',
    'Which milestone is currently in verification and what is its status?',
    'Break down PayPal payouts disbursed versus funds staged in sandbox',
  ],
  contextData,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [showText, setShowText] = useState(false)
  const [inputText, setInputText] = useState('')
  const [isAgentThinking, setIsAgentThinking] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init-1',
      sender: 'assistant',
      text:
        workspace === 'client'
          ? "👋 Hello! I am your TrustBroker AI Operations Copilot. Ask me about your active contracts, escrow balances, milestone verifications, or PayPal releases."
          : "👋 Hello! I am your Freelancer Copilot. Ask me about your active deliverables, earnings, pending AI verifications, or marketplace matching.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedActions: promptStarters,
    },
  ])

  const chatScrollRef = useRef<HTMLDivElement>(null)

  // Animated icon <-> "Ask AI" text cycle
  useEffect(() => {
    if (isOpen) return
    const interval = setInterval(() => {
      setShowText((prev) => !prev)
    }, 3500)
    return () => clearInterval(interval)
  }, [isOpen])

  // Auto-scroll chat to latest message
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
    }
  }, [messages, isAgentThinking, isOpen])

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = queryText || inputText
    if (!textToSend.trim() || isAgentThinking) return

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, userMsg])
    if (!queryText) setInputText('')
    setIsAgentThinking(true)

    try {
      const res = await api.ai.studioTurn({
        message: textToSend.trim(),
        workspace,
        context: contextData,
      })

      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: res.response || 'Analysis complete.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedActions: res.suggested_actions || promptStarters,
        dataSummary: res.data_summary,
      }
      setMessages((prev) => [...prev, botMsg])
    } catch (err: any) {
      const errMsg: Message = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: `Unable to query AI telemetry: ${err?.message || 'Connection error'}. Please try again shortly.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedActions: promptStarters,
      }
      setMessages((prev) => [...prev, errMsg])
    } finally {
      setIsAgentThinking(false)
    }
  }

  return (
    <>
      {/* Floating Chat Modal / Popover */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 sm:right-8 z-50 w-[92vw] sm:w-[420px] max-h-[80vh] sm:max-h-[620px] flex flex-col rounded-2xl bg-[#0E172E] border border-blue-500/30 shadow-2xl shadow-blue-950/70 overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-[#0B1326] via-[#101D3B] to-[#0B1326] border-b border-[#1E293B] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white tracking-tight">Studio AI Copilot</h3>
                  <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 bg-emerald-500/10 text-[9px] font-mono px-1.5 py-0">
                    Live Telemetry
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-400">
                  {workspace === 'client' ? 'Client Operations Intelligence' : 'Freelancer Deliverables Copilot'}
                </p>
              </div>
            </div>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
              title="Close Copilot"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Messages Scroll Area */}
          <div ref={chatScrollRef} className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs max-h-[400px] min-h-[280px]">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] p-3.5 rounded-2xl text-xs leading-relaxed ${m.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-xs shadow-md'
                      : 'bg-[#131B2E] border border-[#1E293B] text-slate-200 rounded-bl-xs'
                    }`}
                >
                  <div className="whitespace-pre-wrap">{m.text}</div>

                  {/* Suggested Query Buttons */}
                  {m.suggestedActions && m.suggestedActions.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-700/50 space-y-1">
                      <span className="text-[10px] text-slate-400 font-medium block">
                        Suggested queries:
                      </span>
                      <div className="flex flex-col gap-1 mt-1">
                        {m.suggestedActions.map((act, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleSendMessage(act)}
                            className="text-left text-[11px] bg-[#1A2645] hover:bg-blue-600/30 text-blue-300 hover:text-white px-2.5 py-1.5 rounded-lg border border-blue-500/20 hover:border-blue-400/40 transition-colors cursor-pointer"
                          >
                            → {act}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-slate-500 font-mono mt-1 px-1">
                  {m.timestamp}
                </span>
              </div>
            ))}

            {isAgentThinking && (
              <div className="flex items-start gap-2">
                <div className="bg-[#131B2E] border border-[#1E293B] p-3 rounded-2xl text-slate-400 flex items-center gap-2 text-xs">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
                  <span>Analyzing PostgreSQL telemetry &amp; generating insights...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input Box */}
          <div className="p-3 bg-[#0B1326] border-t border-[#1E293B]">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSendMessage()
              }}
              className="flex items-center gap-2"
            >
              <Input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask about contracts, milestones, payouts..."
                disabled={isAgentThinking}
                className="bg-[#131B2E] border-[#222A3D] text-white text-xs h-9 focus-visible:ring-blue-500 placeholder:text-slate-500"
              />
              <Button
                type="submit"
                disabled={!inputText.trim() || isAgentThinking}
                className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-3 shrink-0 text-xs gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Action Button (FAB) */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="group relative flex items-center gap-2.5 px-4 h-13 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 text-white shadow-xl shadow-blue-600/30 hover:shadow-blue-500/50 hover:scale-105 active:scale-95 transition-all duration-300 border border-blue-400/40 cursor-pointer"
          title="Open AI Operations Copilot"
        >
          {/* Glowing Aura Ring */}
          <span className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 opacity-50 blur-sm group-hover:opacity-80 transition duration-300 -z-10" />

          {/* Bot Icon with animated sparkle */}
          <div className="relative flex items-center justify-center">
            <Bot className="w-5 h-5 text-white transition-transform group-hover:rotate-12 duration-300" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400" />
          </div>

          {/* Animated Text: Icon <-> "Ask AI" */}
          <span
            className={`font-semibold text-xs tracking-wide transition-all duration-300 overflow-hidden whitespace-nowrap ${showText || isOpen ? 'max-w-[80px] opacity-100' : 'max-w-0 opacity-0'
              }`}
          >
            Ask AI
          </span>
        </button>
      </div>
    </>
  )
}

export default AICopilotFAB
