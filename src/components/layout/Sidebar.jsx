import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Megaphone,
  Settings,
  X,
  TrendingUp,
  ShieldCheck,
  Sparkles,
  Globe,
  Bot,
  MessageSquare,
  ShoppingCart,
  Wand2,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../contexts/LanguageContext';
import { Badge } from '../ui/Badge';
import { cn, formatRole } from '../../lib/utils';

export function Sidebar({ mobileOpen = false, onCloseMobile }) {
  const { userProfile } = useAuth();
  const { t } = useLanguage();

  const navigation = [
    { name: t('sidebar.dashboard'), href: '/app', icon: LayoutDashboard, exact: true },
    { name: t('sidebar.revenue'), href: '/app/revenue', icon: TrendingUp },
    ...(userProfile && ['super_admin', 'admin'].includes(userProfile.role)
      ? [{ name: t('sidebar.admin'), href: '/app/admin', icon: ShieldCheck }]
      : []),
    { name: t('sidebar.whatsappInbox'), href: '/app/whatsapp', icon: MessageSquare },
    { name: t('sidebar.ecommerceCro') || 'E-Commerce & CRO', href: '/app/ecommerce', icon: ShoppingCart },
    { name: t('sidebar.creativeStudio') || 'Creative Studio (IA)', href: '/app/creative-studio', icon: Wand2 },
    { name: t('sidebar.leads'), href: '/app/leads', icon: Users },
    { name: t('sidebar.campaigns'), href: '/app/campaigns', icon: Megaphone },
    { name: t('sidebar.socialAnalyzer'), href: '/app/social-analyzer', icon: Sparkles },
    { name: t('sidebar.googleIntelligence'), href: '/app/google-intelligence', icon: Globe },
    { name: t('sidebar.copilot'), href: '/app/copilot', icon: Bot },
    { name: t('sidebar.settings'), href: '/app/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-brand-border flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header / Wordmark */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-brand-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-brand-primary flex items-center justify-center text-white font-extrabold text-sm tracking-wider">
              A
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight text-brand-text-primary block leading-none">
                ANIMA MKT CRM
              </span>
              <span className="text-[10px] uppercase font-bold text-brand-text-secondary tracking-widest block mt-0.5">
                Revenue Intelligence
              </span>
            </div>
          </div>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="p-1 rounded text-brand-text-secondary hover:text-brand-text-primary lg:hidden"
              aria-label={t('sidebar.closeMenu')}
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label={t('sidebar.mainNavigation')}>
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.exact}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  isActive
                    ? 'bg-brand-primary text-white font-semibold shadow-subtle'
                    : 'text-brand-text-primary hover:bg-[#F7F6F2] hover:text-brand-primary'
                )
              }
            >
              <item.icon className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* User Info / Role Footer */}
        <div className="p-4 border-t border-brand-border bg-[#F7F6F2]/50">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-xs font-semibold text-brand-text-primary truncate max-w-[130px]" title={userProfile?.displayName || userProfile?.email}>
              {userProfile?.displayName || userProfile?.email?.split('@')[0]}
            </span>
            <Badge variant="primary" className="text-[9px] px-1.5 py-0.5">
              {formatRole(userProfile?.role, t)}
            </Badge>
          </div>
          <span className="text-[11px] text-brand-text-secondary truncate block" title={userProfile?.email}>
            {userProfile?.email}
          </span>
        </div>
      </aside>
    </>
  );
}
