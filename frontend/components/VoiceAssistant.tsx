"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { getPatients, getAlerts, type PatientRecord, type AlertRecord } from "@/lib/api"

/* ─── SpeechRecognition type shim ─── */
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  onresult: ((e: SpeechRecognitionEvent) => void) | null
  onerror: ((e: Event & { error: string }) => void) | null
  onend: (() => void) | null
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance
    webkitSpeechRecognition: new () => SpeechRecognitionInstance
  }
}

/* ─── States ─── */
type Status = "idle" | "listening" | "processing" | "speaking" | "error"

/* ─── Inline SVG icons ─── */
const MicIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" x2="12" y1="19" y2="22" />
  </svg>
)

const StopIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="6" width="12" height="12" rx="2" />
  </svg>
)

const BotIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 8V4H8" /><rect width="16" height="12" x="4" y="8" rx="2" />
    <path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path d="M9 13v2" />
  </svg>
)

interface ChatMessage {
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export function VoiceAssistant() {
  const [panelOpen, setPanelOpen] = useState(false)
  const [status, setStatus] = useState<Status>("idle")
  const [liveTranscript, setLiveTranscript] = useState("")
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [errorMsg, setErrorMsg] = useState("")
  const [patients, setPatients] = useState<PatientRecord[]>([])
  const [alerts, setAlerts] = useState<AlertRecord[]>([])

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const finalTranscriptRef = useRef("")
  const explicitStopRef = useRef(false)
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const hasErrorRef = useRef(false)

  // Keep refs in sync to prevent stale closure bugs in SpeechRecognition callbacks
  const patientsRef = useRef(patients)
  const alertsRef = useRef(alerts)
  const chatHistoryRef = useRef(chatHistory)

  useEffect(() => {
    patientsRef.current = patients
  }, [patients])

  useEffect(() => {
    alertsRef.current = alerts
  }, [alerts])

  useEffect(() => {
    chatHistoryRef.current = chatHistory
  }, [chatHistory])

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
  }, [])

  /* ── Fetch live data via WebSockets so the AI has identical context to the dashboard ── */
  const load = useCallback(async () => {
    try {
      const [p, a] = await Promise.all([getPatients(), getAlerts()])
      setPatients(p)
      setAlerts(a)
    } catch (err) {
      console.error("VoiceAssistant API Error:", err)
    }
  }, [])

  useEffect(() => {
    load()

    let ws: WebSocket
    try {
      // @ts-ignore - dynamic import to avoid circular dependency issues if any
      import("@/lib/api").then(({ createPredictionWebSocket }) => {
        ws = createPredictionWebSocket((msg: any) => {
          // Whenever a websocket broadcast occurs (simulation advances), refetch the latest records
          load()
        })
      })
    } catch (err) {
      console.error("VoiceAssistant WS Error:", err)
    }

    return () => {
      if (ws) ws.close()
    }
  }, [load])

  /* ── Auto-scroll chat ── */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatHistory, liveTranscript])

  /* ── Speech Recognition setup ── */
  const getRecognition = useCallback(() => {
    if (recognitionRef.current) return recognitionRef.current
    const SR = typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : null
    if (!SR) return null

    const recognition = new SR()
    recognition.continuous = true // We want it to keep listening
    recognition.interimResults = true
    recognition.lang = "en-US"

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join("")
      setLiveTranscript(transcript)
      finalTranscriptRef.current = transcript

      // Reset the silence timer
      clearSilenceTimer()
      if (transcript.trim().length > 0) {
        silenceTimerRef.current = setTimeout(() => {
          explicitStopRef.current = true
          try { recognition.stop() } catch {}
        }, 1800) // 1.8 seconds silence timeout to submit
      }
    }

    recognition.onerror = (event: Event & { error: string }) => {
      if (event.error === "no-speech") {
        // Ignore no-speech so it doesn't kill the session if they are just thinking
        return
      }
      hasErrorRef.current = true
      explicitStopRef.current = true // Stop auto-restart loop on real error
      if (event.error === "network") {
        setErrorMsg("Network error: Edge's speech service is unreachable. Try Chrome, check VPN, or verify permissions.")
      } else {
        setErrorMsg(`Microphone error: ${event.error}`)
      }
      setStatus("error")
      setTimeout(() => { setStatus("idle"); setErrorMsg("") }, 4000)
    }

    recognition.onend = () => {
      clearSilenceTimer()
      
      // If we had a critical error, do not auto-restart
      if (hasErrorRef.current) {
        setStatus("error")
        return
      }

      if (!explicitStopRef.current) {
        // The browser automatically stopped it due to a pause or quiet voice.
        // We restart it immediately to keep listening!
        try { recognition.start() } catch {}
        return
      }

      // Explicitly stopped by user
      const text = finalTranscriptRef.current
      if (text?.trim()) {
        sendToAssistant(text.trim())
      } else {
        setStatus((prev) => (prev === "error" ? "error" : "idle"))
      }
    }

    recognitionRef.current = recognition
    return recognition
  }, [clearSilenceTimer])

  /* ── Start / Stop ── */
  const startListening = useCallback(() => {
    const recognition = getRecognition()
    if (!recognition) {
      setErrorMsg("Speech recognition not supported in this browser.")
      setStatus("error")
      setTimeout(() => { setStatus("idle"); setErrorMsg("") }, 3000)
      return
    }
    window.speechSynthesis.cancel()
    setLiveTranscript("")
    finalTranscriptRef.current = ""
    setErrorMsg("")
    setStatus("listening")
    explicitStopRef.current = false
    hasErrorRef.current = false
    clearSilenceTimer()
    try { recognition.start() } catch { /* already started */ }
  }, [getRecognition, clearSilenceTimer])

  const stopListening = useCallback(() => {
    explicitStopRef.current = true
    clearSilenceTimer()
    try { recognitionRef.current?.stop() } catch { /* ignore */ }
  }, [clearSilenceTimer])

  const toggleRecording = useCallback(() => {
    if (status === "listening") {
      stopListening()
    } else if (status === "idle" || status === "error") {
      if (!panelOpen) setPanelOpen(true)
      startListening()
    }
  }, [status, panelOpen, startListening, stopListening])

  /* ── OpenAI call ── */
  const sendToAssistant = async (transcript: string) => {
    setStatus("processing")
    setChatHistory((prev) => [
      ...prev.slice(-4),
      { role: "user", content: transcript, timestamp: new Date() },
    ])
    setLiveTranscript("")

    try {
      const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY
      if (!apiKey) throw new Error("OpenAI API key not configured")

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          max_tokens: 150,
          temperature: 0.3,
          messages: [
            {
              role: "system",
              content: `You are VitalSense AI Voice Assistant for ICU doctors.
VitalSense AI is a real-time ICU patient monitoring and sepsis risk prediction dashboard.
Here is the background info about VitalSense AI (the product/system):
- Tech Stack: Next.js (Frontend), FastAPI (Backend), WebSockets (Live streaming predictions every 15 seconds).
- ML Core: Sepsis prediction uses an ensemble model combining XGBoost (60% weight) and LSTM (40% weight) with SHAP explainability.
- Database: Scaffolded for PostgreSQL, but currently running on in-memory storage (patients_db and alerts_db) for the prototype.
- Team GIT SUMMER: Arham Boonlia (Frontend & Data Infra), Saif Ur Rahman (AI/ML & Clinical Intelligence).
- Readiness: Currently a high-fidelity prototype / MVP. Not yet HIPAA compliant or clinical production-ready.

You also have access to the current live ICU data:
Current Patient Data: ${JSON.stringify(patientsRef.current)}
Current Alerts: ${JSON.stringify(alertsRef.current)}

Rules:
- Always answer in English.
- Answer in maximum 2-3 short sentences. Keep it very concise and fast.
- Be direct, clinical, and precise.
- If the user asks about patients or alerts, always include specific numbers, vitals, and patient IDs/beds based on the JSON data provided above.
- If a patient is asked about and not in the data, state clearly that you have no data for them.
- If asked about the product, architecture, models, or team, answer using the product info above.
- Do NOT say "Based on the data provided" or "I cannot access real-time data" (because you have it).`,
            },
            ...chatHistoryRef.current.map((msg) => ({ role: msg.role, content: msg.content })),
            { role: "user", content: transcript },
          ],
        }),
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error((errData as any).error?.message || `API error: ${response.status}`)
      }

      const data = await response.json()
      const answer = (data as any).choices[0].message.content as string

      setChatHistory((prev) => [
        ...prev.slice(-4),
        { role: "assistant", content: answer, timestamp: new Date() },
      ])
      setStatus("speaking")
      speak(answer)
    } catch (error: any) {
      const fallback = "I encountered an issue processing your request. Please try again."
      setChatHistory((prev) => [...prev.slice(-4), { role: "assistant", content: fallback, timestamp: new Date() }])
      setErrorMsg(error.message)
      setStatus("error")
      setTimeout(() => { setStatus("idle"); setErrorMsg("") }, 4000)
    }
  }

  /* ── Text-to-Speech ── */
  const speak = (text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return

    window.speechSynthesis.cancel() // Cancel any ongoing speech to prevent hanging on Edge

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = "en-US" // Strictly force English language
    utterance.rate = 0.95
    utterance.pitch = 1.0
    utterance.volume = 1.0
    
    const voices = window.speechSynthesis.getVoices()
    
    // Prioritize local English voices to bypass cloud TTS latency on Edge.
    // Filter out remote/online/natural voices.
    let selectedVoice = voices.find((v) => 
      v.lang.startsWith("en") && 
      v.localService === true &&
      !v.name.includes("Online") &&
      !v.name.includes("Natural") &&
      (v.name.includes("Google") || v.name.includes("Samantha") || v.name.includes("Daniel") || v.name.includes("Microsoft") || v.name.includes("David") || v.name.includes("Zira"))
    )

    if (!selectedVoice) {
      selectedVoice = voices.find((v) => 
        v.lang.startsWith("en") && 
        v.localService === true &&
        !v.name.includes("Online") &&
        !v.name.includes("Natural")
      )
    }

    if (!selectedVoice) {
      selectedVoice = voices.find((v) => 
        v.lang.startsWith("en") && 
        !v.name.includes("Online") &&
        !v.name.includes("Natural")
      )
    }

    if (!selectedVoice) {
      selectedVoice = voices.find((v) => v.lang.startsWith("en"))
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice
    }

    utterance.onend = () => setStatus("idle")
    utterance.onerror = () => setStatus("idle")
    window.speechSynthesis.speak(utterance)
  }

  /* ── Keyboard shortcuts ── */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || (e.target as HTMLElement).isContentEditable) return
      if (e.code === "Space") {
        e.preventDefault()
        if (e.repeat) return // Prevent auto-repeat from spamming start/stop
        if (status === "idle" || status === "error") {
          if (!panelOpen) setPanelOpen(true)
          startListening()
        }
      }
      if (e.code === "Escape" && panelOpen) { e.preventDefault(); handleClosePanel() }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || (e.target as HTMLElement).isContentEditable) return
      if (e.code === "Space") {
        e.preventDefault()
        stopListening()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [status, panelOpen, startListening, stopListening])

  /* ── Preload voices ── */
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return
    
    const loadVoices = () => {
      window.speechSynthesis.getVoices()
    }
    loadVoices()
    
    if (window.speechSynthesis.addEventListener) {
      window.speechSynthesis.addEventListener("voiceschanged", loadVoices)
    } else {
      window.speechSynthesis.onvoiceschanged = loadVoices
    }
    
    return () => {
      if (window.speechSynthesis.removeEventListener) {
        window.speechSynthesis.removeEventListener("voiceschanged", loadVoices)
      } else {
        window.speechSynthesis.onvoiceschanged = null
      }
    }
  }, [])

  const handleClosePanel = () => {
    setPanelOpen(false)
    stopListening()
    window.speechSynthesis.cancel()
    setStatus("idle")
    setLiveTranscript("")
    setErrorMsg("")
    clearSilenceTimer()
  }

  const handleFabClick = () => {
    if (!panelOpen) {
      setPanelOpen(true)
      // Small delay to let the panel animation start before grabbing the mic
      setTimeout(() => startListening(), 50)
    } else {
      toggleRecording()
    }
  }

  const statusLabel = (() => {
    switch (status) {
      case "listening": return "🎤 Listening..."
      case "processing": return "🔍 Analyzing patient data..."
      case "speaking": return "🔊 Speaking..."
      case "error": return `⚠️ ${errorMsg || "Error occurred"}`
      default: return "Tap mic or press Space to speak"
    }
  })()

  /* ── Render ── */
  return (
    <>
      {/* ─ Floating Action Button ─ */}
      <button
        id="voice-assistant-fab"
        onClick={handleFabClick}
        title={panelOpen ? "Tap to speak" : "Open Voice Assistant"}
        aria-label="Voice Assistant"
        className={`
          fixed z-[9990] flex h-[60px] w-[60px] items-center justify-center rounded-full border-0
          text-white shadow-lg transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer
          hover:scale-[1.08] active:scale-95 outline-none
          ${panelOpen ? "bottom-[510px] right-7" : "bottom-7 right-7"}
          ${status === "listening"
            ? "bg-gradient-to-br from-red-500 to-red-600 shadow-[0_6px_24px_rgba(239,68,68,0.4)] animate-[va-fab-pulse_1.6s_ease-in-out_infinite]"
            : "bg-gradient-to-br from-[#00B4D8] to-[#0096B7] shadow-[0_6px_24px_rgba(0,180,216,0.35)]"
          }
        `}
      >
        {status === "listening" && (
          <>
            <span className="absolute h-[60px] w-[60px] rounded-full border-[2.5px] border-red-500/50 animate-[va-ring_1.8s_cubic-bezier(0.215,0.61,0.355,1)_infinite] pointer-events-none" />
            <span className="absolute h-[60px] w-[60px] rounded-full border-[2.5px] border-red-500/50 animate-[va-ring_1.8s_cubic-bezier(0.215,0.61,0.355,1)_0.6s_infinite] pointer-events-none" />
          </>
        )}
        {status === "listening" ? <StopIcon /> : <MicIcon />}
      </button>

      {/* ─ Panel ─ */}
      {panelOpen && (
        <div
          role="dialog"
          aria-label="Voice Assistant Panel"
          className="fixed bottom-7 right-7 z-[9989] flex w-[380px] max-h-[480px] flex-col overflow-hidden rounded-[20px] border border-white/[0.06] bg-[#112240] shadow-[0_24px_80px_rgba(0,0,0,0.4),0_0_1px_rgba(255,255,255,0.1)_inset] animate-[va-panel-in_0.35s_cubic-bezier(0.16,1,0.3,1)_forwards]"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 border-b border-white/[0.06] bg-gradient-to-b from-[#00B4D8]/[0.08] to-transparent px-5 pt-5 pb-3.5">
            <div>
              <h3 className="m-0 text-base font-bold tracking-tight text-slate-200">🎙️ VitalSense Voice Assistant</h3>
              <p className="mt-1 text-[0.78rem] font-medium text-slate-500">Ask anything about your patients</p>
            </div>
            <button
              onClick={handleClosePanel}
              aria-label="Close"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.06] text-slate-400 transition-colors hover:bg-red-500/15 hover:text-red-400 hover:border-red-500/20 cursor-pointer"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18" /><path d="m6 6 12 12" />
              </svg>
            </button>
          </div>

          {/* Chat area */}
          <div className="flex min-h-[180px] max-h-[240px] flex-1 flex-col gap-3 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {chatHistory.length === 0 && !liveTranscript && (
              <div className="py-4 text-center text-slate-500">
                <div className="mb-2 text-2xl">🎙️</div>
                <p className="mb-3 text-[0.82rem] font-medium">Try saying:</p>
                <div className="flex flex-col items-center gap-1.5">
                  {['"Who is critical right now?"', '"Give me ICU summary"', '"How many active alerts?"'].map((s) => (
                    <span key={s} className="rounded-full border border-white/[0.06] bg-white/[0.04] px-3.5 py-1.5 text-xs italic text-slate-400">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {chatHistory.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2 max-w-[88%] animate-[va-bubble-in_0.25s_ease_forwards] ${msg.role === "user" ? "self-end flex-row-reverse" : "self-start"}`}
              >
                {msg.role === "assistant" && (
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#00B4D8]/15 text-[#00B4D8]">
                    <BotIcon />
                  </span>
                )}
                <div className={`rounded-2xl px-3.5 py-2.5 ${msg.role === "user"
                  ? "rounded-br-sm bg-gradient-to-br from-[#00B4D8] to-[#0096B7] text-white"
                  : "rounded-bl-sm bg-[#1E3A5F] text-slate-300"
                }`}>
                  <p className="m-0 text-[0.82rem] font-medium leading-relaxed">{msg.content}</p>
                  <span className={`mt-1 block text-[0.65rem] ${msg.role === "user" ? "text-white/60" : "text-slate-300/40"}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            ))}

            {/* Live transcript */}
            {liveTranscript && (
              <div className="flex max-w-[88%] animate-[va-bubble-in_0.25s_ease_forwards] self-end flex-row-reverse gap-2">
                <div className="rounded-2xl rounded-br-sm border border-dashed border-[#00B4D8]/30 bg-gradient-to-br from-[#00B4D8] to-[#0096B7] px-3.5 py-2.5 text-white opacity-85">
                  <p className="m-0 text-[0.82rem] font-medium leading-relaxed">{liveTranscript}</p>
                  <span className="mt-1.5 flex gap-[3px]">
                    {[0, 1, 2].map((n) => (
                      <span key={n} className="inline-block h-[5px] w-[5px] rounded-full bg-white/50 animate-[va-live-bounce_1.2s_ease-in-out_infinite]" style={{ animationDelay: `${n * 0.15}s` }} />
                    ))}
                  </span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Status bar */}
          <div className={`flex items-center justify-center gap-2 border-t border-white/[0.04] bg-black/15 px-4 py-2.5 text-[0.78rem] font-semibold ${
            status === "listening" ? "text-red-400"
              : status === "processing" ? "text-amber-400"
              : status === "speaking" ? "text-[#00B4D8]"
              : status === "error" ? "text-red-400"
              : "text-slate-500"
          }`}>
            {status === "processing" && (
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            )}
            {status === "speaking" && (
              <span className="flex h-4 items-center gap-[2.5px]">
                {[6, 10, 14, 10, 6].map((h, i) => (
                  <span key={i} className="block w-[3px] rounded-full bg-[#00B4D8] animate-[va-wave_0.9s_ease-in-out_infinite]" style={{ height: `${h}px`, animationDelay: `${i * 0.1}s` }} />
                ))}
              </span>
            )}
            <span>{statusLabel}</span>
          </div>

          {/* Mic control */}
          <div className="flex items-center justify-center gap-3 bg-black/10 px-5 pt-3.5 pb-4">
            <button
              onClick={toggleRecording}
              disabled={status === "processing" || status === "speaking"}
              aria-label={status === "listening" ? "Stop recording" : "Start recording"}
              className={`
                flex h-12 w-12 items-center justify-center rounded-full border-0 text-white transition-all duration-200 cursor-pointer
                disabled:opacity-50 disabled:cursor-not-allowed outline-none
                ${status === "listening"
                  ? "bg-gradient-to-br from-red-500 to-red-600 shadow-[0_4px_16px_rgba(239,68,68,0.3)] animate-[va-fab-pulse_1.4s_ease-in-out_infinite]"
                  : "bg-gradient-to-br from-[#00B4D8] to-[#0096B7] shadow-[0_4px_16px_rgba(0,180,216,0.3)] hover:scale-[1.08]"
                }
              `}
            >
              {status === "listening" ? <StopIcon /> : <MicIcon />}
            </button>
            <span className="text-[0.72rem] font-medium text-slate-600">
              Hold <kbd className="mx-0.5 inline-block rounded border border-white/10 bg-white/[0.06] px-1.5 py-0.5 font-mono text-[0.68rem] text-slate-400">Space</kbd> to talk
            </span>
          </div>
        </div>
      )}

      {/* ─ CSS Keyframes (injected once) ─ */}
      <style jsx global>{`
        @keyframes va-fab-pulse {
          0%, 100% { box-shadow: 0 6px 24px rgba(239,68,68,0.4), 0 0 0 0 rgba(239,68,68,0.3); }
          50% { box-shadow: 0 6px 24px rgba(239,68,68,0.4), 0 0 0 12px rgba(239,68,68,0); }
        }
        @keyframes va-ring {
          0% { transform: scale(1); opacity: 0.7; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes va-panel-in {
          from { opacity: 0; transform: translateY(24px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes va-bubble-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes va-live-bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
        @keyframes va-wave {
          0%, 100% { transform: scaleY(0.5); }
          50% { transform: scaleY(1.5); }
        }
        @media (max-width: 480px) {
          #voice-assistant-fab { right: 16px !important; bottom: 16px !important; width: 54px !important; height: 54px !important; }
          [role="dialog"][aria-label="Voice Assistant Panel"] { width: calc(100vw - 24px) !important; right: 12px !important; bottom: 12px !important; max-height: 70vh !important; }
        }
      `}</style>
    </>
  )
}
