// ── TAXIMETER.GOV — RBAC Engine ──
// Rôles, permissions et isolation enterprise

export type Role =
  | 'SUPER_ADMIN'
  | 'GOV_ADMIN'
  | 'GOV_AGENT'
  | 'ENTERPRISE_ADMIN'
  | 'ENTERPRISE_MANAGER'
  | 'ENTERPRISE_FINANCE'
  | 'ENTERPRISE_COMPLIANCE'
  | 'ENTERPRISE_VIEWER'
  | 'DRIVER'
  | 'VIEWER'

export type Permission =
  | 'control_center:view'
  | 'dashboard:view'
  | 'departments:view'   | 'departments:edit'
  | 'users:view'         | 'users:edit'
  | 'drivers:view'       | 'drivers:edit'
  | 'vehicles:view'      | 'vehicles:edit'
  | 'documents:view'     | 'documents:edit'
  | 'activities:view'
  | 'transactions:view'
  | 'revenue:view'
  | 'fiscal:view'        | 'fiscal:edit'
  | 'declarations:view'  | 'declarations:submit'
  | 'payments:view'
  | 'obligations:view'
  | 'reconciliation:view'
  | 'exceptions:view'
  | 'compliance:view'    | 'compliance:edit'
  | 'analytics:view'
  | 'intelligence:view'
  | 'reports:view'       | 'reports:generate'
  | 'connections:view'   | 'connections:edit'
  | 'integrations:view'  | 'integrations:edit'
  | 'government:view'    | 'government:message'
  | 'security:view'      | 'security:admin'
  | 'audit:view'
  | 'notifications:view'
  | 'onboarding:view'    | 'onboarding:edit'
  | 'profile:view'       | 'profile:edit'

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  SUPER_ADMIN: [
    'control_center:view','dashboard:view',
    'departments:view','departments:edit',
    'users:view','users:edit',
    'drivers:view','drivers:edit',
    'vehicles:view','vehicles:edit',
    'documents:view','documents:edit',
    'activities:view','transactions:view','revenue:view',
    'fiscal:view','fiscal:edit',
    'declarations:view','declarations:submit',
    'payments:view','obligations:view',
    'reconciliation:view','exceptions:view',
    'compliance:view','compliance:edit',
    'analytics:view','intelligence:view',
    'reports:view','reports:generate',
    'connections:view','connections:edit',
    'integrations:view','integrations:edit',
    'government:view','government:message',
    'security:view','security:admin',
    'audit:view','notifications:view',
    'onboarding:view','onboarding:edit',
    'profile:view','profile:edit',
  ],
  GOV_ADMIN: [
    'dashboard:view','drivers:view','vehicles:view','documents:view',
    'activities:view','transactions:view','revenue:view',
    'fiscal:view','declarations:view','compliance:view',
    'analytics:view','reports:view','audit:view',
    'government:view','government:message','security:view','notifications:view',
  ],
  GOV_AGENT: [
    'dashboard:view','drivers:view','vehicles:view','documents:view',
    'activities:view','transactions:view','revenue:view',
    'fiscal:view','declarations:view','compliance:view',
    'reports:view','audit:view','government:view','notifications:view',
  ],
  ENTERPRISE_ADMIN: [
    'control_center:view','dashboard:view',
    'departments:view','departments:edit',
    'users:view','users:edit',
    'drivers:view','drivers:edit',
    'vehicles:view','vehicles:edit',
    'documents:view','documents:edit',
    'activities:view','transactions:view','revenue:view',
    'fiscal:view','fiscal:edit',
    'declarations:view','declarations:submit',
    'payments:view','obligations:view',
    'reconciliation:view','exceptions:view',
    'compliance:view','compliance:edit',
    'analytics:view','intelligence:view',
    'reports:view','reports:generate',
    'connections:view','integrations:view',
    'government:view','government:message',
    'security:view','audit:view','notifications:view',
    'onboarding:view','onboarding:edit',
    'profile:view','profile:edit',
  ],
  ENTERPRISE_MANAGER: [
    'control_center:view','dashboard:view',
    'departments:view','drivers:view','drivers:edit',
    'vehicles:view','vehicles:edit',
    'documents:view','documents:edit',
    'activities:view','transactions:view','revenue:view',
    'analytics:view','reports:view','notifications:view',
    'compliance:view','exceptions:view','audit:view',
    'profile:view','profile:edit',
  ],
  ENTERPRISE_FINANCE: [
    'dashboard:view','transactions:view','revenue:view',
    'fiscal:view','fiscal:edit',
    'declarations:view','declarations:submit',
    'payments:view','obligations:view',
    'reconciliation:view','exceptions:view',
    'analytics:view','reports:view','reports:generate',
    'notifications:view','profile:view','profile:edit',
  ],
  ENTERPRISE_COMPLIANCE: [
    'dashboard:view','documents:view','documents:edit',
    'compliance:view','compliance:edit',
    'audit:view','drivers:view','vehicles:view',
    'reports:view','notifications:view',
    'profile:view','profile:edit',
  ],
  ENTERPRISE_VIEWER: [
    'dashboard:view','departments:view','drivers:view','vehicles:view',
    'activities:view','transactions:view','revenue:view',
    'reports:view','notifications:view','profile:view',
  ],
  DRIVER: [
    'dashboard:view','activities:view','transactions:view',
    'documents:view','profile:view','profile:edit','notifications:view',
  ],
  VIEWER: ['dashboard:view','profile:view'],
}

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

export function getRolePermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] ?? []
}

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN:           'Super Administrateur',
  GOV_ADMIN:             'Admin Gouvernemental',
  GOV_AGENT:             'Agent Gouvernemental',
  ENTERPRISE_ADMIN:      'Admin Entreprise',
  ENTERPRISE_MANAGER:    'Gestionnaire',
  ENTERPRISE_FINANCE:    'Finance',
  ENTERPRISE_COMPLIANCE: 'Conformité',
  ENTERPRISE_VIEWER:     'Lecture seule',
  DRIVER:                'Chauffeur',
  VIEWER:                'Visiteur',
}

export const ROLE_COLORS: Record<Role, string> = {
  SUPER_ADMIN:           '#DC2626',
  GOV_ADMIN:             '#7C3AED',
  GOV_AGENT:             '#6D28D9',
  ENTERPRISE_ADMIN:      '#000000',
  ENTERPRISE_MANAGER:    '#003DA5',
  ENTERPRISE_FINANCE:    '#059669',
  ENTERPRISE_COMPLIANCE: '#B45309',
  ENTERPRISE_VIEWER:     '#64748B',
  DRIVER:                '#0284C7',
  VIEWER:                '#94A3B8',
}

// Routes protégées et permission requise
export const ROUTE_PERMISSIONS: Record<string, Permission> = {
  '/control-center':      'control_center:view',
  '/departments':         'departments:view',
  '/users':               'users:view',
  '/drivers':             'drivers:view',
  '/vehicles':            'vehicles:view',
  '/documents':           'documents:view',
  '/activities':          'activities:view',
  '/transactions':        'transactions:view',
  '/revenue':             'revenue:view',
  '/fiscal':              'fiscal:view',
  '/declarations':        'declarations:view',
  '/payments':            'payments:view',
  '/obligations':         'obligations:view',
  '/reconciliation':      'reconciliation:view',
  '/exceptions':          'exceptions:view',
  '/compliance':          'compliance:view',
  '/analytics':           'analytics:view',
  '/intelligence':        'intelligence:view',
  '/reports':             'reports:view',
  '/connections':         'connections:view',
  '/integrations':        'integrations:view',
  '/government':          'government:view',
  '/security':            'security:view',
  '/audit':               'audit:view',
  '/notifications':       'notifications:view',
  '/onboarding':          'onboarding:view',
  '/profile':             'profile:view',
}
