import { useState, useCallback, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'

const STORAGE_KEY = 'chat_history'

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

function saveHistory(history) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
}

export function useChat() {
  const [chats, setChats] = useState(loadHistory)
  const [activeChatId, setActiveChatId] = useState(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const abortRef = useRef(null)

  const activeChat = chats.find(c => c.id === activeChatId) || null
  const messages = activeChat?.messages || []

  const updateChats = useCallback((updater) => {
    setChats(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      saveHistory(next)
      return next
    })
  }, [])

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

  const sendMessage = useCallback(async (text, apiKey) => {
    if (!text.trim() || isStreaming) return

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

    // Add placeholder assistant message
    updateChats(prev =>
      prev.map(c =>
        c.id === chatId
          ? { ...c, messages: [...c.messages, { id: assistantId, role: 'assistant', content: '', ts: Date.now(), streaming: true }] }
          : c
      )
    )

    setIsStreaming(true)

    try {
      // Get the full message history for context
      const history = (chats.find(c => c.id === chatId)?.messages || [])
        .filter(m => !m.streaming)
        .concat(userMsg)
        .map(m => ({ role: m.role, content: m.content }))

      // Call the API - swap this URL for your backend endpoint
      const controller = new AbortController()
      abortRef.current = controller

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, apiKey }),
        signal: controller.signal,
      })

      if (!res.ok) throw new Error(`API error ${res.status}`)

      // Stream the response
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        // Handle SSE format (data: ...\n\n) or plain text
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
              ? {
                  ...c,
                  messages: c.messages.map(m =>
                    m.id === assistantId ? { ...m, content: accumulated } : m
                  ),
                }
              : c
          )
        )
      }

      // Mark streaming done
      updateChats(prev =>
        prev.map(c =>
          c.id === chatId
            ? {
                ...c,
                messages: c.messages.map(m =>
                  m.id === assistantId ? { ...m, streaming: false } : m
                ),
              }
            : c
        )
      )
    } catch (err) {
      if (err.name === 'AbortError') {
        updateChats(prev =>
          prev.map(c =>
            c.id === chatId
              ? {
                  ...c,
                  messages: c.messages.map(m =>
                    m.id === assistantId ? { ...m, content: m.content || '*(stopped)*', streaming: false } : m
                  ),
                }
              : c
          )
        )
      } else {
        // Show error in chat
        updateChats(prev =>
          prev.map(c =>
            c.id === chatId
              ? {
                  ...c,
                  messages: c.messages.map(m =>
                    m.id === assistantId
                      ? { ...m, content: `**Error:** ${err.message}\n\nMake sure your backend is running at \`/api/chat\`.`, streaming: false, error: true }
                      : m
                  ),
                }
              : c
          )
        )
      }
    } finally {
      setIsStreaming(false)
      abortRef.current = null
    }
  }, [activeChatId, isStreaming, chats, updateChats])

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
  }
}
