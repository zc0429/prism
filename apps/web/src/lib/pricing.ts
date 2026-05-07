/**
 * Pricing utilities — 模型单价感知化计算
 *
 * 将原始价格（如 ¥0.001/1K）转换为直观的成本估算
 */

export interface PriceInfo {
  raw: string
  currency: 'CNY' | 'USD'
  amount: number
  unit: '1K' | '1M'
}

/** 解析价格字符串 */
export function parsePrice(priceStr: string): PriceInfo | null {
  const match = priceStr.match(/^([¥$])([\d.]+)\/(1K|1M)$/)
  if (!match) return null
  const currency = match[1] === '¥' ? 'CNY' : 'USD'
  const amount = parseFloat(match[2] ?? '0')
  const unit = match[3] as '1K' | '1M'
  return { raw: priceStr, currency, amount, unit }
}

/** 统一换算为「每 token 多少元（人民币）」 */
export function pricePerToken(info: PriceInfo): number {
  const tokensPerUnit = info.unit === '1M' ? 1_000_000 : 1_000
  // 美元按 7.2 汇率换算为人民币（简化）
  const cnyAmount = info.currency === 'USD' ? info.amount * 7.2 : info.amount
  return cnyAmount / tokensPerUnit
}

/**
 * 计算「1 元人民币可处理多少字」
 *
 * 假设：1 token ≈ 1.5 中文字（保守估算）
 * 平均成本 = (inputPrice + outputPrice) / 2
 */
export function estimateCharsPerYuan(inputPrice: string, outputPrice: string): number {
  const inInfo = parsePrice(inputPrice)
  const outInfo = parsePrice(outputPrice)
  if (!inInfo || !outInfo) return 0

  const avgPerToken = (pricePerToken(inInfo) + pricePerToken(outInfo)) / 2
  if (avgPerToken <= 0) return 0

  const tokensPerYuan = 1 / avgPerToken
  const charsPerYuan = Math.round(tokensPerYuan * 1.5)
  return charsPerYuan
}

/** 格式化「约 X 万字」 */
export function formatCostEstimate(charsPerYuan: number): string {
  if (charsPerYuan >= 10_000) {
    const wan = (charsPerYuan / 10_000).toFixed(1)
    return `约 1 元 / ${wan} 万字`
  }
  if (charsPerYuan >= 1_000) {
    const qian = Math.round(charsPerYuan / 1_000)
    return `约 1 元 / ${qian} 千字`
  }
  return `约 1 元 / ${charsPerYuan} 字`
}

/** 一键计算模型的成本估算文案 */
export function getCostEstimate(inputPrice: string, outputPrice: string): string {
  const chars = estimateCharsPerYuan(inputPrice, outputPrice)
  return formatCostEstimate(chars)
}
