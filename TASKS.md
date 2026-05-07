# TASKS

> 由 Claude Code（监工）维护

## 本轮完成 (Phase 10: CI/CD 打包流水线)

- [x] T40: GitHub Actions 构建验证 → `.github/workflows/build-verify.yml`：PR / push main 时自动构建 Next.js + 编译 Electron + 类型检查（Ubuntu + Windows 矩阵）
- [x] T41: GitHub Actions 发布流水线 → `.github/workflows/build-release.yml`：push tag `v*` 或手动触发时，三平台并行构建（Windows NSIS / macOS DMG / Linux AppImage）并自动发布到 GitHub Releases
- [x] T42: electron-builder 发布配置 → 删除硬编码 owner/repo，改为从 `GITHUB_REPOSITORY` 环境变量自动推断；`tray.ts` 监听 `nativeTheme` 变化动态切换 tray 图标
- [x] `npm run build` 零 error 零 warning（Web + Desktop TypeScript 编译通过）

## 上一轮完成 (Phase 9: 加密安全 + 双模式编辑 + 品牌图标)

- [x] T36: API Key 加密存储 → `.env` ENCRYPTION_KEY 修复为 64 字符；`lib/crypto-client.ts` Web Crypto API (AES-256-GCM + PBKDF2)；`cc-switch.ts` localStorage 中的 apiKeys 自动加解密；`/api/config/route.ts` 递归加解密 `users.config` 中的 `apiKey` 字段
- [x] T37: 配置文件双模式编辑 → Settings 页面新增「Claude Code 配置」卡片，可视化/原始 JSON 两种模式切换，JSON 模式带语法校验
- [x] T38: 占位图标 + 打包优化 → `scripts/generate-icons.ts` 用 jimp 生成 512x512 PNG、32x32 tray、多尺寸 ICO；build 目录包含 icon.png / icon.ico / tray.png
- [x] T39: 品牌图标集成 → 用户提供 icon.icns / icon.ico / icon.png / tray.png / tray@dark.png，替换占位图标；`tray.ts` 支持 macOS 暗色模式自动切换；`electron-builder.yml` macOS 分类设置为 developer-tools
- [x] `npm run build` 零 error 零 warning（Web + Desktop TypeScript 编译通过）

## 上一轮完成 (Phase 8: Electron 壳层)

- [x] T30: Electron 基础设施 → `apps/desktop/` 目录结构，`package.json` + `tsconfig.json` + `electron-builder.yml`
- [x] T31: Next.js standalone 集成 → `next.config.ts` 输出 standalone，主进程启动子进程服务本地 Next.js 服务器
- [x] T32: 主进程架构 → `main/index.ts` 生命周期管理 + `window.ts` BrowserWindow + `menu.ts` 应用菜单 + `tray.ts` 系统托盘
- [x] T33: IPC 桥接 → `preload/index.ts` 安全暴露 API；`ipc/config.ts` 读写 `~/.claude/config.json`；`ipc/installer.ts` Node.js 便携版下载 + Claude Code 安装 + npm 镜像切换；`ipc/diagnostics.ts` 系统代理/版本/ping 检测；`ipc/notify.ts` 原生系统通知
- [x] T34: Web 层适配 → `installer.ts` / `diagnostics.ts` 增加 `isElectron()` 分支调用 IPC；`types/electron.d.ts` 声明全局 `window.prismElectron`
- [x] T35: 自动更新 → 内置 `electron-updater`，`electron-builder.yml` 配置 GitHub 发布通道
- [x] `npm run build` 零 error 零 warning（Web + Desktop TypeScript 编译通过）

## 上一轮完成 (Phase 7: 用户体验增强与商业闭环)

- [x] T27: 模型单价感知化 → `lib/pricing.ts` 成本估算工具，models 页面卡片显示「约 1 元/X 万字」
- [x] T28: 用量预警系统 → users 表新增 alertThreshold / alertEnabled / lastAlertSentAt；Settings 页面预警开关+阈值输入；Dashboard 加载自动检测并邮件提醒；余额不足横幅提示
- [x] T29: 子密钥自动熔断 → virtual_keys 表新增 isActive；`/api/virtual-keys/check-fuse` 后端检测预算消耗并自动禁用超额密钥
- [x] `npm run build` 零 error 零 warning，25 条路由

## 上一轮完成 (Phase 6: 核心底座与风险防控)

- [x] T22: 配置原子写入 → `lib/cc-switch.ts` 新增 `backupConfig()` / `restoreConfig()` / `writeConfigAtomic()`
- [x] T23: 一键安装伪代码 → `lib/installer.ts` 含 Node.js 检测、npm 镜像切换、Claude Code 安装、配置原子写入
- [x] T24: ProviderAdapter 接口 → `lib/providers/adapter.ts` 定义抽象接口 + LiteLLM MVP 实现 + `ProviderManager` 多供应商热切换预留
- [x] T25: 免责声明 → 注册页 `/sign-up` 底部新增合规声明 + 强制勾选
- [x] T26: 系统诊断增强 → `lib/diagnostics.ts` 代理检测 + HTTPS 证书连通性测试 + npm 镜像延迟，集成到 `/setup` 检测阶段
- [x] `npm run build` 零 error 零 warning，25 条路由

## 上一轮完成 (Phase 5: Claude Code 安装配置模块)

- [x] T18: 重写 /setup → 标题「Claude Code 安装配置」+ 环境检测后分支选择（安装/跳过）
- [x] T19: 步骤指示器适配 → 新增「跳过」态（灰色减号 + 虚线）
- [x] T20: Dashboard 快速操作 → 文案改为「Claude Code 配置」
- [x] T21: Tools 页面入口 → Claude Code 卡片新增「配置」按钮跳转 /setup
- [x] `npm run build` 零 error 零 warning，25 条路由

## 上一轮完成 (Phase 4: PRD 功能闭环)

- [x] T12: 用户配置持久化 → users 表添加 config JSONB + /api/config 真正读写
- [x] T13: Sidebar 余额入口 → 底部余额 Pill + 立即充值 + 计划标签
- [x] T14: Dashboard 概览增强 → 余额/计划卡片 + 快速操作入口（模型/充值/下载/安装）
- [x] T15: Models 配置真正写入 → apply config 调用 /api/config PUT 持久化
- [x] T16: Billing 充值流程统一 → /api/billing/recharge + /confirm 幂等回调闭环
- [x] T17: 首页文案中文化 → 对齐 PRD 国内开发者定位
- [x] `npm run build` 零 error 零 warning，25 条路由

## 上一轮完成 (Phase 3: PRD 合规修复)

- [x] T7: 重写品牌首页 `/` → PRD 对齐文案 + 动态终端打字效果
- [x] T8: 重建 /dashboard/models → 12 模型 + 过滤 + 测试 + 应用
- [x] T9: 侧边栏响应式 → <768px 可折叠 + hamburger 菜单
- [x] T10: LiteLLM 网关 → 添加 6 个国产模型
- [x] T11: Dashboard Active Tools → 查询真实数据
- [x] `npm run build` 零 error 零 warning，25 条路由

## 累计完成 (Phase 1-3)

### 设计系统
- [x] DESIGN_SYSTEM.md 对齐 prism-frontend.html
- [x] FRONTEND_TASKS.md 移除暗色终端冲突
- [x] globals.css 重写（语义色系 + .dark 块）
- [x] 15 个文件硬编码颜色 → CSS 变量

### 新页面
- [x] /dashboard/models — 12 模型 + 国产/国外 tab + 连接测试 + 应用配置
- [x] /download — 产品下载页（系统检测 + OS 切换）
- [x] /setup — 安装向导（3 步进度 + 终端模拟）
- [x] / — 品牌首页（动态终端打字 + PRD 三步走）

### API & 后端
- [x] /api/config — 配置 GET/PUT
- [x] /api/config/test-connection — 连接测试
- [x] /api/billing/recharge — 充值
- [x] /api/billing/recharge/confirm — 支付确认
- [x] /api/billing/transactions — 交易记录（增强）
- [x] apps/gateway/config.yaml — 10 模型（含国产）

### 基础设施
- [x] drizzle 迁移日志修复
- [x] Clerk 死配置清理
- [x] lib/cc-switch.ts 配置管理封装
- [x] SidebarNav 响应式折叠
- [x] sonner toast 集成
- [x] Dashboard 活跃工具计数

### 约束
- 设计基准：prism-frontend.html
- `npm run build` 零 error 零 warning
- 颜色使用 CSS 变量（除品牌色 + 终端区）
- 禁止 emoji，只用 Lucide
