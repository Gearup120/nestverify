import { useState, useEffect, useRef } from 'react'
import { MessageCircle, X, Send, ArrowLeft, Wifi, WifiOff } from 'lucide-react'
import { chatAPI } from '../../api'
import { useAuth } from '../../context/AuthContext'
import { useChat } from '../../hooks/useChat'
import LoadingSpinner from '../ui/LoadingSpinner'

// ── Individual conversation thread ───────────────────────────────────────────
function ConversationThread({ conversation, onBack, currentUser }) {
  const [text, setText] = useState('')
  const bottomRef = useRef()
  const { messages, loading, connected, sendMessage } = useChat(conversation.id)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!text.trim()) return
    const msg = text; setText('')
    await sendMessage(msg)
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const other = String(conversation.tenant?.id) === String(currentUser?.id)
    ? conversation.landlord
    : conversation.tenant

  return (
    <div className="flex flex-col h-full">
      {/* Thread header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft size={16} />
        </button>
        <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 font-semibold text-xs">
          {other?.first_name?.[0]}{other?.last_name?.[0]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">{other?.full_name}</p>
          <p className="text-xs text-gray-400 truncate">{conversation.property_title}</p>
        </div>
        <div className="flex items-center gap-1">
          {connected
            ? <Wifi size={11} className="text-teal-500" />
            : <WifiOff size={11} className="text-gray-300" />}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 bg-gray-50">
        {loading ? <LoadingSpinner className="py-6" size="sm" /> :
         messages.length === 0 ? (
          <p className="text-center text-xs text-gray-400 py-6">No messages yet. Say hi!</p>
         ) : messages.map(msg => {
          const isMe = String(msg.sender_id) === String(currentUser?.id)
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                isMe ? 'bg-teal-600 text-white rounded-br-sm' : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm'
              }`}>
                {msg.text}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-3 py-2.5 border-t border-gray-100 bg-white flex items-end gap-2">
        <textarea value={text} onChange={e => setText(e.target.value)} onKeyDown={handleKey}
          placeholder="Message..." rows={1}
          className="flex-1 resize-none border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent max-h-16" />
        <button onClick={handleSend} disabled={!text.trim()}
          className="w-8 h-8 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white rounded-lg flex items-center justify-center transition-colors">
          <Send size={12} />
        </button>
      </div>
    </div>
  )
}

// ── Conversation list ─────────────────────────────────────────────────────────
function ConversationList({ conversations, loading, onSelect, currentUser }) {
  if (loading) return <LoadingSpinner className="py-10" size="sm" />

  if (conversations.length === 0) return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6 py-10">
      <MessageCircle size={32} className="text-gray-200 mb-3" />
      <p className="text-sm text-gray-400">No conversations yet.</p>
      <p className="text-xs text-gray-300 mt-1">Contact a landlord from any listing to start chatting.</p>
    </div>
  )

  return (
    <div className="overflow-y-auto flex-1">
      {conversations.map(conv => {
        const other = String(conv.tenant?.id) === String(currentUser?.id)
          ? conv.landlord
          : conv.tenant

        return (
          <button key={conv.id} onClick={() => onSelect(conv)}
            className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 text-left">
            <div className="w-9 h-9 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 font-semibold text-sm flex-shrink-0">
              {other?.first_name?.[0]}{other?.last_name?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-800 truncate">{other?.full_name}</p>
                {conv.unread_count > 0 && (
                  <span className="w-5 h-5 bg-teal-600 text-white text-xs rounded-full flex items-center justify-center flex-shrink-0 ml-1">
                    {conv.unread_count}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 truncate">{conv.property_title}</p>
              {conv.last_message_text && (
                <p className="text-xs text-gray-500 truncate mt-0.5">{conv.last_message_text}</p>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}

// ── Main floating bubble ──────────────────────────────────────────────────────
export default function FloatingChatBubble() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(false)
  const [unread, setUnread] = useState(0)
  const [activeConv, setActiveConv] = useState(null)

  // Load conversations and unread count when opened
  useEffect(() => {
    if (!user) return

    const loadData = () => {
      chatAPI.conversations()
        .then(({ data }) => setConversations(data.results || data))
        .catch(console.error)

      chatAPI.unread()
        .then(({ data }) => setUnread(data.unread))
        .catch(console.error)
    }

    loadData()
    // Poll every 30s for new unread counts
    const interval = setInterval(() => {
      chatAPI.unread()
        .then(({ data }) => setUnread(data.unread))
        .catch(() => {})
    }, 30000)

    return () => clearInterval(interval)
  }, [user])

  useEffect(() => {
    if (open && user) {
      setLoading(true)
      chatAPI.conversations()
        .then(({ data }) => setConversations(data.results || data))
        .catch(console.error)
        .finally(() => setLoading(false))
    }
  }, [open, user])

  if (!user) return null

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {/* Chat panel */}
      {open && (
        <div className="absolute bottom-16 right-0 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden"
             style={{ height: '440px' }}>

          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-3 bg-teal-600">
            <div className="flex items-center gap-2">
              {activeConv && (
                <button onClick={() => setActiveConv(null)} className="text-white/70 hover:text-white mr-1">
                  <ArrowLeft size={15} />
                </button>
              )}
              <MessageCircle size={16} className="text-white" />
              <span className="text-sm font-medium text-white">
                {activeConv ? 'Chat' : 'Messages'}
              </span>
            </div>
            <button onClick={() => { setOpen(false); setActiveConv(null) }}
              className="text-white/70 hover:text-white transition-colors">
              <X size={16} />
            </button>
          </div>

          {/* Content */}
          {activeConv ? (
            <ConversationThread
              conversation={activeConv}
              onBack={() => setActiveConv(null)}
              currentUser={user}
            />
          ) : (
            <ConversationList
              conversations={conversations}
              loading={loading}
              onSelect={(conv) => { setActiveConv(conv); setUnread(u => Math.max(0, u - (conv.unread_count || 0))) }}
              currentUser={user}
            />
          )}
        </div>
      )}

      {/* Bubble button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-14 h-14 bg-teal-600 hover:bg-teal-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
    </div>
  )
}