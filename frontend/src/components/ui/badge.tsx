import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-mono font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-ring focus:ring-offset-1',
  {
    variants: {
      variant: {
        default:
          'border-emerald-800/60 bg-emerald-950/60 text-emerald-300 hover:bg-emerald-950/80',
        secondary:
          'border-slate-800 bg-slate-800/60 text-slate-300 hover:bg-slate-800',
        outline:
          'border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800/40',
        destructive:
          'border-rose-800/60 bg-rose-950/60 text-rose-300 hover:bg-rose-950/80',
        success:
          'border-emerald-800/60 bg-emerald-950/60 text-emerald-300',
        warning:
          'border-amber-800/60 bg-amber-950/60 text-amber-300',
        info:
          'border-sky-800/60 bg-sky-950/60 text-sky-300',
        method:
          'border-blue-800/60 bg-blue-950/60 text-blue-300 uppercase font-semibold'
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
