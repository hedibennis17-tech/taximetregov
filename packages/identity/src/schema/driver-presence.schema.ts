// ================================================================
// TAXIMÈTRE.GOV — DRIVER PRESENCE
// ================================================================
// Presence is operational metadata. It never stores raw GPS coordinates.

import { pgEnum, pgTable, timestamp, uuid, varchar, index } from 'drizzle-orm/pg-core'
import { driverProfiles } from './profiles.schema'

export const driverPresenceStatusEnum = pgEnum('driver_presence_status', [
  'OFFLINE',
  'ONLINE',
])

export const driverPresences = pgTable('driver_presences', {
  id: uuid('id').primaryKey().defaultRandom(),
  driverId: uuid('driver_id').notNull().unique()
    .references(() => driverProfiles.id, { onDelete: 'cascade' }),
  status: driverPresenceStatusEnum('status').notNull().default('OFFLINE'),
  locationLabel: varchar('location_label', { length: 100 }),
  lastOnlineAt: timestamp('last_online_at', { withTimezone: true }),
  lastOfflineAt: timestamp('last_offline_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_driver_presences_status').on(table.status),
])
