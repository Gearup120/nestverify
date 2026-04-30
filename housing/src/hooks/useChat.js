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
    const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'
    const wsBase = apiBase.replace('http', 'ws')
    const wsUrl = `${wsBase}/ws/chat/${conversationId}/?token=${token}`

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