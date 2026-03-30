import { useState, useRef, useEffect } from 'react'
import { useChat } from './hooks/useChat'
import Sidebar from './components/Sidebar'
import Message from './components/Message'
import ChatInput from './components/ChatInput'
import EmptyState from './components/EmptyState'
import LoginModal from './components/LoginModal'
import styles from './App.module.css'

const AUTH_KEY = 'devflow_auth'

function loadAuth() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null')
  } catch {
    return null
  }
}

export default function App() {
  const [auth, setAuth] = useState(loadAuth)   // { token, user } or null
  const [showLogin, setShowLogin] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const bottomRef = useRef(null)

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
    resetForUser,
  } = useChat({ userId: auth?.user?.id, token: auth?.token })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleLogin = ({ token, user }) => {
    const authData = { token, user }
    localStorage.setItem(AUTH_KEY, JSON.stringify(authData))
    setAuth(authData)
    resetForUser(user.id)
    setShowLogin(false)
  }

  const handleLogout = () => {
    localStorage.removeItem(AUTH_KEY)
    setAuth(null)
    resetForUser(null)
  }

  const handleSend = (text) => {
    if (!auth) {
      setShowLogin(true)
      return
    }
    sendMessage(text)
  }

  const hasMessages = messages.length > 0

  return (
    <div className={styles.app}>
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        onNewChat={newChat}
        onSelectChat={setActiveChatId}
        onDeleteChat={deleteChat}
        user={auth?.user || null}
        onLogin={() => setShowLogin(true)}
        onLogout={handleLogout}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(v => !v)}
      />

      <div className={styles.main}>
        <div className={styles.topbar}>
          <span className={styles.chatLabel}>
            {chats.find(c => c.id === activeChatId)?.title || 'New chat'}
          </span>
          <div className={styles.topbarRight}>
            <span className={styles.modelBadge}>Claude 3.5 Sonnet</span>
          </div>
        </div>

        <div className={styles.messages}>
          {!hasMessages ? (
            <EmptyState onSuggest={handleSend} />
          ) : (
            <div className={styles.messageList}>
              {messages.map(msg => (
                <Message key={msg.id} message={msg} />
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        <ChatInput
          onSend={handleSend}
          isStreaming={isStreaming}
          onStop={stopStreaming}
          disabled={false}
          placeholder={auth ? 'Message…' : 'Sign in to start chatting…'}
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
