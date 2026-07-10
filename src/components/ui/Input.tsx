'use client'

import { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export default function Input({ label, error, className = '', id, ...props }: InputProps) {
  const inputId = id || props.name || undefined

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        id={inputId}
        aria-invalid={Boolean(error)}
        aria-describedby={error && inputId ? `${inputId}-error` : undefined}
        className={`min-h-11 w-full rounded-xl border bg-white px-3 py-2 text-sm text-slate-900
          focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500
          ${error ? 'border-red-500' : 'border-gray-300'}
          ${className}`}
        {...props}
      />
      {error && <p id={inputId ? `${inputId}-error` : undefined} className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
