'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Lock, UserPlus, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function SignUpPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { setError('两次输入的密码不一致'); return }
    if (!agreed) { setError('请阅读并同意免责声明'); return }
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) {
      const json = await res.json()
      setError(json.error || '注册失败')
      setLoading(false)
      return
    }
    await signIn('credentials', { email, password, redirect: false })
    router.push('/dashboard')
  }

  return (
    <div className="flex min-h-svh items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            注册 Prism
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            创建您的账户，开始使用 Claude Code 增强工具
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">
              <Mail className="mr-1.5 inline size-3.5" />
              邮箱
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="hello@example.com"
              required
              className="h-11 bg-card border-border focus:border-primary focus:ring-primary/20"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">
              <Lock className="mr-1.5 inline size-3.5" />
              密码
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="h-11 bg-card border-border focus:border-primary focus:ring-primary/20"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">
              <Lock className="mr-1.5 inline size-3.5" />
              确认密码
            </Label>
            <Input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              required
              className="h-11 bg-card border-border focus:border-primary focus:ring-primary/20"
            />
          </div>

          {/* 免责声明 */}
          <div className="rounded-lg border border-border bg-secondary p-3 space-y-2">
            <div className="flex items-start gap-2">
              <Shield className="size-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                <strong className="text-foreground">免责声明：</strong>
                Prism 仅作为 Claude Code 的配置管理工具与支付网关，不直接提供大模型内容服务。模型调用由第三方中转站完成，Prism 不对模型生成内容的准确性、合法性负责。用户应遵守相关法律法规，不得将本工具用于违法违规用途。
              </p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="size-3.5 rounded border-border accent-primary"
              />
              <span className="text-xs text-muted-foreground">
                我已阅读并同意上述免责声明
              </span>
            </label>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            <UserPlus className="mr-1.5 size-4" />
            {loading ? '注册中...' : '注册'}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          已有账号？{' '}
          <Link href="/sign-in" className="text-primary font-medium underline underline-offset-4 hover:opacity-80">
            立即登录
          </Link>
        </p>
      </div>
    </div>
  )
}
