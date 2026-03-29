import styles from './EmptyState.module.css'

const SUGGESTIONS = [
  'Explain how React hooks work',
  'Write a Python script to parse JSON',
  'What\'s the difference between REST and GraphQL?',
  'Help me debug this TypeScript error',
]

export default function EmptyState({ onSuggest }) {
  return (
    <div className={styles.container}>
      <div className={styles.icon}>
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <circle cx="14" cy="14" r="12" stroke="currentColor" strokeWidth="1.5" />
          <path d="M9.5 18.5c0-2.485 2.015-4.5 4.5-4.5s4.5 2.015 4.5 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <circle cx="14" cy="10.5" r="1.5" fill="currentColor" />
        </svg>
      </div>
      <h1 className={styles.title}>How can I help you?</h1>
      <p className={styles.sub}>Ask me anything, or pick a suggestion below.</p>
      <div className={styles.suggestions}>
        {SUGGESTIONS.map(s => (
          <button key={s} className={styles.suggestionBtn} onClick={() => onSuggest(s)}>
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}
