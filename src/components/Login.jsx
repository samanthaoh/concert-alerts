import { useState } from 'react'
import { signInWithEmail, signUpWithEmail, signInWithGoogle } from '../lib/authHelpers'

export default function Login() {
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      if (mode === 'signup') {
        await signUpWithEmail(email, password)
      } else {
        await signInWithEmail(email, password)
      }
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleGoogle() {
    setError('')
    try {
      await signInWithGoogle()
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''))
    }
  }

  return (
    <div className="login-panel">
      <h2 className="login-title">{mode === 'signup' ? 'Create an account' : 'Sign in'}</h2>

      <form onSubmit={handleSubmit} className="login-form">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />
        {error && <p className="login-error">{error}</p>}
        <button type="submit" disabled={submitting}>
          {mode === 'signup' ? 'Sign up' : 'Sign in'}
        </button>
      </form>

      <button className="google-btn" onClick={handleGoogle}>
        Continue with Google
      </button>

      <button
        className="mode-toggle"
        onClick={() => setMode(mode === 'signup' ? 'signin' : 'signup')}
      >
        {mode === 'signup' ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
      </button>
    </div>
  )
}
