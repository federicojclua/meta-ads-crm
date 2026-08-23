import { Menu, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';
import { CURRENT_STAGE } from '../../lib/constants';

export function Header({ onOpenMobileMenu }) {
  const { logout } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-brand-border px-4 lg:px-8 flex items-center justify-between sticky top-0 z-30 shadow-subtle">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="p-2 rounded-md border border-brand-border text-brand-text-primary hover:bg-brand-bg lg:hidden"
          aria-label="Abrir menú de navegación"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-brand-text-secondary uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-status-success" aria-hidden="true"></span>
          <span>Sistema Operativo &middot; {CURRENT_STAGE.LABEL}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#F7F6F2] border border-brand-border text-xs text-brand-text-primary">
          <ShieldCheck className="w-3.5 h-3.5 text-brand-primary" />
          <span className="font-medium">Sesión Segura</span>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={logout}
          className="text-xs gap-1.5"
          title="Cerrar sesión en Anima MKT CRM"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Cerrar Sesión</span>
        </Button>
      </div>
    </header>
  );
}
