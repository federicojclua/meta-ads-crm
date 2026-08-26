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
      title: 'Panel de Control & Rendimiento Comercial',
      welcome: 'Bienvenido,',
      leadsCount: 'Prospectos Totales',
      wonLeads: 'Ventas Cerradas',
      conversionRate: 'Tasa de Conversión',
      totalCollected: 'Total Cobrado',
      recentLeads: 'Prospectos Recientes',
      name: 'Nombre',
      email: 'Correo',
      phone: 'Teléfono',
      assignedTo: 'Asignado a',
      leadsInPipeline: 'Leads en Pipeline',
      won: 'Ganados:',
      convRate: 'Tasa Conv.:',
      noData: 'Sin datos',
      collectedRevenue: 'Ingresos Cobrados',
      loadingCurrencies: 'Cargando monedas...',
      errorLoadingCollections: 'Error al cargar cobros',
      noCollections: 'Sin cobros registrados',
      metaInvestment: 'Inversión Meta Ads',
      noMetaData: 'Sin datos de Meta',
      roasOnCollections: 'ROAS sobre Cobros',
      roasCalculated: 'Calculado sobre ingresos cobrados',
      roasRequires: 'Requiere inversión e ingresos',
      pipelineDistribution: 'Distribución del Pipeline',
      loadingDistribution: 'Cargando distribución...',
      errorDistribution: 'No se pudo cargar el desglose.',
      stageNew: '1. Nuevos',
      stageContacted: '2. Contactados',
      stageQualified: '3. Calificados',
      stageWon: '4. Ganados / Cerrados',
      stageLost: '5. Perdidos',
      salespersonPerformance: 'Rendimiento por Vendedor',
      loadingSalespeople: 'Cargando vendedores...',
      errorSalespeople: 'No se pudo cargar el rendimiento por vendedor.',
      noSalespeopleData: 'Sin datos de vendedores para mostrar en este filtro.',
      thSalesperson: 'Vendedor',
      thAssignedLeads: 'Leads Asignados',
      thWon: 'Ganados',
      thSales: 'Ventas',
      thConvRate: 'Tasa Conv.',
      thCollected: 'Cobrado',
      pendingActivation: 'Pendiente activación',
      openPipeline: 'Abrir Pipeline',
      openCampaigns: 'Abrir Campañas',
      pipelineAndAssignments: 'Pipeline & Asignaciones',
      pipelineDesc: 'Tablero Kanban con 5 etapas comerciales, reasignación controlada e importación masiva CSV.',
      salesAndCollections: 'Ventas & Cobros en Centavos',
      salesDesc: 'Control de montos cobrados parciales y totales por divisa con validación de límites.',
      nextStep: 'Próximo Paso: Etapa 4',
      errorUnauthorized: 'Sesión no válida o expirada. Por favor, vuelva a iniciar sesión.',
      errorForbidden: 'No tenés permisos para visualizar las estadísticas de esta empresa.',
      errorNotFound: 'La empresa seleccionada no existe o está inactiva.',
      errorServer: 'El servicio de analíticas no está disponible temporalmente.',
      errorNetwork: 'Error de red al consultar el panel. Verifique su conexión.',
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
      subtitle: 'Gestión de perfil, identidad y seguridad de acceso a Anima MKT CRM.',
      language: 'Preferencia de Idioma',
      selectLanguage: 'Seleccionar Idioma',
      password: 'Seguridad y Contraseña',
      identityRoleTitle: 'Perfil de Identidad & Rol',
      emailLabel: 'Correo Electrónico:',
      roleLabel: 'Rol en MongoDB:',
      accessSecurityTitle: 'Seguridad de Acceso & Proveedores Vinculados',
      accessSecurityDesc: 'Administrá los métodos de autenticación habilitados para ingresar a tu cuenta.',
      googleProvider: 'Google Workspace / Gmail',
      googleConnected: 'Conectado',
      googleNotConnected: 'No conectado',
      googleLinkedTo: 'Vinculado al correo {email}.',
      googleNotAvailable: 'No disponible como método de inicio directo.',
      passwordProvider: 'Contraseña Directa',
      passwordConfigured: 'Configurada',
      passwordNotConfigured: 'No configurada',
      passwordActiveDesc: 'Permite iniciar sesión ingresando correo y contraseña en el CRM.',
      passwordInactiveDesc: 'Tu cuenta fue creada con Google. Podés configurar una contraseña para habilitar acceso directo.',
      forgotOrChange: '¿Olvidaste o querés cambiarla?',
      resetViaEmail: 'Restablecer vía Email',
      resetEmailSent: 'Correo enviado',
      enablePasswordTitle: '¿Deseas habilitar acceso con correo y contraseña?',
      enablePasswordDesc: 'Te permitirá ingresar directamente sin depender del popup de Google. Tu cuenta y permisos permanecerán idénticos.',
      createPassword: 'Crear Contraseña',
      configurePasswordTitle: 'Configurar Contraseña de Acceso',
      cancelAction: 'Cancelar',
      newPassword: 'Nueva Contraseña',
      newPasswordPlaceholder: 'Mínimo 6 caracteres',
      confirmPassword: 'Confirmar Contraseña',
      confirmPasswordPlaceholder: 'Repetí la contraseña',
      minChars: 'Al menos 6 caracteres',
      passwordsMatch: 'Las contraseñas coinciden',
      passwordsDontMatch: 'Las contraseñas no coinciden',
      linking: 'Vinculando...',
      setPassword: 'Establecer Contraseña',
      passwordsMismatchError: 'Las contraseñas ingresadas no coinciden.',
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
      title: 'Performance & Commercial Dashboard',
      welcome: 'Welcome,',
      leadsCount: 'Total Leads',
      wonLeads: 'Closed Sales',
      conversionRate: 'Conversion Rate',
      totalCollected: 'Total Collected',
      recentLeads: 'Recent Leads',
      name: 'Name',
      email: 'Email',
      phone: 'Phone',
      assignedTo: 'Assigned To',
      leadsInPipeline: 'Leads in Pipeline',
      won: 'Won:',
      convRate: 'Conv. Rate:',
      noData: 'No data',
      collectedRevenue: 'Collected Revenue',
      loadingCurrencies: 'Loading currencies...',
      errorLoadingCollections: 'Error loading collections',
      noCollections: 'No collections registered',
      metaInvestment: 'Meta Ads Investment',
      noMetaData: 'No Meta data',
      roasOnCollections: 'ROAS on Collections',
      roasCalculated: 'Calculated on collected revenue',
      roasRequires: 'Requires investment and revenue',
      pipelineDistribution: 'Pipeline Distribution',
      loadingDistribution: 'Loading distribution...',
      errorDistribution: 'Could not load the breakdown.',
      stageNew: '1. New',
      stageContacted: '2. Contacted',
      stageQualified: '3. Qualified',
      stageWon: '4. Won / Closed',
      stageLost: '5. Lost',
      salespersonPerformance: 'Salesperson Performance',
      loadingSalespeople: 'Loading salespeople...',
      errorSalespeople: 'Could not load salesperson performance.',
      noSalespeopleData: 'No salesperson data to show for this filter.',
      thSalesperson: 'Salesperson',
      thAssignedLeads: 'Assigned Leads',
      thWon: 'Won',
      thSales: 'Sales',
      thConvRate: 'Conv. Rate',
      thCollected: 'Collected',
      pendingActivation: 'Pending activation',
      openPipeline: 'Open Pipeline',
      openCampaigns: 'Open Campaigns',
      pipelineAndAssignments: 'Pipeline & Assignments',
      pipelineDesc: 'Kanban board with 5 commercial stages, controlled reassignment and bulk CSV import.',
      salesAndCollections: 'Sales & Collections in Cents',
      salesDesc: 'Control of partial and total collected amounts by currency with limit validation.',
      nextStep: 'Next Step: Stage 4',
      errorUnauthorized: 'Invalid or expired session. Please log in again.',
      errorForbidden: 'You do not have permission to view this company\'s statistics.',
      errorNotFound: 'The selected company does not exist or is inactive.',
      errorServer: 'The analytics service is temporarily unavailable.',
      errorNetwork: 'Network error querying the dashboard. Check your connection.',
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
      subtitle: 'Profile management, identity and access security for Anima MKT CRM.',
      language: 'Language Preference',
      selectLanguage: 'Select Language',
      password: 'Security & Password',
      identityRoleTitle: 'Identity Profile & Role',
      emailLabel: 'Email Address:',
      roleLabel: 'MongoDB Role:',
      accessSecurityTitle: 'Access Security & Linked Providers',
      accessSecurityDesc: 'Manage the authentication methods enabled to log into your account.',
      googleProvider: 'Google Workspace / Gmail',
      googleConnected: 'Connected',
      googleNotConnected: 'Not connected',
      googleLinkedTo: 'Linked to {email}.',
      googleNotAvailable: 'Not available as a direct sign-in method.',
      passwordProvider: 'Direct Password',
      passwordConfigured: 'Configured',
      passwordNotConfigured: 'Not configured',
      passwordActiveDesc: 'Allows sign-in via email and password in the CRM.',
      passwordInactiveDesc: 'Your account was created with Google. You can set a password to enable direct access.',
      forgotOrChange: 'Forgot or want to change it?',
      resetViaEmail: 'Reset via Email',
      resetEmailSent: 'Email sent',
      enablePasswordTitle: 'Enable email and password access?',
      enablePasswordDesc: 'This will let you sign in directly without depending on Google popup. Your account and permissions will remain identical.',
      createPassword: 'Create Password',
      configurePasswordTitle: 'Configure Access Password',
      cancelAction: 'Cancel',
      newPassword: 'New Password',
      newPasswordPlaceholder: 'Minimum 6 characters',
      confirmPassword: 'Confirm Password',
      confirmPasswordPlaceholder: 'Repeat the password',
      minChars: 'At least 6 characters',
      passwordsMatch: 'Passwords match',
      passwordsDontMatch: 'Passwords do not match',
      linking: 'Linking...',
      setPassword: 'Set Password',
      passwordsMismatchError: 'The entered passwords do not match.',
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
      t: (keyPath, variables = {}) => {
        const keys = keyPath.split('.');
        let value = translations.es;
        for (const k of keys) {
          if (value && value[k] !== undefined) {
            value = value[k];
          } else {
            return keyPath;
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
      }
    };
  }
  return context;
}
