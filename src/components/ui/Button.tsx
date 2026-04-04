'use client'

import { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  children: ReactNode
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-white hover:opacity-90',
  secondary:
    'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50',
  danger:
    'bg-red-600 text-white hover:bg-red-700',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg font-medium transition-colors
        focus:outline-none focus:ring-2 focus:ring-accent/50
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
