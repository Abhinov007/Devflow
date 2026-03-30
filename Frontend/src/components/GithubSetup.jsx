import { useState, useEffect } from 'react'
import styles from './GithubSetup.module.css'
import { apiUrl } from '../api'

export default function GithubSetup({ token, onClose }) {
  const [info, setInfo] = useState(null)
  const [copied, setCopied] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(apiUrl('/api/github/setup'), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(setInfo)
      .catch(() => setError('Could not load setup info.'))
  }, [token])

  const copy = (text, key) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
          </svg>
          <h2 className={styles.title}>Connect GitHub</h2>
          <p className={styles.sub}>Auto-log PR changes to your Notion Changelog</p>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        {info && (
          <div className={styles.body}>
            <div className={styles.step}>
              <span className={styles.stepNum}>1</span>
              <div>
                <p className={styles.stepLabel}>Webhook URL</p>
                <div className={styles.copyRow}>
                  <code className={styles.code}>{info.webhookUrl}</code>
                  <button className={styles.copyBtn} onClick={() => copy(info.webhookUrl, 'url')}>
                    {copied === 'url' ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>

            <div className={styles.step}>
              <span className={styles.stepNum}>2</span>
              <div>
                <p className={styles.stepLabel}>Webhook Secret</p>
                <div className={styles.copyRow}>
                  <code className={styles.code}>{info.secret}</code>
                  <button className={styles.copyBtn} onClick={() => copy(info.secret, 'secret')}>
                    {copied === 'secret' ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>

            <div className={styles.step}>
              <span className={styles.stepNum}>3</span>
              <div>
                <p className={styles.stepLabel}>GitHub Setup</p>
                <ol className={styles.instructions}>
                  {info.instructions.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ol>
              </div>
            </div>

            <div className={styles.note}>
              PRs will appear in your <strong>Changelog</strong> database in Notion automatically.
            </div>
          </div>
        )}

        <button className={styles.closeBtn} onClick={onClose}>Done</button>
      </div>
    </div>
  )
}
