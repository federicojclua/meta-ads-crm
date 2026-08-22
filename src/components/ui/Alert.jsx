import { AlertCircle, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { cn } from '../../lib/utils';

export function Alert({ children, title, variant = 'info', className, icon: CustomIcon }) {
  const icons = {
    info: Info,
    success: CheckCircle2,
    warning: AlertTriangle,
    error: AlertCircle,
  };

  const variants = {
    info: 'bg-white border-brand-border text-brand-text-primary',
    success: 'bg-[#15803D]/5 border-[#15803D]/30 text-[#15803D]',
    warning: 'bg-[#F4C430]/10 border-[#F4C430]/40 text-[#854D0E]',
    error: 'bg-[#B91C1C]/5 border-[#B91C1C]/30 text-[#B91C1C]',
  };

  const IconComponent = CustomIcon || icons[variant];

  return (
    <div
      role="alert"
      className={cn('flex items-start gap-3 p-3.5 border rounded-md text-sm', variants[variant], className)}
    >
      <IconComponent className="h-5 w-5 shrink-0 mt-0.5" aria-hidden="true" />
      <div className="flex-1">
        {title && <h5 className="font-semibold mb-0.5 leading-tight">{title}</h5>}
        <div className="text-xs leading-relaxed opacity-95">{children}</div>
      </div>
    </div>
  );
}
