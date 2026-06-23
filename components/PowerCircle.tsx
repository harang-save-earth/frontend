'use client'

import { useEffect, useRef } from 'react'
import styled from '@emotion/styled'
import gsap from 'gsap'

const Orb = styled.div`
  position: relative;
  width: 320px;
  height: 320px;
  border-radius: 9999px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  /* Atmospheric pastel orb — decoration only, no saturated accent */
  background:
    radial-gradient(circle at 36% 28%, rgba(168, 200, 232, 0.55), transparent 58%),
    radial-gradient(circle at 72% 76%, rgba(167, 229, 211, 0.45), transparent 56%),
    var(--surface-card);
  border: 1px solid var(--hairline-strong);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);

  @media (max-width: 640px) {
    width: 260px;
    height: 260px;
  }
`

const ValueText = styled.span`
  font-family: var(--font-serif);
  font-weight: 400;
  font-size: 88px;
  line-height: 1;
  letter-spacing: -1.92px;
  color: var(--ink);
  font-variant-numeric: tabular-nums;

  @media (max-width: 640px) {
    font-size: 64px;
  }
`

const Unit = styled.span`
  margin-top: 14px;
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.96px;
  text-transform: uppercase;
  color: var(--muted);
`

export function PowerCircle({ value }: { value: number | null }) {
  const orbRef = useRef<HTMLDivElement>(null)
  const numberRef = useRef<HTMLSpanElement>(null)
  const prev = useRef(0)

  useEffect(() => {
    if (value === null || !numberRef.current) return

    // 숫자 카운트업
    const obj = { n: prev.current }
    const countupTween = gsap.to(obj, {
      n: value,
      duration: 0.8,
      ease: 'power2.out',
      onUpdate: () => {
        if (numberRef.current) {
          numberRef.current.textContent = obj.n.toFixed(1)
        }
      },
    })
    prev.current = value

    // 수신 시 오브가 은은하게 피어오름 (조용한 분위기 효과)
    const bloomTween = orbRef.current
      ? gsap.fromTo(
          orbRef.current,
          { scale: 1 },
          { scale: 1.015, duration: 0.45, yoyo: true, repeat: 1, ease: 'sine.inOut' }
        )
      : null

    return () => {
      countupTween.kill()
      bloomTween?.kill()
    }
  }, [value])

  return (
    <Orb ref={orbRef}>
      <ValueText ref={numberRef}>{value === null ? '—' : value.toFixed(1)}</ValueText>
      <Unit>Wh</Unit>
    </Orb>
  )
}
