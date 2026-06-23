'use client'

import { useEffect, useRef } from 'react'
import styled from '@emotion/styled'
import gsap from 'gsap'

const Circle = styled.div`
  width: 260px;
  height: 260px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at 50% 30%, #1f6feb33, #0d1117);
  border: 2px solid #1f6feb;
  box-shadow: 0 0 40px #1f6feb55;
`

const Number = styled.span`
  font-size: 64px;
  font-weight: 700;
  color: #fff;
  line-height: 1;
`

const Unit = styled.span`
  margin-top: 8px;
  font-size: 20px;
  color: #8b949e;
`

export function PowerCircle({ value }: { value: number | null }) {
  const circleRef = useRef<HTMLDivElement>(null)
  const numberRef = useRef<HTMLSpanElement>(null)
  const prev = useRef(0)

  useEffect(() => {
    if (value === null || !numberRef.current) return

    // 숫자 카운트업
    const obj = { n: prev.current }
    gsap.to(obj, {
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

    // 수신 시 원 펄스
    if (circleRef.current) {
      gsap.fromTo(
        circleRef.current,
        { scale: 1 },
        { scale: 1.06, duration: 0.2, yoyo: true, repeat: 1, ease: 'power1.inOut' }
      )
    }
  }, [value])

  return (
    <Circle ref={circleRef}>
      <Number ref={numberRef}>{value === null ? '--' : value.toFixed(1)}</Number>
      <Unit>Wh</Unit>
    </Circle>
  )
}
