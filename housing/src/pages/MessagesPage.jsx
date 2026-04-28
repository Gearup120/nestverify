import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { chatAPI } from '../api'
import { useChat } from '../hooks/useChat'
import Navbar from '../components/layout/Navbar'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { MessageCircle, Send, Wifi, WifiOff, Search, Home } from 'lucide-react'
import { Link } from 'react-router-dom'
// Note: No Navbar import — Layout wrapper in App.jsx provides it

// ── Single conversation thread ────────────────────────────────────────────────
function ChatThread({ conversation, currentUser }) {
  const [text, setText] = useState('')
  const bottomRef = useRef()
  const { messages, loading, connected, sendMessage } = useChat(conversation.id)

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
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatTime = (iso) =>
    new Date(iso).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })

  const formatDate = (iso) => {
    const d = new Date(iso)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)
    if (d.toDateString() === today.toDateString()) return 'Today'
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
    return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })
  }

  const other = String(conversation.tenant?.id) === String(currentUser?.id)
    ? conversation.landlord
    : conversation.tenant

  // Group messages by date
  const groupedMessages = messages.reduce((groups, msg) => {
    const date = formatDate(msg.created_at)
    if (!groups[date]) groups[date] = []
    groups[date].push(msg)
    return groups
  }, {})

  return (
    <div className="flex flex-col h-full">
      {/* Thread header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-white">
        <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 font-semibold">
          {other?.first_name?.[0]}{other?.last_name?.[0]}
        </div>
        <div className="flex-1">
          <p className="font-medium text-gray-900">{other?.full_name}</p>
          <div className="flex items-center gap-1.5">
            {connected
              ? <><Wifi size={11} className="text-teal-500" /><span className="text-xs text-teal-500">Live</span></>
              : <><WifiOff size={11} className="text-gray-300" /><span className="text-xs text-gray-400">Connecting...</span></>
            }
          </div>
        </div>
        <Link
          to={`/properties/${conversation.property_id}`}
          className="flex items-center gap-1.5 text-xs text-teal-600 hover:text-teal-700 bg-teal-50 px-3 py-1.5 rounded-lg transition-colors"
        >
          <Home size={12} /> View listing
        </Link>
      </div>

      {/* Property context pill */}
      <div className="px-6 py-2 bg-gray-50 border-b border-gray-100">
        <p className="text-xs text-gray-400">
          Re: <span className="text-gray-600 font-medium">{conversation.property_title}</span>
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-gray-50">
        {loading ? (
          <LoadingSpinner className="py-16" />
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <div className="w-14 h-14 bg-teal-50 rounded-full flex items-center justify-center mb-0">
              <MessageCircle size={24} className="text-teal-300" />
            </div>
            <p className="text-gray-500 text-sm font-medium">No messages yet</p>
            <p className="text-gray-400 text-xs mt-1">Send a message to start the conversation</p>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, msgs]) => (
            <div key={date}>
              {/* Date separator */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400 font-medium">{date}</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <div className="space-y-3">
                {msgs.map(msg => {
                  const isMe = String(msg.sender_id) === String(currentUser?.id)
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      {!isMe && (
                        <div className="w-7 h-7 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 text-xs font-semibold mr-2 flex-shrink-0 mt-0.5">
                          {msg.sender_name?.[0]}
                        </div>
                      )}
                      <div className={`max-w-[65%] flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          isMe
                            ? 'bg-teal-600 text-white rounded-br-sm'
                            : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm shadow-sm'
                        }`}>
                          {msg.text}
                        </div>
                        <span className="text-xs text-gray-400 px-1">
                          {msg.created_at ? formatTime(msg.created_at) : ''}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-gray-100 bg-white">
        <div className="flex items-end gap-3">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
            rows={1}
            className="flex-1 resize-none border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all max-h-32"
          />
          <button
            onClick={handleSend}
            disabled={!text.trim()}
            className="w-11 h-11 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Conversation list sidebar ─────────────────────────────────────────────────
function ConversationSidebar({ conversations, loading, activeId, onSelect, currentUser }) {
  const [search, setSearch] = useState('')

  const filtered = conversations.filter(c =>
    c.property_title?.toLowerCase().includes(search.toLowerCase()) ||
    (String(c.tenant?.id) === String(currentUser?.id)
      ? c.landlord?.full_name
      : c.tenant?.full_name
    )?.toLowerCase().includes(search.toLowerCase())
  )

  const formatTime = (iso) => {
    if (!iso) return ''
    const d = new Date(iso)
    const now = new Date()
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })
    }
    return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })
  }

  return (
    <div className="flex flex-col h-full border-r border-gray-100">
      {/* Sidebar header */}
      <div className="px-5 py-5 border-b border-gray-100">
        <h2 className="font-serif text-lg font-bold text-gray-900 mb-3">Messages</h2>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <LoadingSpinner className="py-10" size="sm" />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <MessageCircle size={32} className="text-gray-200 mb-3" />
            <p className="text-sm text-gray-400">
              {search ? 'No conversations match your search.' : 'No conversations yet.'}
            </p>
            {!search && (
              <p className="text-xs text-gray-300 mt-1">
                Contact a landlord from any listing to start chatting.
              </p>
            )}
          </div>
        ) : (
          filtered.map(conv => {
            const other = String(conv.tenant?.id) === String(currentUser?.id)
              ? conv.landlord
              : conv.tenant
            const isActive = conv.id === activeId

            return (
              <button
                key={conv.id}
                onClick={() => onSelect(conv)}
                className={`w-full flex items-start gap-3 px-5 py-4 text-left transition-colors border-b border-gray-50 ${
                  isActive ? 'bg-teal-50 border-l-2 border-l-teal-600' : 'hover:bg-gray-50'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0 ${
                  isActive ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {other?.first_name?.[0]}{other?.last_name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className={`text-sm font-medium truncate ${isActive ? 'text-teal-700' : 'text-gray-900'}`}>
                      {other?.full_name}
                    </p>
                    <span className="text-xs text-gray-400 flex-shrink-0 ml-1">
                      {formatTime(conv.last_message_time)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 truncate">{conv.property_title}</p>
                  {conv.last_message_text && (
                    <p className="text-xs text-gray-500 truncate mt-0.5">{conv.last_message_text}</p>
                  )}
                </div>
                {conv.unread_count > 0 && (
                  <span className="w-5 h-5 bg-teal-600 text-white text-xs rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    {conv.unread_count}
                  </span>
                )}
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}

// ── Main Messages Page ────────────────────────────────────────────────────────
export default function MessagesPage() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeConv, setActiveConv] = useState(null)

  useEffect(() => {
    chatAPI.conversations()
      .then(({ data }) => {
        const convs = data.results || data
        setConversations(convs)
        if (convs.length > 0) setActiveConv(convs[0])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>

        {/* Sidebar */}
        <div className="w-80 flex-shrink-0 bg-white">
          <ConversationSidebar
            conversations={conversations}
            loading={loading}
            activeId={activeConv?.id}
            onSelect={setActiveConv}
            currentUser={user}
          />
        </div>

        {/* Main chat area */}
        <div className="flex-1 bg-white">
          {activeConv ? (
            <ChatThread
              key={activeConv.id}
              conversation={activeConv}
              currentUser={user}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center px-8">
              <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mb-4">
                <MessageCircle size={36} className="text-teal-300" />
              </div>
              <h3 className="font-serif text-xl font-bold text-gray-900 mb-2">Your messages</h3>
              <p className="text-gray-400 text-sm max-w-xs">
                {loading
                  ? 'Loading your conversations...'
                  : 'Select a conversation from the sidebar or contact a landlord from any listing.'
                }
              </p>
              {!loading && conversations.length === 0 && (
                <Link to="/" className="btn-primary mt-6 inline-flex items-center gap-2">
                  <Home size={15} /> Browse listings
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
  )
}