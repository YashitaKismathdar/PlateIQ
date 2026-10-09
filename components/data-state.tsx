import type { ReactNode } from 'react'

interface DataStateProps {
  status: 'loading' | 'error' | 'empty'
  title?: string
  description?: string
  action?: ReactNode
}

export function DataState({
  status,
  title,
  description,
  action,
}: DataStateProps) {
  const defaults = {
    loading: {
      title: 'Loading data',
      description: 'PlateIQ is retrieving the latest operational data.',
    },
    error: {
      title: 'Unable to load data',
      description: 'Something went wrong while retrieving this view. Please try again.',
    },
    empty: {
      title: 'No data available',
      description: 'There is no operational data to display yet.',
    },
  } as const

  const copy = defaults[status]

  return (
    <div role={status === 'error' ? 'alert' : 'status'} className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-6 text-center">
      <p className="font-medium">{title ?? copy.title}</p>
      <p className="max-w-md text-sm text-muted-foreground">{description ?? copy.description}</p>
      {action}
    </div>
  )
}
