const plans = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'CNY',
    period: '/月',
    features: [
      '基础模型访问',
      '每天 1,000 Tokens',
      '社区支持',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 99,
    currency: 'CNY',
    period: '/月',
    features: [
      '全部模型访问',
      '每天 100,000 Tokens',
      '优先支持',
      '高级分析',
    ],
  },
  {
    id: 'team',
    name: 'Team',
    price: 299,
    currency: 'CNY',
    period: '/月',
    features: [
      '全部模型访问',
      '无限 Tokens',
      '专属客服',
      '团队协作',
      '高级分析',
      'API 优先级',
    ],
  },
]

export async function GET() {
  return Response.json({ data: plans })
}