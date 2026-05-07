'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { Wallet, QrCode, Check } from 'lucide-react'

interface BalanceData {
  plan: string
  credits: number
}

interface Plan {
  id: string
  name: string
  price: number
  currency: string
  period: string
  features: string[]
}

interface Transaction {
  id: string
  type: string
  amount: number
  currency: string | null
  credits: number | null
  status: string | null
  createdAt: string
}

const amountOptions = [
  { label: '10 元 = 100 积分', amount: 10, credits: 100 },
  { label: '50 元 = 500 积分', amount: 50, credits: 500 },
  { label: '100 元 = 1000 积分', amount: 100, credits: 1000 },
  { label: '500 元 = 5000 积分', amount: 500, credits: 5000 },
]

const planLabels: Record<string, string> = {
  free: 'Free',
  pro: 'Pro',
  team: 'Team',
}

const statusLabels: Record<string, string> = {
  pending: '待支付',
  completed: '已完成',
  failed: '失败',
}

const statusBadgeClass: Record<string, string> = {
  pending: 'bg-primary/10 text-primary border-primary/20',
  completed: 'bg-primary/10 text-primary border-primary/20',
  failed: 'bg-destructive/10 text-destructive border-destructive/20',
}

const planCardClass: Record<string, string> = {
  free: '',
  pro: 'ring-1 ring-primary/30',
  team: 'ring-1 ring-primary/30 shadow-[0_0_15px_color-mix(in_oklab,var(--primary),transparent_85%)]',
}

export default function BillingPage() {
  const [balance, setBalance] = useState<BalanceData | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [payMethod, setPayMethod] = useState<'alipay' | 'wechat' | null>(null)
  const [selectedAmount, setSelectedAmount] = useState<(typeof amountOptions)[number] | null>(amountOptions[0] ?? null)
  const [loading, setLoading] = useState(false)
  const [pendingTxId, setPendingTxId] = useState<string | null>(null)

  const fetchBalance = useCallback(async () => {
    const res = await fetch('/api/billing/balance')
    if (res.ok) {
      const json = await res.json()
      setBalance(json.data)
    }
  }, [])

  const fetchPlans = useCallback(async () => {
    const res = await fetch('/api/billing/plans')
    if (res.ok) {
      const json = await res.json()
      setPlans(json.data)
    }
  }, [])

  const fetchTransactions = useCallback(async () => {
    const res = await fetch('/api/billing/transactions')
    if (res.ok) {
      const json = await res.json()
      setTransactions(json.data)
    }
  }, [])

  useEffect(() => {
    fetchBalance()
    fetchPlans()
    fetchTransactions()
  }, [fetchBalance, fetchPlans, fetchTransactions])

  const handleTopup = async () => {
    if (!payMethod || !selectedAmount) return
    setLoading(true)
    try {
      const planMap: Record<number, string> = {
        10: 'topup-10',
        50: 'topup-50',
        100: 'topup-100',
        500: 'topup-500',
      }
      const res = await fetch('/api/billing/recharge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: planMap[selectedAmount.amount],
          paymentMethod: payMethod,
        }),
      })
      if (res.ok) {
        const json = await res.json()
        setPendingTxId(json.data?.transactionId ?? null)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async () => {
    if (!pendingTxId) return
    setLoading(true)
    try {
      const res = await fetch('/api/billing/recharge/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId: pendingTxId }),
      })
      if (res.ok) {
        fetchTransactions()
        fetchBalance()
        setPayMethod(null)
        setPendingTxId(null)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">充值订阅</h1>

      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-card shadow-sm rounded-2xl border border-border">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">当前计划</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{planLabels[balance?.plan ?? 'free'] ?? 'Free'}</p>
          </CardContent>
        </Card>
        <Card className="bg-card shadow-sm rounded-2xl border border-border">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">积分余额</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">{balance?.credits?.toLocaleString('zh-CN') ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {plans.map((plan) => (
          <Card key={plan.id} className={`bg-card shadow-sm rounded-2xl border border-border ${planCardClass[plan.id] ?? ''}`}>
            <CardHeader>
              <CardTitle className="text-foreground">{plan.name}</CardTitle>
              <CardDescription className="text-muted-foreground">
                ¥{plan.price}{plan.period}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-foreground">
                    <Check className="size-3.5 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              {balance?.plan === plan.id ? (
                <Button variant="outline" size="sm" disabled className="border-border text-muted-foreground">当前计划</Button>
              ) : (
                <Button variant={plan.id === 'pro' ? 'default' : 'outline'} size="sm" className={plan.id !== 'pro' ? 'border-border text-foreground hover:bg-secondary' : ''}>
                  {plan.price === 0 ? '降级' : '升级'}
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>

      <Card className="bg-card shadow-sm rounded-2xl border border-border">
        <CardHeader>
          <CardTitle className="text-foreground">充值积分</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              {amountOptions.map((opt) => (
                <Button
                  key={opt.amount}
                  variant={selectedAmount?.amount === opt.amount ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedAmount(opt)}
                  className={selectedAmount?.amount !== opt.amount ? 'border-border text-foreground hover:bg-secondary' : ''}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setPayMethod(payMethod === 'alipay' ? null : 'alipay')}
                className={payMethod === 'alipay' ? 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100' : 'border-border text-foreground hover:bg-secondary'}
              >
                <Wallet className="size-4" />
                支付宝
              </Button>
              <Button
                variant="outline"
                onClick={() => setPayMethod(payMethod === 'wechat' ? null : 'wechat')}
                className={payMethod === 'wechat' ? 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100' : 'border-border text-foreground hover:bg-secondary'}
              >
                <QrCode className="size-4" />
                微信支付
              </Button>
            </div>
            {payMethod && !pendingTxId && (
              <div className="border border-border rounded-lg p-6 flex flex-col items-center gap-3 bg-card">
                <div className="w-40 h-40 bg-secondary rounded-lg flex items-center justify-center text-muted-foreground text-sm">
                  {payMethod === 'alipay' ? '支付宝' : '微信'}二维码占位
                </div>
                <p className="text-sm text-muted-foreground">
                  扫码支付 ¥{selectedAmount?.amount}，获得 {selectedAmount?.credits} 积分
                </p>
                <Button variant="default" size="sm" disabled={loading} onClick={handleTopup}>
                  {loading ? '生成订单中...' : '生成支付二维码'}
                </Button>
              </div>
            )}
            {pendingTxId && (
              <div className="border border-border rounded-lg p-6 flex flex-col items-center gap-3 bg-card">
                <div className="w-40 h-40 bg-secondary rounded-lg flex items-center justify-center text-muted-foreground text-sm">
                  {payMethod === 'alipay' ? '支付宝' : '微信'}二维码占位
                </div>
                <p className="text-sm text-muted-foreground">
                  扫码支付 ¥{selectedAmount?.amount}，获得 {selectedAmount?.credits} 积分
                </p>
                <Button variant="default" size="sm" disabled={loading} onClick={handleConfirm}>
                  {loading ? '确认中...' : '确认已支付'}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card shadow-sm rounded-2xl border border-border">
        <CardHeader>
          <CardTitle className="text-foreground">交易记录</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="bg-secondary">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">日期</TableHead>
                <TableHead className="text-muted-foreground">类型</TableHead>
                <TableHead className="text-right text-muted-foreground">金额</TableHead>
                <TableHead className="text-right text-muted-foreground">积分</TableHead>
                <TableHead className="text-muted-foreground">状态</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    暂无交易记录
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((tx) => (
                  <TableRow key={tx.id} className="border-border">
                    <TableCell className="text-foreground">{new Date(tx.createdAt).toLocaleDateString('zh-CN')}</TableCell>
                    <TableCell className="text-foreground">{tx.type === 'topup' ? '充值' : tx.type}</TableCell>
                    <TableCell className="text-right text-foreground">¥{tx.amount}</TableCell>
                    <TableCell className="text-right text-foreground">{tx.credits ?? '-'}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${statusBadgeClass[tx.status ?? 'pending'] ?? 'bg-secondary text-muted-foreground border-border'}`}>
                        {statusLabels[tx.status ?? 'pending'] ?? tx.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
