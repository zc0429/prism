import NextAuth from 'next-auth'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { db } from '@/lib/db'
import { users, accounts, sessions, verificationTokens } from '@/lib/db/schema'
import { authConfig } from './auth.config'
import { authProviders } from './auth.providers'

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  ...authProviders,
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
})
