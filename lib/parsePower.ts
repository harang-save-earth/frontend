const KNOWN_KEYS = ['power', 'wh', 'value', 'w']

export function parsePower(raw: string): number | null {
  const trimmed = raw.trim()

  // 1) 숫자 직접 파싱
  const direct = Number(trimmed)
  if (trimmed !== '' && !Number.isNaN(direct)) return direct

  // 2) JSON 파싱 후 숫자 필드 추출
  try {
    const obj = JSON.parse(trimmed)
    if (obj && typeof obj === 'object') {
      for (const key of KNOWN_KEYS) {
        if (typeof obj[key] === 'number') return obj[key]
      }
      for (const v of Object.values(obj)) {
        if (typeof v === 'number') return v
      }
    }
  } catch {
    // 무시하고 null 반환
  }

  return null
}
