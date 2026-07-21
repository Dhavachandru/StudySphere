import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';

const base =
  'w-full rounded-xl px-4 py-2.5 text-sm bg-white/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 placeholder-slate-400 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:border-transparent transition';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className = '', ...rest }, ref) => <input ref={ref} className={`${base} ${className}`} {...rest} />
);
Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className = '', ...rest }, ref) => <textarea ref={ref} className={`${base} ${className}`} {...rest} />
);
Textarea.displayName = 'Textarea';
