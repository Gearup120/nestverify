import { useState, useEffect, useRef, useCallback } from 'react'
import { chatAPI } from '../api'

export function useChat(conversationId) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)
  const wsRef = useRef(null)

  // Load message history
  useEffect(() => {
    if (!conversationId) return
    setLoading(true)
    chatAPI.messages(conversationId)
      .then(({ data }) => setMessages(data.results || data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [conversationId])

  // WebSocket through Vite proxy
  useEffect(() => {
    if (!conversationId) return
    const token = localStorage.getItem('access_token')
    const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const wsHost = window.location.host  // localhost:5173 — proxied to 8001
    const wsUrl = `${wsProtocol}://${wsHost}/ws/chat/${conversationId}/?token=${token}`

    const ws = new WebSocket(wsUrl)
    ws.onopen = () => setConnected(true)
    ws.onclose = () => setConnected(false)
    ws.onerror = (e) => console.error('WebSocket error:', e)
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data)
        setMessages(prev => {
          if (prev.find(m => m.id === msg.id)) return prev
          return [...prev, msg]
        })
      } catch {}
    }

    wsRef.current = ws
    return () => ws.close()
  }, [conversationId])

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || !conversationId) return
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ text }))
    } else {
      try {
        const { data } = await chatAPI.send(conversationId, text)
        setMessages(prev => [...prev, data])
      } catch (err) {
        console.error('Failed to send message:', err)
      }
    }
  }, [conversationId])

  return { messages, loading, connected, sendMessage }
}