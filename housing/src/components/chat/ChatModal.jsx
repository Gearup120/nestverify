import { useState, useEffect, useRef } from 'react'
import { X, Send, Wifi, WifiOff } from 'lucide-react'
import { chatAPI } from '../../api'
import { useAuth } from '../../context/AuthContext'
import { useChat } from '../../hooks/useChat'
import LoadingSpinner from '../ui/LoadingSpinner'

export default function ChatModal({ property, onClose }) {
  const { user } = useAuth()
  const [conversationId, setConversationId] = useState(null)
  const [starting, setStarting] = useState(true)
  const [text, setText] = useState('')
  const bottomRef = useRef()

  const { messages, loading, connected, sendMessage } = useChat(conversationId)

  useEffect(() => {
    if (!property?.id) return
    chatAPI.start(property.id)
      .then(({ data }) => setConversationId(data.id))
      .catch(console.error)
      .finally(() => setStarting(false))
  }, [property?.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!text.trim()) return
    const msg = text
    setText('')
    await sendMessage(msg)
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const formatTime = (iso) =>
    new Date(iso).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl flex flex-col overflow-hidden" style={{ height: '520px' }}>
        <div className="flex items-center justify-between px-5 py-4 bg-teal-600">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-teal-500 flex items-center justify-center text-white font-semibold text-sm">
              {property?.owner?.first_name?.[0]}{property?.owner?.last_name?.[0]}
            </div>
            <div>
              <p className="text-sm font-medium text-white">{property?.owner?.full_name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                {connected
                  ? <><Wifi size={10} className="text-teal-200" /><span className="text-xs text-teal-200">Live</span></>
                  : <><WifiOff size={10} className="text-teal-300" /><span className="text-xs text-teal-300">Connecting...</span></>}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors"><X size={18} /></button>
        </div>

        <div className="px-4 py-2 bg-teal-50 border-b border-teal-100">
          <p className="text-xs text-teal-700 truncate">Re: {property?.title}</p>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50">
          {starting || loading ? <LoadingSpinner className="py-10" /> :
           messages.length === 0 ? (
            <div className="text-center py-8"><p className="text-sm text-gray-400">Say hello to start the conversation!</p></div>
           ) : messages.map((msg) => {
            const isMe = String(msg.sender_id) === String(user?.id)
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[78%] flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                  {!isMe && <p className="text-xs text-gray-400 px-1">{msg.sender_name}</p>}
                  <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${isMe ? 'bg-teal-600 text-white rounded-br-sm' : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm shadow-sm'}`}>
                    {msg.text}
                  </div>
                  <span className="text-xs text-gray-400 px-1">{msg.created_at ? formatTime(msg.created_at) : ''}</span>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        <div className="px-4 py-3 border-t border-gray-100 bg-white flex items-end gap-2">
          <textarea value={text} onChange={e => setText(e.target.value)} onKeyDown={handleKey}
            placeholder="Type a message... (Enter to send)" rows={1} disabled={starting}
            className="flex-1 resize-none border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all max-h-24 disabled:opacity-50" />
          <button onClick={handleSend} disabled={!text.trim() || starting}
            className="w-10 h-10 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white rounded-xl flex items-center justify-center flex-shrink-0 transition-colors">
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}