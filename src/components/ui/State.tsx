import { Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';

export function Spinner({ className = '', size = 20 }: { className?: string; size?: number }) {
  return <Loader2 className={`animate-spin ${className}`} size={size} />;
}

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-500 dark:text-white/50 gap-3">
      <Spinner className="text-indigo-500" size={28} />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
      <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 text-xl">!</div>
      <p className="text-sm text-rose-600 dark:text-rose-300 max-w-md">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="text-sm font-medium text-indigo-500 hover:underline">
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ icon, title, hint, action }: { icon?: ReactNode; title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
      {icon && <div className="w-14 h-14 rounded-2xl glass flex items-center justify-center text-indigo-500">{icon}</div>}
      <p className="font-medium text-slate-700 dark:text-white/80">{title}</p>
      {hint && <p className="text-sm text-slate-500 dark:text-white/50 max-w-sm">{hint}</p>}
      {action}
    </div>
  );
}
