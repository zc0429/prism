import { auth } from '@/auth'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { DashboardShell } from '@/components/DashboardShell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user?.id) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <p className="text-muted-foreground">请先登录</p>
      </div>
    )
  }

  const [user] = await db
    .select({ plan: users.plan, credits: users.credits })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)

  return (
    <DashboardShell
      plan={user?.plan ?? 'free'}
      credits={user?.credits ?? 0}
    >
      {children}
    </DashboardShell>
  )
}
