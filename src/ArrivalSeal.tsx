export interface ArrivalSealData {
  missionTitle: string
  rank: string
  distance: string
  duration: string
  completion: string
  date: string
  courierGameName: string
  courierFigureEn: string
  crestName: string
}

function cleanLine(value: string, limit: number): string {
  return value.replace(/[\r\n]+/g, ' ').trim().slice(0, limit)
}

export function formatSealDate(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `EDO · ${year}.${month}.${day}`
}

export function buildSealSummary(data: ArrivalSealData): string {
  return `My HIKYAKU courier seal is stamped: ${cleanLine(data.rank, 72)} — ${cleanLine(data.missionTitle, 96)}, carried by ${cleanLine(data.courierGameName, 72)} for ${cleanLine(data.courierFigureEn, 72)} (${cleanLine(data.crestName, 72)}). ${cleanLine(data.distance, 24)} in ${cleanLine(data.duration, 24)}, ${cleanLine(data.completion, 24)} complete.`
}

function wrapCanvasText(context: CanvasRenderingContext2D, value: string, maxWidth: number): string[] {
  const words = value.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (current && context.measureText(candidate).width > maxWidth) {
      lines.push(current)
      current = word
    } else {
      current = candidate
    }
  }
  if (current) lines.push(current)
  return lines.slice(0, 2)
}

function drawCentered(context: CanvasRenderingContext2D, value: string, x: number, y: number) {
  context.textAlign = 'center'
  context.fillText(value, x, y)
}

/** Draws an exportable version of the seal without relying on DOM screenshots. */
export function drawArrivalSeal(context: CanvasRenderingContext2D, data: ArrivalSealData): void {
  const { width, height } = context.canvas
  const centreX = width / 2

  context.fillStyle = '#11142a'
  context.fillRect(0, 0, width, height)
  const glow = context.createRadialGradient(centreX, height * 0.38, 10, centreX, height * 0.38, width * 0.58)
  glow.addColorStop(0, 'rgba(244, 185, 66, 0.18)')
  glow.addColorStop(1, 'rgba(17, 20, 42, 0)')
  context.fillStyle = glow
  context.fillRect(0, 0, width, height)

  context.strokeStyle = '#d7a33f'
  context.lineWidth = 5
  context.strokeRect(28, 28, width - 56, height - 56)
  context.lineWidth = 1
  context.strokeStyle = 'rgba(255, 226, 156, 0.72)'
  context.strokeRect(43, 43, width - 86, height - 86)

  context.fillStyle = '#f6d78f'
  context.font = '700 24px Georgia, serif'
  context.letterSpacing = '3px'
  drawCentered(context, 'HIKYAKU  ·  ARRIVAL SEAL', centreX, 88)
  context.letterSpacing = '0px'

  context.fillStyle = '#eadfca'
  context.font = '700 32px Georgia, serif'
  const missionLines = wrapCanvasText(context, cleanLine(data.missionTitle, 96), width - 130)
  missionLines.forEach((line, index) => drawCentered(context, line, centreX, 138 + index * 37))

  context.fillStyle = '#f6d78f'
  context.font = '700 21px Georgia, "Hiragino Mincho ProN", serif'
  drawCentered(context, cleanLine(data.courierGameName, 72), centreX, 221)
  context.fillStyle = '#cfc7bd'
  context.font = '700 14px Arial, sans-serif'
  drawCentered(context, `CARRIED FOR ${cleanLine(data.courierFigureEn, 72)}`, centreX, 249)

  const sealY = height * 0.5
  context.save()
  context.translate(centreX, sealY)
  context.rotate(-0.08)
  context.fillStyle = '#bd3b31'
  context.beginPath()
  context.arc(0, 0, 116, 0, Math.PI * 2)
  context.fill()
  context.strokeStyle = '#ffca8d'
  context.lineWidth = 5
  context.beginPath()
  context.arc(0, 0, 95, 0, Math.PI * 2)
  context.stroke()
  context.fillStyle = '#ffe7b5'
  context.font = '700 122px Georgia, "Hiragino Mincho ProN", serif'
  drawCentered(context, '飛', 0, 42)
  context.font = '700 15px Arial, sans-serif'
  context.letterSpacing = '3px'
  drawCentered(context, 'DELIVERED', 0, 76)
  context.font = '700 13px Georgia, "Hiragino Mincho ProN", serif'
  context.letterSpacing = '1px'
  drawCentered(context, cleanLine(data.crestName, 72), 0, 100)
  context.restore()
  context.letterSpacing = '0px'

  context.fillStyle = '#f6d78f'
  context.font = '700 29px Georgia, serif'
  drawCentered(context, cleanLine(data.rank, 72), centreX, sealY + 156)

  const metrics = [data.distance, data.duration, data.completion]
  context.strokeStyle = 'rgba(246, 215, 143, 0.42)'
  context.lineWidth = 1
  context.beginPath()
  context.moveTo(86, height - 190)
  context.lineTo(width - 86, height - 190)
  context.stroke()
  context.fillStyle = '#fff0cb'
  context.font = '700 24px Arial, sans-serif'
  metrics.forEach((metric, index) => drawCentered(context, cleanLine(metric, 24), width * ((index + 0.5) / 3), height - 148))
  context.fillStyle = '#cfc7bd'
  context.font = '700 14px Arial, sans-serif'
  ;['DISTANCE', 'DURATION', 'COMPLETE'].forEach((label, index) => drawCentered(context, label, width * ((index + 0.5) / 3), height - 120))
  context.fillStyle = '#f6d78f'
  context.font = '700 16px Arial, sans-serif'
  context.letterSpacing = '2px'
  drawCentered(context, data.date, centreX, height - 70)
  context.letterSpacing = '0px'
}

export function sealCanvasDataUrl(data: ArrivalSealData): string | null {
  if (typeof document === 'undefined') return null
  const canvas = document.createElement('canvas')
  canvas.width = 1080
  canvas.height = 1350
  const context = canvas.getContext('2d')
  if (!context) return null
  drawArrivalSeal(context, data)
  return canvas.toDataURL('image/png')
}

export function ArrivalSeal({ data }: { data: ArrivalSealData }) {
  return (
    <section className="arrival-seal" aria-label="HIKYAKU arrival seal">
      <div className="seal-certificate">
        <p className="seal-brand">HIKYAKU · ARRIVAL SEAL</p>
        <p className="seal-mission">{data.missionTitle}</p>
        <p className="seal-courier">{data.courierGameName}</p>
        <p className="seal-figure">carried for {data.courierFigureEn}</p>
        <div className="seal-stamp" aria-hidden="true">
          <span>飛</span>
          <small>DELIVERED</small>
          <b>{data.crestName}</b>
        </div>
        <p className="seal-rank">{data.rank}</p>
        <div className="seal-metrics">
          <span><strong>{data.distance}</strong>distance</span>
          <span><strong>{data.duration}</strong>duration</span>
          <span><strong>{data.completion}</strong>complete</span>
        </div>
        <p className="seal-date">{data.date}</p>
      </div>
    </section>
  )
}
