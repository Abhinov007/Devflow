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
