import { useState } from 'react'
import styles from './Sidebar.module.css'

function groupByDate(chats) {
  const now = Date.now()
  const day = 86400000
  const groups = { Today: [], Yesterday: [], 'Last 7 days': [], Older: [] }
  for (const chat of chats) {
    const age = now - chat.createdAt
    if (age < day) groups['Today'].push(chat)
    else if (age < 2 * day) groups['Yesterday'].push(chat)
    else if (age < 7 * day) groups['Last 7 days'].push(chat)
    else groups['Older'].push(chat)
  }
  return groups
}

export default function Sidebar({
  chats,
  activeChatId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  user,
  onLogin,
  onLogout,
  onGithubSetup,
  collapsed,
  onToggle,
}) {
  const [hoveredId, setHoveredId] = useState(null)
  const groups = groupByDate(chats)

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
      <div className={styles.top}>
        <button className={styles.toggleBtn} onClick={onToggle} title="Toggle sidebar">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="3" width="12" height="1.5" rx="0.75" fill="currentColor" />
            <rect x="2" y="7.25" width="12" height="1.5" rx="0.75" fill="currentColor" />
            <rect x="2" y="11.5" width="12" height="1.5" rx="0.75" fill="currentColor" />
          </svg>
        </button>
        {!collapsed && (
          <button className={styles.newChatBtn} onClick={onNewChat}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            New chat
          </button>
        )}
      </div>

      {!collapsed && (
        <div className={styles.historyScroll}>
          {chats.length === 0 && (
            <p className={styles.empty}>No chats yet. Start one!</p>
          )}
          {Object.entries(groups).map(([label, items]) =>
            items.length === 0 ? null : (
              <div key={label} className={styles.group}>
                <span className={styles.groupLabel}>{label}</span>
                {items.map(chat => (
                  <div
                    key={chat.id}
                    className={`${styles.chatItem} ${chat.id === activeChatId ? styles.active : ''}`}
                    onClick={() => onSelectChat(chat.id)}
                    onMouseEnter={() => setHoveredId(chat.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    <span className={styles.chatTitle}>{chat.title}</span>
                    {(hoveredId === chat.id || chat.id === activeChatId) && (
                      <button
                        className={styles.deleteBtn}
                        onClick={e => { e.stopPropagation(); onDeleteChat(chat.id) }}
                        title="Delete chat"
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M2 2l8 8M10 2L2 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      )}

      <div className={styles.bottom}>
        {user && !collapsed && (
          <button className={styles.githubBtn} onClick={onGithubSetup} title="Connect GitHub">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            Connect GitHub
          </button>
        )}
        {user ? (
          <div className={styles.userRow}>
            {!collapsed && (
              <>
                <div className={styles.avatar}>{user.name[0].toUpperCase()}</div>
                <div className={styles.userInfo}>
                  <span className={styles.userName}>{user.name}</span>
                  <span className={styles.userEmail}>{user.email}</span>
                </div>
                <button className={styles.logoutBtn} onClick={onLogout} title="Sign out">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M5 7h7M9 4.5L11.5 7 9 9.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M6 2H2.5A.5.5 0 002 2.5v9a.5.5 0 00.5.5H6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                </button>
              </>
            )}
            {collapsed && (
              <div className={styles.avatar} style={{ margin: '0 auto' }}>{user.name[0].toUpperCase()}</div>
            )}
          </div>
        ) : (
          <button className={styles.loginBtn} onClick={onLogin}>
            {!collapsed && (
              <>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.3" />
                  <path d="M2 12c0-2.2 2.24-4 5-4s5 1.8 5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
                Sign in
              </>
            )}
            {collapsed && (
              <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.3" />
                <path d="M2 12c0-2.2 2.24-4 5-4s5 1.8 5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            )}
          </button>
        )}
      </div>
    </aside>
  )
}
