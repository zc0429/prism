import type { ToolGuide } from './types'

export const hermesGuide: ToolGuide = {
  id: 'hermes',
  name: 'Hermes',
  icon: '',
  providers: ['Anthropic', 'OpenAI', 'Google'],
  byok: {
    label: '自带 API Key',
    steps: (apiKey) => [
      {
        label: '安装 Node.js (需要 v18+)',
        command: 'https://nodejs.org — 下载并安装',
        osCommands: {
          windows: 'winget install OpenJS.NodeJS.LTS',
          macos: 'brew install node@22',
          linux: 'sudo apt update && sudo apt install -y nodejs npm',
        },
      },
      { label: '安装 Hermes CLI', command: 'npm install -g hermes-agent' },
      { label: '设置 Anthropic API Key', command: `export ANTHROPIC_API_KEY="${apiKey}"` },
      { label: '启动 Hermes', command: 'hermes' },
    ],
  },
  platform: {
    label: '平台额度',
    steps: (endpoint, token) => [
      {
        label: '安装 Node.js (需要 v18+)',
        command: 'https://nodejs.org — 下载并安装',
        osCommands: {
          windows: 'winget install OpenJS.NodeJS.LTS',
          macos: 'brew install node@22',
          linux: 'sudo apt update && sudo apt install -y nodejs npm',
        },
      },
      { label: '安装 Hermes CLI', command: 'npm install -g hermes-agent' },
      { label: '安装 cc-switch', command: 'npm install -g cc-switch' },
      { label: '配置 cc-switch 指向 Prism 网关', command: `cc-switch config --endpoint ${endpoint}/v1` },
      { label: '使用 Token 登录', command: `cc-switch login --token ${token}` },
      { label: '启动 Hermes', command: 'hermes' },
    ],
  },
}