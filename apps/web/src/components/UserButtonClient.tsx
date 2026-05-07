'use client'

import { useSession, signOut } from 'next-auth/react'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function UserButtonClient() {
  const { data: session } = useSession()

  if (!session?.user) return null

  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-sm text-muted-foreground truncate max-w-36">
        {session.user.email}
      </span>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => signOut({ callbackUrl: '/' })}
        className="h-7 text-xs text-muted-foreground"
      >
        <LogOut className="h-3 w-3 mr-1" />
        Sign Out
      </Button>
    </div>
  )
}
