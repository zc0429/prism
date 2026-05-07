# Prism 前端任务

## 设计方向

以 `prism-frontend.html` 为视觉基准，`DESIGN_SYSTEM.md` 为规范参考。

- **风格**: 暖色极简 — 参考 claude.ai 的温暖克制
- **色彩**: 暖灰底 (#f5f4ef)、橙色强调 (#d97757)
- **排版**: UI 用 Geist Sans（next/font），代码/命令用 JetBrains Mono
- **无 Emoji 图标**: 用 Lucide 替代 emoji
- **触摸友好**: 按钮 >=44px，间距 >=8px
- **对比度**: 正文 >=4.5:1

## 任务

### T1: 重写 globals.css
- 将 CSS 变量体系对齐 prism-frontend.html 色彩
- Primary: #d97757, Background: #f5f4ef, Foreground: #141413
- → verify: `npm run build` 通过

### T2: 替换所有硬编码颜色
- 搜索所有 tsx 文件中的硬编码颜色值（text-[#...], bg-[#...], border-[#...]）
- 替换为 CSS 变量引用
- → verify: Grep 无裸 hex 颜色

### T3: 实现模型管理页 `/dashboard/models`
- 替换 14 行占位符为完整页面
- 模型列表（国产+国外 6+ 模型）、Base URL 模板、API Key 输入、连接测试
- → verify: 页面完整渲染，模型可切换

### T4: 实现安装向导页
- `/download` 产品下载页 + `/setup` 安装流程
- 以 prism-frontend.html 中 view-download / view-setup 为基准
- → verify: 两页面渲染完整，安装流程可走通

### T5: 实现 cc-switch 配置管理封装
- 在 `lib/cc-switch.ts` 实现配置读写 API
- 封装 API Key 写入、Base URL 写入、配置校验
- → verify: TypeScript 编译通过

### T6: 完善充值支付流程
- 后端支付 mock 流程 + 回调处理 + 余额更新
- 前端充值状态管理
- → verify: 充值 → 余额变化 → 交易记录完整闭环

---

## 约束
- 所有代码在 `apps/web/` 下
- `npm run build` 零 error
- 用 shadcn/ui v4 + Tailwind CSS v4
- 颜色必须用 CSS 变量，禁止裸 hex
- 禁止 emoji 图标，只用 Lucide
