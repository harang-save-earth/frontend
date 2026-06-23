import { describe, it, expect } from 'vitest'
import { parsePower } from './parsePower'

describe('parsePower', () => {
  it('parses plain number string', () => {
    expect(parsePower('3')).toBe(3)
    expect(parsePower('3.5')).toBe(3.5)
  })
  it('parses JSON with known key', () => {
    expect(parsePower('{"power": 12.5}')).toBe(12.5)
    expect(parsePower('{"wh": 7}')).toBe(7)
    expect(parsePower('{"value": 9}')).toBe(9)
  })
  it('falls back to first numeric field in JSON', () => {
    expect(parsePower('{"foo": 4}')).toBe(4)
  })
  it('returns null for unparseable input', () => {
    expect(parsePower('abc')).toBeNull()
    expect(parsePower('{"foo": "bar"}')).toBeNull()
  })
})
