import { useState, useCallback, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { apiUrl } from '../api'

function storageKey(userId) {
  return userId ? `chat_history_${userId}` : null
}

function loadHistory(userId) {
  const key = storageKey(userId)
  if (!key) return []
  try {
    return JSON.parse(localStorage.getItem(key) || '[]')
  } catch {
    return []
  }
}

function saveHistory(userId, history) {
  const key = storageKey(userId)
  if (!key) return
  localStorage.setItem(key, JSON.stringify(history))
}

export function useChat({ userId, token } = {}) {
  const [chats, setChats] = useState(() => loadHistory(userId))
  const [activeChatId, setActiveChatId] = useState(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const abortRef = useRef(null)

  const activeChat = chats.find(c => c.id === activeChatId) || null
  const messages = activeChat?.messages || []

  // Reload chats when user changes (login / logout)
  const resetForUser = useCallback((newUserId) => {
    setChats(loadHistory(newUserId))
    setActiveChatId(null)
  }, [])

  const updateChats = useCallback((updater) => {
    setChats(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      saveHistory(userId, next)
      return next
    })
  }, [userId])

  const newChat = useCallback(() => {
    const id = uuidv4()
    const chat = { id, title: 'New chat', messages: [], createdAt: Date.now() }
    updateChats(prev => [chat, ...prev])
    setActiveChatId(id)
    return id
  }, [updateChats])

  const deleteChat = useCallback((id) => {
    updateChats(prev => prev.filter(c => c.id !== id))
    setActiveChatId(prev => prev === id ? null : prev)
  }, [updateChats])

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || isStreaming || !userId) return

    let chatId = activeChatId
    let isNew = false

    if (!chatId) {
      chatId = uuidv4()
      isNew = true
    }

    const userMsg = { id: uuidv4(), role: 'user', content: text, ts: Date.now() }
    const assistantId = uuidv4()

    updateChats(prev => {
      const existing = prev.find(c => c.id === chatId)
      const title = existing?.title === 'New chat' || isNew
        ? text.slice(0, 40) + (text.length > 40 ? '…' : '')
        : existing?.title || 'New chat'

      if (isNew || !existing) {
        return [
          { id: chatId, title, messages: [userMsg], createdAt: Date.now() },
          ...prev,
        ]
      }
      return prev.map(c =>
        c.id === chatId
          ? { ...c, title, messages: [...c.messages, userMsg] }
          : c
      )
    })

    if (isNew) setActiveChatId(chatId)

    updateChats(prev =>
      prev.map(c =>
        c.id === chatId
          ? { ...c, messages: [...c.messages, { id: assistantId, role: 'assistant', content: '', ts: Date.now(), streaming: true }] }
          : c
      )
    )

    setIsStreaming(true)

    try {
      const history = (chats.find(c => c.id === chatId)?.messages || [])
        .filter(m => !m.streaming)
        .concat(userMsg)
        .map(m => ({ role: m.role, content: m.content }))

      const controller = new AbortController()
      abortRef.current = controller

      const res = await fetch(apiUrl('/api/chat'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ messages: history }),
        signal: controller.signal,
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `API error ${res.status}`)
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue
            try {
              const parsed = JSON.parse(data)
              const delta = parsed.choices?.[0]?.delta?.content
                || parsed.delta?.text
                || parsed.content
                || ''
              accumulated += delta
            } catch {
              accumulated += data
            }
          } else if (line && !line.startsWith(':')) {
            accumulated += line
          }
        }

        updateChats(prev =>
          prev.map(c =>
            c.id === chatId
              ? { ...c, messages: c.messages.map(m => m.id === assistantId ? { ...m, content: accumulated } : m) }
              : c
          )
        )
      }

      updateChats(prev =>
        prev.map(c =>
          c.id === chatId
            ? { ...c, messages: c.messages.map(m => m.id === assistantId ? { ...m, streaming: false } : m) }
            : c
        )
      )
    } catch (err) {
      if (err.name === 'AbortError') {
        updateChats(prev =>
          prev.map(c =>
            c.id === chatId
              ? { ...c, messages: c.messages.map(m => m.id === assistantId ? { ...m, content: m.content || '*(stopped)*', streaming: false } : m) }
              : c
          )
        )
      } else {
        updateChats(prev =>
          prev.map(c =>
            c.id === chatId
              ? { ...c, messages: c.messages.map(m => m.id === assistantId ? { ...m, content: `**Error:** ${err.message}`, streaming: false, error: true } : m) }
              : c
          )
        )
      }
    } finally {
      setIsStreaming(false)
      abortRef.current = null
    }
  }, [activeChatId, isStreaming, chats, updateChats, userId, token])

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  return {
    chats,
    activeChatId,
    activeChat,
    messages,
    isStreaming,
    setActiveChatId,
    newChat,
    deleteChat,
    sendMessage,
    stopStreaming,
    resetForUser,
  }
}
