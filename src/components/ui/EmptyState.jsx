import { FolderOpen } from 'lucide-react';
import { cn } from '../../lib/utils';

export function EmptyState({
  icon: Icon = FolderOpen,
  title,
  description,
  action,
  className,
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 md:p-12 text-center bg-white border border-brand-border rounded-lg shadow-subtle',
        className
      )}
    >
      <div className="w-12 h-12 mb-4 rounded-full bg-[#F7F6F2] border border-brand-border flex items-center justify-center text-brand-primary">
        <Icon className="w-6 h-6" aria-hidden="true" />
      </div>
      <h3 className="text-base font-bold text-brand-text-primary mb-1 tracking-tight">
        {title}
      </h3>
      {description && (
        <p className="text-xs md:text-sm text-brand-text-secondary max-w-sm mb-5 leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
