import { registerConfigIpc } from './config'
import { registerInstallerIpc } from './installer'
import { registerDiagnosticsIpc } from './diagnostics'
import { registerNotifyIpc } from './notify'

export function registerIpcHandlers(): void {
  registerConfigIpc()
  registerInstallerIpc()
  registerDiagnosticsIpc()
  registerNotifyIpc()
}
