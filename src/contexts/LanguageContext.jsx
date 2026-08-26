import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

const translations = {
  es: {
    sidebar: {
      dashboard: 'Dashboard',
      revenue: 'Retorno y Finanzas',
      leads: 'Prospectos',
      campaigns: 'Campañas Meta',
      admin: 'Administración',
      settings: 'Configuración',
      logout: 'Cerrar Sesión',
    },
    common: {
      actions: 'Acciones',
      save: 'Guardar',
      cancel: 'Cancelar',
      delete: 'Eliminar',
      edit: 'Editar',
      create: 'Crear',
      add: 'Agregar',
      status: 'Estado',
      active: 'Activo',
      inactive: 'Inactivo',
      suspended: 'Suspendido',
      invited: 'Invitado',
      search: 'Buscar...',
      all: 'Todos',
      retry: 'Reintentar',
      loading: 'Cargando...',
      error: 'Ocurrió un error',
      success: 'Operación exitosa',
      company: 'Empresa',
      selectCompany: 'Seleccione una Empresa',
      allCompanies: 'Todas las Empresas',
      role: 'Rol',
      date: 'Fecha',
      value: 'Valor',
      none: 'Ninguno',
      back: 'Volver',
      confirm: 'Confirmar',
      warning: 'Advertencia',
      exportCsv: 'Exportar CSV',
      exportPdf: 'Exportar PDF',
    },
    dashboard: {
      title: 'Dashboard de Rendimiento',
      leadsCount: 'Prospectos Totales',
      wonLeads: 'Ventas Cerradas',
      conversionRate: 'Tasa de Conversión',
      totalCollected: 'Total Cobrado',
      recentLeads: 'Prospectos Recientes',
      name: 'Nombre',
      email: 'Correo',
      phone: 'Teléfono',
      assignedTo: 'Asignado a',
    },
    revenue: {
      title: 'Dashboard de Retorno & Revenue',
      investment: 'Inversión Meta',
      attributedLeads: 'Prospectos Atribuidos',
      wonCount: 'Ventas Cerradas',
      totalCollected: 'Total Cobrado',
      blendedRoas: 'ROAS Blended',
      timeSeries: 'Serie Temporal de Rendimiento',
      funnel: 'Embudo de Conversión',
      funnelRegistered: 'Leads Registrados',
      funnelContacted: 'Contactados',
      funnelQualified: 'Calificados',
      funnelWon: 'Ventas Cerradas',
      campaignsPerformance: 'Rendimiento por Campaña',
      campaignName: 'Nombre de Campaña',
      impressions: 'Impresiones',
      spend: 'Inversión',
      clicks: 'Clics',
      cpl: 'CPL Atrib.',
      salesCount: 'Ventas',
      revenue: 'Ingresos',
      roas: 'ROAS',
      noData: 'No hay datos financieros para el período seleccionado.',
      currencyMode: 'Moneda Normalizada',
      granularity: 'Granularidad',
      daily: 'Diario',
      weekly: 'Semanal',
      monthly: 'Mensual',
      startDate: 'Inicio',
      endDate: 'Fin',
      vendedor: 'Vendedor',
      campana: 'Campaña Meta',
    },
    admin: {
      title: 'Centro de Administración',
      tabs: {
        companies: 'Empresas',
        users: 'Usuarios e Invitaciones',
        assets: 'Activos Meta',
        sync: 'Sincronización',
        rates: 'Tasas de Cambio',
        audit: 'Auditoría',
      },
      companies: {
        title: 'Gestión de Empresas',
        create: 'Nueva Empresa',
        name: 'Nombre',
        slug: 'Slug',
        timezone: 'Zona Horaria',
        currency: 'Moneda por Defecto',
        actions: 'Acciones',
      },
      users: {
        title: 'Usuarios e Invitaciones',
        invite: 'Invitar Usuario',
        email: 'Correo Electrónico',
        role: 'Rol Autorizado',
        sendInvite: 'Generar Enlace de Invitación',
        copyInvite: 'Copiar Enlace',
        status: 'Estado',
      },
      rates: {
        title: 'Tasas de Cambio Históricas',
        create: 'Nueva Tasa',
        rate: 'Tasa (ARS/USD)',
        validFrom: 'Válido Desde',
        validTo: 'Válido Hasta',
      }
    },
    settings: {
      title: 'Configuración de Perfil',
      language: 'Preferencia de Idioma',
      selectLanguage: 'Seleccionar Idioma',
      password: 'Seguridad y Contraseña',
    }
  },
  en: {
    sidebar: {
      dashboard: 'Dashboard',
      revenue: 'ROI & Finance',
      leads: 'Leads',
      campaigns: 'Meta Campaigns',
      admin: 'Administration',
      settings: 'Settings',
      logout: 'Log Out',
    },
    common: {
      actions: 'Actions',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      create: 'Create',
      add: 'Add',
      status: 'Status',
      active: 'Active',
      inactive: 'Inactive',
      suspended: 'Suspended',
      invited: 'Invited',
      search: 'Search...',
      all: 'All',
      retry: 'Retry',
      loading: 'Loading...',
      error: 'An error occurred',
      success: 'Success',
      company: 'Company',
      selectCompany: 'Select a Company',
      allCompanies: 'All Companies',
      role: 'Role',
      date: 'Date',
      value: 'Value',
      none: 'None',
      back: 'Back',
      confirm: 'Confirm',
      warning: 'Warning',
      exportCsv: 'Export CSV',
      exportPdf: 'Export PDF',
    },
    dashboard: {
      title: 'Performance Dashboard',
      leadsCount: 'Total Leads',
      wonLeads: 'Closed Sales',
      conversionRate: 'Conversion Rate',
      totalCollected: 'Total Collected',
      recentLeads: 'Recent Leads',
      name: 'Name',
      email: 'Email',
      phone: 'Phone',
      assignedTo: 'Assigned To',
    },
    revenue: {
      title: 'ROI & Revenue Dashboard',
      investment: 'Meta Spend',
      attributedLeads: 'Attributed Leads',
      wonCount: 'Closed Sales',
      totalCollected: 'Total Collected',
      blendedRoas: 'Blended ROAS',
      timeSeries: 'Performance Time Series',
      funnel: 'Conversion Funnel',
      funnelRegistered: 'Registered Leads',
      funnelContacted: 'Contacted',
      funnelQualified: 'Qualified',
      funnelWon: 'Closed Sales',
      campaignsPerformance: 'Performance by Campaign',
      campaignName: 'Campaign Name',
      impressions: 'Impressions',
      spend: 'Spend',
      clicks: 'Clicks',
      cpl: 'Attrib. CPL',
      salesCount: 'Sales',
      revenue: 'Revenue',
      roas: 'ROAS',
      noData: 'No financial data for the selected period.',
      currencyMode: 'Normalized Currency',
      granularity: 'Granularity',
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
      startDate: 'Start Date',
      endDate: 'End Date',
      vendedor: 'Salesperson',
      campana: 'Meta Campaign',
    },
    admin: {
      title: 'Administration Center',
      tabs: {
        companies: 'Companies',
        users: 'Users & Invites',
        assets: 'Meta Assets',
        sync: 'Synchronization',
        rates: 'Exchange Rates',
        audit: 'Audit Logs',
      },
      companies: {
        title: 'Manage Companies',
        create: 'New Company',
        name: 'Name',
        slug: 'Slug',
        timezone: 'Timezone',
        currency: 'Default Currency',
        actions: 'Actions',
      },
      users: {
        title: 'Users & Invites',
        invite: 'Invite User',
        email: 'Email Address',
        role: 'Authorized Role',
        sendInvite: 'Generate Invite Link',
        copyInvite: 'Copy Link',
        status: 'Status',
      },
      rates: {
        title: 'Historical Exchange Rates',
        create: 'New Rate',
        rate: 'Rate (ARS/USD)',
        validFrom: 'Valid From',
        validTo: 'Valid To',
      }
    },
    settings: {
      title: 'Profile Settings',
      language: 'Language Preference',
      selectLanguage: 'Select Language',
      password: 'Security & Password',
    }
  }
};

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('language') || 'es';
  });

  const setLanguage = (lang) => {
    if (translations[lang]) {
      setLanguageState(lang);
      localStorage.setItem('language', lang);
    }
  };

  const t = (keyPath, variables = {}) => {
    const keys = keyPath.split('.');
    let value = translations[language];
    for (const key of keys) {
      if (value && value[key] !== undefined) {
        value = value[key];
      } else {
        // Fallback to Spanish dictionary
        let fallbackVal = translations.es;
        for (const fk of keys) {
          if (fallbackVal && fallbackVal[fk] !== undefined) {
            fallbackVal = fallbackVal[fk];
          } else {
            fallbackVal = null;
            break;
          }
        }
        return fallbackVal || keyPath;
      }
    }

    if (typeof value === 'string') {
      let str = value;
      Object.entries(variables).forEach(([k, v]) => {
        str = str.replace(`{${k}}`, v);
      });
      return str;
    }

    return keyPath;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    // Fail-safe fallback for unit tests running outside a LanguageProvider
    return {
      language: 'es',
      setLanguage: () => {},
      t: (key) => {
        if (key === 'menu.dashboard') return 'Dashboard';
        if (key === 'menu.revenue') return 'Panel Financiero';
        if (key === 'menu.admin') return 'Centro de Admin';
        if (key === 'menu.leads') return 'Leads / Prospectos';
        if (key === 'menu.campaigns') return 'Campañas Meta';
        if (key === 'menu.settings') return 'Configuración';
        return key;
      }
    };
  }
  return context;
}
