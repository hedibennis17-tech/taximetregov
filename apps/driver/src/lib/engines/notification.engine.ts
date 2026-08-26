// ============================================================
// TAXIMETRE.GOV - NOTIFICATION ENGINE (Step 21)
// ============================================================

export type NotificationType =
  | 'DOCUMENT_EXPIRY' | 'DOCUMENT_REJECTED' | 'DOCUMENT_VERIFIED'
  | 'PAYMENT_RECEIVED' | 'PAYMENT_FAILED' | 'ADJUSTMENT_APPLIED'
  | 'PLATFORM_SYNC' | 'PLATFORM_ERROR' | 'PLATFORM_MAINTENANCE'
  | 'TAX_PERIOD_DUE' | 'TAX_ESTIMATE_READY' | 'TAX_REPORT_READY'
  | 'COMPLIANCE_ALERT' | 'GOVERNMENT_MESSAGE' | 'ACCOUNT_SECURITY'
  | 'TRIP_COMPLETED' | 'WEBHOOK_ERROR' | 'RECONCILIATION_MISMATCH'
  | 'SYSTEM_UPDATE' | 'GENERAL'

export type NotificationPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO'
export type NotificationChannel = 'IN_APP' | 'PUSH' | 'EMAIL' | 'SMS'
export type NotificationStatus = 'UNREAD' | 'READ' | 'ARCHIVED' | 'DISMISSED'

export interface DriverNotification {
  id: string
  driverId: string
  type: NotificationType
  priority: NotificationPriority
  channel: NotificationChannel[]
  status: NotificationStatus
  title: string
  body: string
  actionLabel: string | null
  actionUrl: string | null
  icon: string
  relatedResourceType: string | null
  relatedResourceId: string | null
  createdAt: string
  readAt: string | null
  expiresAt: string | null
  isGovernmentMessage: boolean
  governmentSenderCode: string | null
}

export interface NotificationPreferences {
  driverId: string
  quietHoursEnabled: boolean
  quietHoursStart: string
  quietHoursEnd: string
  language: 'fr' | 'en'
  smsEnabled: boolean
  pushEnabled: boolean
  emailEnabled: boolean
}

export interface SupportTicket {
  ticketId: string
  driverId: string
  category: SupportCategory
  subject: string
  body: string
  status: TicketStatus
  priority: SupportPriority
  createdAt: string
  updatedAt: string
  resolvedAt: string | null
  assignedTo: string | null
  messages: TicketMessage[]
}

export type SupportCategory =
  | 'DOCUMENT' | 'PAYMENT' | 'TAX' | 'PLATFORM'
  | 'TAXIMETER' | 'GPS' | 'ACCOUNT' | 'GOVERNMENT' | 'TECHNICAL' | 'OTHER'

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'AWAITING_DRIVER' | 'RESOLVED' | 'CLOSED'
export type SupportPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

export interface TicketMessage {
  messageId: string
  ticketId: string
  sender: 'DRIVER' | 'SUPPORT' | 'SYSTEM' | 'GOVERNMENT'
  content: string
  sentAt: string
  attachments: string[]
}

// Mock notifications - clean ASCII only
export const mockNotifications: DriverNotification[] = [
  {
    id: 'notif-001', driverId: 'DR-00001234',
    type: 'DOCUMENT_EXPIRY', priority: 'HIGH',
    channel: ['IN_APP', 'PUSH', 'EMAIL'], status: 'UNREAD',
    title: 'Inspection expire dans 112 jours',
    body: 'Votre inspection de vehicule expire le 15 decembre 2026. Planifiez le renouvellement avant cette date.',
    actionLabel: 'Voir le document', actionUrl: '/documents',
    icon: '\u26a0\ufe0f', relatedResourceType: 'DOCUMENT', relatedResourceId: 'doc-003',
    createdAt: '2026-08-24T08:00:00Z', readAt: null, expiresAt: '2026-12-15T00:00:00Z',
    isGovernmentMessage: false, governmentSenderCode: null,
  },
  {
    id: 'notif-002', driverId: 'DR-00001234',
    type: 'PAYMENT_RECEIVED', priority: 'LOW',
    channel: ['IN_APP'], status: 'UNREAD',
    title: 'Revenus Uber synchronises',
    body: '3 courses Uber synchronisees · 87.30$ · Ledger mis a jour.',
    actionLabel: 'Voir revenus', actionUrl: '/revenue',
    icon: '\U0001f4b0', relatedResourceType: 'TRANSACTION', relatedResourceId: null,
    createdAt: '2026-08-24T14:55:00Z', readAt: null, expiresAt: null,
    isGovernmentMessage: false, governmentSenderCode: null,
  },
  {
    id: 'notif-003', driverId: 'DR-00001234',
    type: 'PLATFORM_MAINTENANCE', priority: 'MEDIUM',
    channel: ['IN_APP', 'PUSH'], status: 'READ',
    title: 'Skip - Maintenance planifiee',
    body: 'Skip sera en maintenance le 24 aout 2026 de 14h a 16h. Vos livraisons reprennent automatiquement.',
    actionLabel: 'Voir plateformes', actionUrl: '/platforms',
    icon: '\U0001f527', relatedResourceType: 'PLATFORM', relatedResourceId: 'skip',
    createdAt: '2026-08-24T13:50:00Z', readAt: '2026-08-24T14:00:00Z', expiresAt: '2026-08-24T16:00:00Z',
    isGovernmentMessage: false, governmentSenderCode: null,
  },
  {
    id: 'notif-004', driverId: 'DR-00001234',
    type: 'GOVERNMENT_MESSAGE', priority: 'MEDIUM',
    channel: ['IN_APP', 'EMAIL'], status: 'READ',
    title: 'Message officiel - Revenu Quebec',
    body: "Votre declaration de TPS/TVQ pour T1 2026 est disponible. Soumettez via les canaux officiels de Revenu Quebec et l\'ARC.",
    actionLabel: 'Voir fiscal', actionUrl: '/tax/periods',
    icon: '\U0001f3db',
    relatedResourceType: 'TAX_PERIOD', relatedResourceId: null,
    createdAt: '2026-08-20T10:00:00Z', readAt: '2026-08-21T09:00:00Z', expiresAt: '2026-09-30T00:00:00Z',
    isGovernmentMessage: true, governmentSenderCode: 'RQ-SYSTEM-2026',
  },
  {
    id: 'notif-005', driverId: 'DR-00001234',
    type: 'RECONCILIATION_MISMATCH', priority: 'HIGH',
    channel: ['IN_APP', 'EMAIL'], status: 'UNREAD',
    title: 'Ecart detecte - DoorDash',
    body: 'Reconciliation DoorDash: Fournisseur 128.60$ vs Ledger 112.40$ - Ecart: 16.20$ - Revision manuelle requise.',
    actionLabel: 'Voir reconciliation', actionUrl: '/sync',
    icon: '\u2696\ufe0f', relatedResourceType: 'RECONCILIATION', relatedResourceId: 'REC-002',
    createdAt: '2026-08-24T16:00:00Z', readAt: null, expiresAt: null,
    isGovernmentMessage: false, governmentSenderCode: null,
  },
  {
    id: 'notif-006', driverId: 'DR-00001234',
    type: 'ACCOUNT_SECURITY', priority: 'CRITICAL',
    channel: ['IN_APP', 'PUSH', 'EMAIL', 'SMS'], status: 'READ',
    title: 'Connexion depuis un nouvel appareil',
    body: "Une connexion a ete detectee depuis iPhone 13 a Montreal. Si ce n\'est pas vous, revoquez cet appareil.",
    actionLabel: 'Gerer appareils', actionUrl: '/profile/devices',
    icon: '\U0001f510', relatedResourceType: 'DEVICE', relatedResourceId: 'DEV-002',
    createdAt: '2026-07-10T09:05:00Z', readAt: '2026-07-10T09:10:00Z', expiresAt: null,
    isGovernmentMessage: false, governmentSenderCode: null,
  },
  {
    id: 'notif-007', driverId: 'DR-00001234',
    type: 'PLATFORM_ERROR', priority: 'HIGH',
    channel: ['IN_APP'], status: 'READ',
    title: 'Lyft - Token expire',
    body: 'Votre autorisation Lyft a expire. Reconnectez votre compte pour reprendre la synchronisation.',
    actionLabel: 'Reconnecter', actionUrl: '/platforms/connect?provider=lyft',
    icon: '\U0001f511', relatedResourceType: 'PLATFORM', relatedResourceId: 'lyft',
    createdAt: '2026-08-23T18:00:00Z', readAt: '2026-08-23T19:00:00Z', expiresAt: null,
    isGovernmentMessage: false, governmentSenderCode: null,
  },
  {
    id: 'notif-008', driverId: 'DR-00001234',
    type: 'TAX_ESTIMATE_READY', priority: 'INFO',
    channel: ['IN_APP'], status: 'UNREAD',
    title: 'Estimation fiscale T3 disponible',
    body: 'Votre estimation fiscale pour T3 2026 est prete. TPS: 342$ - TVQ: 682$. ESTIMATION uniquement.',
    actionLabel: 'Voir estimation', actionUrl: '/tax/estimate',
    icon: '\U0001f4ca', relatedResourceType: 'TAX_PERIOD', relatedResourceId: null,
    createdAt: '2026-08-01T08:00:00Z', readAt: null, expiresAt: null,
    isGovernmentMessage: false, governmentSenderCode: null,
  },
]

// Mock support tickets
export const mockSupportTickets: SupportTicket[] = [
  {
    ticketId: 'TKT-001', driverId: 'DR-00001234',
    category: 'DOCUMENT', subject: 'Renouvellement inspection',
    body: 'Mon inspection expire le 15 decembre. Comment renouveler?',
    status: 'RESOLVED', priority: 'MEDIUM',
    createdAt: '2026-08-10T09:00:00Z', updatedAt: '2026-08-11T10:00:00Z',
    resolvedAt: '2026-08-11T10:00:00Z', assignedTo: 'SUPPORT-002',
    messages: [
      { messageId: 'MSG-001', ticketId: 'TKT-001', sender: 'DRIVER', content: 'Mon inspection expire le 15 decembre. Comment renouveler?', sentAt: '2026-08-10T09:00:00Z', attachments: [] },
      { messageId: 'MSG-002', ticketId: 'TKT-001', sender: 'SUPPORT', content: 'Vous pouvez telecharger votre nouveau certificat dans Documents, Ajouter, Vehicule, Inspection.', sentAt: '2026-08-10T14:00:00Z', attachments: [] },
      { messageId: 'MSG-003', ticketId: 'TKT-001', sender: 'DRIVER', content: 'Merci, problem resolu!', sentAt: '2026-08-11T09:30:00Z', attachments: [] },
    ],
  },
  {
    ticketId: 'TKT-002', driverId: 'DR-00001234',
    category: 'PAYMENT', subject: 'Ecart DoorDash - 16.20$',
    body: 'Ecart de 16.20$ entre les donnees DoorDash et mon Ledger.',
    status: 'IN_PROGRESS', priority: 'HIGH',
    createdAt: '2026-08-24T16:30:00Z', updatedAt: '2026-08-24T17:00:00Z',
    resolvedAt: null, assignedTo: 'SUPPORT-001',
    messages: [
      { messageId: 'MSG-004', ticketId: 'TKT-002', sender: 'DRIVER', content: 'Ecart de 16.20$ detecte avec DoorDash.', sentAt: '2026-08-24T16:30:00Z', attachments: [] },
      { messageId: 'MSG-005', ticketId: 'TKT-002', sender: 'SYSTEM', content: 'Ticket assigne au support financier. Reconciliation en cours.', sentAt: '2026-08-24T16:35:00Z', attachments: [] },
      { messageId: 'MSG-006', ticketId: 'TKT-002', sender: 'SUPPORT', content: 'Nous examinons l\'ecart. Resolution attendue sous 48h.', sentAt: '2026-08-24T17:00:00Z', attachments: [] },
    ],
  },
]

export const SUPPORT_CATEGORIES: { key: SupportCategory; label: string; icon: string; desc: string }[] = [
  { key: 'TAXIMETER', icon: '\U0001f695', label: 'Taximetre', desc: 'Course - Tarif - Recu - GPS' },
  { key: 'PAYMENT', icon: '\U0001f4b0', label: 'Paiement & Revenus', desc: 'Transaction - Ecart - Remboursement' },
  { key: 'DOCUMENT', icon: '\U0001f4c4', label: 'Documents', desc: 'Permis - Assurance - Inspection' },
  { key: 'TAX', icon: '\U0001f4ca', label: 'Fiscal', desc: 'TPS - TVQ - Declaration' },
  { key: 'PLATFORM', icon: '\U0001f517', label: 'Plateformes', desc: 'Uber - Lyft - DoorDash' },
  { key: 'GPS', icon: '\U0001f4cd', label: 'GPS & Localisation', desc: 'Signal - Precision' },
  { key: 'ACCOUNT', icon: '\U0001f464', label: 'Compte & Securite', desc: 'MFA - Appareil' },
  { key: 'GOVERNMENT', icon: '\U0001f3db', label: 'Gouvernement', desc: 'Message officiel - Conformite' },
  { key: 'TECHNICAL', icon: '\U0001f527', label: 'Technique', desc: 'Application - Sync' },
  { key: 'OTHER', icon: '\U0001f4ac', label: 'Autre', desc: 'Question generale' },
]

export const PRIORITY_CONFIG: Record<NotificationPriority, { color: string; bg: string; dot: string; label: string }> = {
  CRITICAL: { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30', dot: 'bg-red-500 pulse-red', label: 'CRITIQUE' },
  HIGH:     { color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30', dot: 'bg-orange-500', label: 'ELEVEE' },
  MEDIUM:   { color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', dot: 'bg-amber-500', label: 'MOYENNE' },
  LOW:      { color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', dot: 'bg-blue-500', label: 'BASSE' },
  INFO:     { color: 'text-slate-400', bg: 'bg-slate-800 border-slate-700', dot: 'bg-slate-500', label: 'INFO' },
}

export const STATUS_CONFIG: Record<TicketStatus, { color: string; label: string }> = {
  OPEN:            { color: 'text-green-400', label: 'Ouvert' },
  IN_PROGRESS:     { color: 'text-blue-400', label: 'En cours' },
  AWAITING_DRIVER: { color: 'text-amber-400', label: 'En attente' },
  RESOLVED:        { color: 'text-slate-400', label: 'Resolu' },
  CLOSED:          { color: 'text-slate-600', label: 'Ferme' },
}

export function getUnreadCount(notifications: DriverNotification[]): number {
  return notifications.filter(n => n.status === 'UNREAD').length
}

export function groupByPriority(notifications: DriverNotification[]): Map<NotificationPriority, DriverNotification[]> {
  const map = new Map<NotificationPriority, DriverNotification[]>()
  const order: NotificationPriority[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']
  order.forEach(p => {
    const items = notifications.filter(n => n.priority === p)
    if (items.length > 0) map.set(p, items)
  })
  return map
}
