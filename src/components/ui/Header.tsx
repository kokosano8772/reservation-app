'use client'
// src/components/ui/Header.tsx
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

type Props = {
  title?: string
  backHref?: string
  showLogo?: boolean
}

export function Header({ title, backHref, showLogo }: Props) {
  return (
    <header
      style={{
        background: 'white',
        borderBottom: '1px solid var(--salon-border)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          maxWidth: 480,
          margin: '0 auto',
          padding: '0 1rem',
          height: 56,
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}
      >
        {backHref && (
          <Link
            href={backHref}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'var(--salon-bg)',
              flexShrink: 0,
            }}
          >
            <ArrowLeft size={18} style={{ color: 'var(--salon-primary)' }} />
          </Link>
        )}
        {showLogo && (
          <span
            style={{
              fontSize: '1.125rem',
              fontWeight: 800,
              letterSpacing: '0.08em',
              color: 'var(--salon-primary)',
            }}
          >
            KOKO DESIGN
          </span>
        )}
        {title && (
          <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--salon-primary)' }}>
            {title}
          </span>
        )}
      </div>
    </header>
  )
}

export function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="step-indicator">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`step-dot ${i === current ? 'active' : i < current ? 'done' : ''}`}
        />
      ))}
    </div>
  )
}

export function LoadingSpinner({ label }: { label?: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.75rem',
        padding: '3rem 1rem',
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          border: '2.5px solid var(--salon-border)',
          borderTopColor: 'var(--salon-accent)',
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
        }}
      />
      {label && <p style={{ fontSize: '0.875rem', color: 'var(--salon-muted)' }}>{label}</p>}
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

export function ErrorMessage({ message }: { message: string }) {
  return (
    <div
      style={{
        background: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: '0.75rem',
        padding: '0.875rem 1rem',
        fontSize: '0.875rem',
        color: '#b91c1c',
      }}
    >
      {message}
    </div>
  )
}
