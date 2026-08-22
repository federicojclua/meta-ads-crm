import { cn } from '../../lib/utils';

export function Badge({ children, variant = 'default', className, ...props }) {
  const variants = {
    default: 'bg-[#E5E0D8] text-brand-text-primary border-transparent',
    neutral: 'bg-white text-brand-text-primary border border-brand-border',
    success: 'bg-[#15803D]/10 text-[#15803D] border-[#15803D]/30',
    warning: 'bg-[#F4C430]/20 text-[#854D0E] border-[#F4C430]/40',
    danger: 'bg-[#B91C1C]/10 text-[#B91C1C] border-[#B91C1C]/30',
    primary: 'bg-[#B91C1C] text-white border-transparent',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider border',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
