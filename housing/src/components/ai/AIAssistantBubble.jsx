import { useState, useRef, useEffect } from 'react'
import { X, Send, Sparkles, RotateCcw, ChevronDown } from 'lucide-react'
import { aiAPI, propertiesAPI } from '../../api'
import PropertyCard from '../properties/PropertyCard'

const WELCOME = {
  id: 'welcome',
  role: 'assistant',
  content: "Hi! I'm NestAI 🏠\n\nI can help you find the perfect home in Nigeria, answer housing questions, give rental advice, or just chat about anything. What can I do for you today?",
}

const SUGGESTIONS = [
  '3-bedroom apartment in Lagos under ₦300k',
  'What should I check before renting?',
  'How does escrow payment work?',
  'Find me a studio in Abuja',
  'Red flags to watch for in listings',
]

function AIPropertyCard({ id }) {
  const [property, setProperty] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await propertiesAPI.detail(id)
        setProperty(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [id])

  if (loading) return (
    <div className="w-full h-32 bg-gray-100 animate-pulse rounded-xl flex items-center justify-center">
      <p className="text-[10px] text-gray-400">Loading property...</p>
    </div>
  )
  if (!property) return null

  return (
    <div className="mt-2 scale-90 origin-top-left -ml-2 -mr-2">
      <PropertyCard property={property} />
    </div>
  )
}

export default function AIAssistantBubble() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([WELCOME])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const bottomRef = useRef()
  const inputRef = useRef()

  useEffect(() => {
    if (!minimized) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading, minimized])

  useEffect(() => {
    if (open && !minimized) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open, minimized])

  const sendMessage = async (text) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    const userMsg = { id: Date.now(), role: 'user', content: trimmed }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const apiMessages = newMessages
        .filter(m => m.id !== 'welcome')
        .map(({ role, content }) => ({ role, content }))

      const { data } = await aiAPI.chat(apiMessages)
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: data.reply,
      }])
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Something went wrong. Please try again.'
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: `Sorry, I ran into an issue: ${errMsg}`,
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) }
  }

  const reset = () => { setMessages([WELCOME]); setInput('') }

  const formatContent = (content) =>
    content.split('\n').map((line, i, arr) => (
      <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
    ))

  return (
    <div className="fixed bottom-6 right-24 z-40">
      {open && (
        <div
          className="absolute bottom-16 right-0 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden transition-all duration-200"
          style={{ height: minimized ? '56px' : '420px', maxHeight: 'calc(100vh - 120px)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-teal-700 to-teal-500 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
                <Sparkles size={14} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-white leading-none">NestAI</p>
                <p className="text-xs text-teal-100 mt-0.5">Powered by Claude</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={reset} title="Clear chat"
                className="w-7 h-7 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                <RotateCcw size={13} />
              </button>
              <button onClick={() => setMinimized(m => !m)}
                className="w-7 h-7 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                <ChevronDown size={14} className={`transition-transform ${minimized ? 'rotate-180' : ''}`} />
              </button>
              <button onClick={() => { setOpen(false); setMinimized(false) }}
                className="w-7 h-7 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                <X size={14} />
              </button>
            </div>
          </div>

          {!minimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-gray-50">
                {messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'assistant' && (
                      <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                        <Sparkles size={10} className="text-teal-600" />
                      </div>
                    )}
                    <div className={`max-w-[82%] px-3 py-2.5 rounded-2xl text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-teal-600 text-white rounded-br-sm'
                        : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm shadow-sm'
                    }`}>
                      <div className="space-y-1">
                        {msg.content.split(/\[PROPERTY_CARD: (.*?)\]/).map((part, i) => {
                          if (i % 2 === 1) return <AIPropertyCard key={i} id={part} />
                          return <div key={i}>{formatContent(part)}</div>
                        })}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Typing indicator */}
                {loading && (
                  <div className="flex justify-start">
                    <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center mr-2 flex-shrink-0">
                      <Sparkles size={10} className="text-teal-600" />
                    </div>
                    <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                      <div className="flex gap-1 items-center">
                        <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick suggestions */}
                {messages.length === 1 && !loading && (
                  <div className="space-y-1.5 pt-1">
                    <p className="text-xs text-gray-400 px-1">Try asking:</p>
                    {SUGGESTIONS.map(s => (
                      <button key={s} onClick={() => sendMessage(s)}
                        className="w-full text-left text-xs text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-100 px-3 py-2 rounded-xl transition-colors">
                        {s}
                      </button>
                    ))}
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="px-3 py-2.5 border-t border-gray-100 bg-white flex items-end gap-2 flex-shrink-0">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Ask me anything..."
                  rows={1}
                  disabled={loading}
                  className="flex-1 resize-none border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent max-h-20 disabled:opacity-50 transition-all"
                />
                <button onClick={() => sendMessage(input)} disabled={!input.trim() || loading}
                  className="w-8 h-8 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white rounded-xl flex items-center justify-center flex-shrink-0 transition-colors">
                  <Send size={12} />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Bubble button */}
      <button
        onClick={() => { setOpen(o => !o); setMinimized(false) }}
        className="w-14 h-14 bg-gradient-to-br from-teal-500 to-teal-700 hover:from-teal-400 hover:to-teal-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 relative"
        title="NestAI Assistant"
      >
        {open ? <X size={22} /> : <Sparkles size={22} />}
        {!open && <span className="absolute inset-0 rounded-full bg-teal-400 animate-ping opacity-20" />}
      </button>
    </div>
  )
}