import { Jimp } from 'jimp'
import fs from 'fs/promises'
import path from 'path'

const BUILD_DIR = path.join(process.cwd(), 'build')

async function generateIcons(): Promise<void> {
  await fs.mkdir(BUILD_DIR, { recursive: true })

  const brandColor = 0xd97757
  const bgColor = 0xf5f4ef

  // Main icon 512x512
  const mainIcon = new Jimp({ width: 512, height: 512, color: bgColor })

  // Draw circle background
  for (let y = 64; y < 448; y++) {
    for (let x = 64; x < 448; x++) {
      const dx = x - 256
      const dy = y - 256
      if (dx * dx + dy * dy <= 180 * 180) {
        mainIcon.setPixelColor(brandColor, x, y)
      }
    }
  }

  await mainIcon.write(path.join(BUILD_DIR, 'icon.png') as `${string}.png`)

  // Tray icon 32x32
  const trayIcon = new Jimp({ width: 32, height: 32, color: bgColor })
  for (let y = 2; y < 30; y++) {
    for (let x = 2; x < 30; x++) {
      const dx = x - 16
      const dy = y - 16
      if (dx * dx + dy * dy <= 12 * 12) {
        trayIcon.setPixelColor(brandColor, x, y)
      }
    }
  }
  await trayIcon.write(path.join(BUILD_DIR, 'tray.png') as `${string}.png`)

  // ICO (16, 32, 48, 256)
  const sizes = [16, 32, 48, 256]
  const pngs: Buffer[] = []
  for (const size of sizes) {
    const resized = mainIcon.resize({ w: size, h: size })
    const buf = await resized.getBuffer('image/png')
    pngs.push(buf)
  }

  const icoBuffer = createIco(pngs, sizes)
  await fs.writeFile(path.join(BUILD_DIR, 'icon.ico'), icoBuffer)

  console.log('Icons generated in', BUILD_DIR)
}

function createIco(pngs: Buffer[], sizes: number[]): Buffer {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(pngs.length, 4)

  const dirEntries: Buffer[] = []
  const imageData: Buffer[] = []
  let offset = 6 + pngs.length * 16

  for (let i = 0; i < pngs.length; i++) {
    const entry = Buffer.alloc(16)
    entry.writeUInt8(sizes[i] >= 256 ? 0 : sizes[i], 0)
    entry.writeUInt8(sizes[i] >= 256 ? 0 : sizes[i], 1)
    entry.writeUInt8(0, 2)
    entry.writeUInt8(0, 3)
    entry.writeUInt16LE(1, 4)
    entry.writeUInt16LE(32, 6)
    entry.writeUInt32LE(pngs[i].length, 8)
    entry.writeUInt32LE(offset, 12)
    dirEntries.push(entry)
    imageData.push(pngs[i])
    offset += pngs[i].length
  }

  return Buffer.concat([header, ...dirEntries, ...imageData])
}

generateIcons().catch((err) => {
  console.error('Failed to generate icons:', err)
  process.exit(1)
})
