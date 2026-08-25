import { downloadBlob } from './download-file'

/** Theme tokens Recharts elements reference via `hsl(var(--x))` fills/strokes. A cloned SVG
 *  serialized on its own doesn't inherit the page's `:root` custom properties, so their
 *  resolved values are inlined into the clone's own `<style>` before rasterizing. */
const CSS_VARS_TO_INLINE = [
  '--chart-1',
  '--chart-2',
  '--chart-3',
  '--chart-4',
  '--chart-5',
  '--chart-6',
  '--border',
  '--foreground',
  '--muted-foreground',
  '--card',
  '--background',
]

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to render chart SVG.'))
    img.src = src
  })
}

/** Rasterizes an on-page `<svg>` (as rendered by Recharts' `ResponsiveContainer`) to a PNG and
 *  triggers a download. `scale` renders at a higher pixel density than the on-screen size. */
export async function exportSvgToPng(svg: SVGSVGElement, filename: string, scale = 2): Promise<void> {
  const rect = svg.getBoundingClientRect()
  const width = rect.width || Number(svg.getAttribute('width')) || 800
  const height = rect.height || Number(svg.getAttribute('height')) || 400

  const clone = svg.cloneNode(true) as SVGSVGElement
  clone.setAttribute('width', String(width))
  clone.setAttribute('height', String(height))
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')

  const computed = getComputedStyle(document.documentElement)
  const varDecls = CSS_VARS_TO_INLINE.map((name) => `${name}:${computed.getPropertyValue(name).trim()};`).join('')
  const style = document.createElementNS('http://www.w3.org/2000/svg', 'style')
  style.textContent = `:root{${varDecls}}`
  clone.insertBefore(style, clone.firstChild)

  const background = `hsl(${computed.getPropertyValue('--card').trim()})`
  const serialized = new XMLSerializer().serializeToString(clone)
  const svgUrl = URL.createObjectURL(new Blob([serialized], { type: 'image/svg+xml;charset=utf-8' }))

  try {
    const img = await loadImage(svgUrl)
    const canvas = document.createElement('canvas')
    canvas.width = width * scale
    canvas.height = height * scale
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D context unavailable.')
    ctx.fillStyle = background
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.scale(scale, scale)
    ctx.drawImage(img, 0, 0, width, height)
    const pngBlob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('PNG encoding failed.'))), 'image/png'),
    )
    downloadBlob(filename, pngBlob)
  } finally {
    URL.revokeObjectURL(svgUrl)
  }
}
