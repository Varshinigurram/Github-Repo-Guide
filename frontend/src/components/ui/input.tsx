import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  isInvalid?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, isInvalid, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-9 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-1 text-xs text-slate-100 placeholder:text-slate-500 font-mono transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500/80 focus-visible:border-emerald-500/80 disabled:cursor-not-allowed disabled:opacity-50',
          isInvalid && 'border-rose-600 focus-visible:ring-rose-500 focus-visible:border-rose-500',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
