import { useState, useRef, useEffect } from 'react'
import { useChat } from './hooks/useChat'
import Sidebar from './components/Sidebar'
import Message from './components/Message'
import ChatInput from './components/ChatInput'
import EmptyState from './components/EmptyState'
import LoginModal from './components/LoginModal'
import styles from './App.module.css'

export default function App() {
  const {
    chats,
    activeChatId,
    messages,
    isStreaming,
    setActiveChatId,
    newChat,
    deleteChat,
    sendMessage,
    stopStreaming,
  } = useChat()

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [user, setUser] = useState(null)
  const bottomRef = useRef(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = (text) => {
    // Pass user's API key if stored, or null (backend handles it)
    sendMessage(text, null)
  }

  const handleSuggest = (text) => {
    handleSend(text)
  }

  const handleLogin = (userData) => {
    setUser(userData)
    setShowLogin(false)
  }

  const handleSelectChat = (id) => {
    setActiveChatId(id)
  }

  const hasMessages = messages.length > 0

  return (
    <div className={styles.app}>
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        onNewChat={newChat}
        onSelectChat={handleSelectChat}
        onDeleteChat={deleteChat}
        user={user}
        onLogin={() => setShowLogin(true)}
        onLogout={() => setUser(null)}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(v => !v)}
      />

      <div className={styles.main}>
        {/* Top bar */}
        <div className={styles.topbar}>
          <span className={styles.chatLabel}>
            {chats.find(c => c.id === activeChatId)?.title || 'New chat'}
          </span>
          <div className={styles.topbarRight}>
            <span className={styles.modelBadge}>Claude 3.5 Sonnet</span>
          </div>
        </div>

        {/* Message area */}
        <div className={styles.messages}>
          {!hasMessages ? (
            <EmptyState onSuggest={handleSuggest} />
          ) : (
            <div className={styles.messageList}>
              {messages.map(msg => (
                <Message key={msg.id} message={msg} />
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <ChatInput
          onSend={handleSend}
          isStreaming={isStreaming}
          onStop={stopStreaming}
          disabled={false}
        />
      </div>

      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onLogin={handleLogin}
        />
      )}
    </div>
  )
}
