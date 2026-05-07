import { pgTable, uuid, text, integer, bigint, boolean, timestamp, real, jsonb } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkId: text('clerk_id').unique(),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: timestamp('email_verified'),
  image: text('image'),
  passwordHash: text('password_hash'),
  plan: text('plan').default('free').notNull(),
  credits: integer('credits').default(0).notNull(),
  stripeCustomerId: text('stripe_customer_id'),
  config: jsonb('config').$type<Record<string, unknown>>(),
  alertThreshold: integer('alert_threshold').default(50),
  alertEnabled: boolean('alert_enabled').default(true),
  lastAlertSentAt: timestamp('last_alert_sent_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const apiKeys = pgTable('api_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  provider: text('provider').notNull(),
  keyHash: text('key_hash').notNull(),
  keyHint: text('key_hint').notNull(),
  label: text('label'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const virtualKeys = pgTable('virtual_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  litellmKeyId: text('litellm_key_id').notNull(),
  keyValue: text('key_value').notNull(),
  budgetLimit: real('budget_limit'),
  budgetUsed: real('budget_used').default(0),
  isActive: boolean('is_active').default(true),
  resetAt: timestamp('reset_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const installedTools = pgTable('installed_tools', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  toolId: text('tool_id').notNull(),
  version: text('version'),
  config: jsonb('config'),
  installedAt: timestamp('installed_at').defaultNow().notNull(),
  lastActiveAt: timestamp('last_active_at'),
})

export const usageLogs = pgTable('usage_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  toolId: text('tool_id'),
  model: text('model').notNull(),
  provider: text('provider').notNull(),
  inputTokens: bigint('input_tokens', { mode: 'number' }).default(0),
  outputTokens: bigint('output_tokens', { mode: 'number' }).default(0),
  costUsd: real('cost_usd').default(0),
  mode: text('mode').notNull(),
  requestId: text('request_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const accounts = pgTable('accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
})

export const sessions = pgTable('sessions', {
  sessionToken: text('session_token').primaryKey().notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  expires: timestamp('expires').notNull(),
})

export const verificationTokens = pgTable('verification_tokens', {
  identifier: text('identifier').notNull(),
  token: text('token').unique().notNull(),
  expires: timestamp('expires').notNull(),
})

export const transactions = pgTable('transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  type: text('type').notNull(),
  amount: integer('amount').notNull(),
  currency: text('currency').default('CNY'),
  credits: integer('credits'),
  stripePaymentId: text('stripe_payment_id'),
  status: text('status').default('pending'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
