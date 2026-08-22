import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export const Input = forwardRef(function Input(
  {
    label,
    error,
    helperText,
    className,
    id,
    type = 'text',
    required = false,
    ...props
  },
  ref
) {
  const inputId = id || props.name || Math.random().toString(36).substring(2, 9);

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold text-brand-text-primary uppercase tracking-wider mb-1.5"
        >
          {label} {required && <span className="text-brand-primary">*</span>}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        type={type}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
        className={cn(
          'w-full px-3 py-2 text-sm bg-white border border-brand-border rounded-md text-brand-text-primary placeholder:text-brand-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-all disabled:bg-gray-100 disabled:cursor-not-allowed',
          error && 'border-red-600 focus:ring-red-600 focus:border-red-600',
          className
        )}
        {...props}
      />
      {error ? (
        <p id={`${inputId}-error`} className="mt-1.5 text-xs text-red-600 font-medium">
          {error}
        </p>
      ) : helperText ? (
        <p id={`${inputId}-helper`} className="mt-1.5 text-xs text-brand-text-secondary">
          {helperText}
        </p>
      ) : null}
    </div>
  );
});
