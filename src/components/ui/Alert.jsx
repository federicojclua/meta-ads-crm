import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export function Alert({ children, title, variant = 'info', className, icon: CustomIcon, onClose }) {
  const icons = {
    info: Info,
    success: CheckCircle2,
    warning: AlertTriangle,
    error: AlertCircle,
    danger: AlertCircle,
  };

  const variants = {
    info: 'bg-white border-brand-border text-brand-text-primary',
    success: 'bg-[#15803D]/5 border-[#15803D]/30 text-[#15803D]',
    warning: 'bg-[#F4C430]/10 border-[#F4C430]/40 text-[#854D0E]',
    error: 'bg-[#B91C1C]/5 border-[#B91C1C]/30 text-[#B91C1C]',
    danger: 'bg-[#B91C1C]/5 border-[#B91C1C]/30 text-[#B91C1C]',
  };

  const IconComponent = CustomIcon || icons[variant] || AlertCircle;
  const variantClass = variants[variant] || variants.info;

  return (
    <div
      role="alert"
      className={cn('flex items-start gap-3 p-3.5 border rounded-md text-sm', variantClass, className)}
    >
      <IconComponent className="h-5 w-5 shrink-0 mt-0.5" aria-hidden="true" />
      <div className="flex-1">
        {title && <h5 className="font-semibold mb-0.5 leading-tight">{title}</h5>}
        <div className="text-xs leading-relaxed opacity-95">{children}</div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 p-1 -mr-1 -mt-1 rounded hover:bg-black/5 opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Cerrar alerta"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
