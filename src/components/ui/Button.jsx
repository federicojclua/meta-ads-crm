import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export const Button = forwardRef(function Button(
  {
    children,
    className,
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    type = 'button',
    ...props
  },
  ref
) {
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed select-none rounded-md';

  const variants = {
    primary:
      'bg-brand-primary text-white hover:bg-brand-dark focus-visible:ring-brand-primary active:bg-brand-dark',
    secondary:
      'bg-white text-brand-text-primary border border-brand-border hover:bg-[#F7F6F2] focus-visible:ring-brand-primary',
    outline:
      'border border-brand-primary text-brand-primary hover:bg-brand-primary/5 focus-visible:ring-brand-primary',
    ghost:
      'text-brand-text-primary hover:bg-black/5 focus-visible:ring-brand-primary',
    danger:
      'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600',
  };

  const sizes = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-sm px-3.5 py-2 gap-2',
    lg: 'text-base px-4 py-2.5 gap-2.5',
  };

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      )}
      {children}
    </button>
  );
});
