# 실시간 전력 사용량 표시 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** HiveMQ Cloud에서 WSS로 수신한 전력 사용량(Wh)을 Next.js 화면에 원형 위젯으로 실시간 표시한다.

**Architecture:** Next.js App Router 클라이언트 컴포넌트에서 mqtt.js로 HiveMQ에 WSS 직결. 커스텀 훅 `useMqttPower`가 연결/구독/파싱/상태를 담당하고, `PowerCircle`이 GSAP으로 값을 표시한다.

**Tech Stack:** Next.js (App Router, TS), mqtt.js, @emotion/react, GSAP, Material Icons

## Global Constraints

- 연결 URL: `wss://<host>:8884/mqtt`, 토픽 `hanbat/power/316`, QoS 0
- 자격증명은 `.env.local`에 `NEXT_PUBLIC_` 접두사로 보관, 코드 하드코딩 금지
- 페이로드 형식 미확정: 숫자 직접 파싱 → JSON 숫자 필드 추출 → 실패 시 `console.warn` + 직전 값 유지
- 값 미수신 시 `--` 표시

---

### Task 1: 프로젝트 스캐폴딩 및 의존성

**Files:**
- Create: `package.json`, `next.config.mjs`, `tsconfig.json`, `app/layout.tsx`, `app/page.tsx`, `.env.local`, `.env.example`

**Interfaces:**
- Produces: 실행 가능한 Next.js 앱 (`npm run dev`)

- [ ] **Step 1: Next 앱 생성**

```bash
cd /Users/eunsik/Desktop/Dev/save_earth
npx create-next-app@latest . --typescript --app --no-tailwind --no-src-dir --no-eslint --import-alias "@/*" --use-npm --yes
```

- [ ] **Step 2: 의존성 설치**

```bash
npm install mqtt @emotion/react @emotion/styled gsap
```

- [ ] **Step 3: `.env.local` 및 `.env.example` 작성**

`.env.local`:
```
NEXT_PUBLIC_MQTT_HOST=b942a27d63114572a40e60961a18fc58.s1.eu.hivemq.cloud
NEXT_PUBLIC_MQTT_PORT=8884
NEXT_PUBLIC_MQTT_USERNAME=test1
NEXT_PUBLIC_MQTT_PASSWORD=Test1123
NEXT_PUBLIC_MQTT_TOPIC=hanbat/power/316
```

`.env.example` (값 비움):
```
NEXT_PUBLIC_MQTT_HOST=
NEXT_PUBLIC_MQTT_PORT=8884
NEXT_PUBLIC_MQTT_USERNAME=
NEXT_PUBLIC_MQTT_PASSWORD=
NEXT_PUBLIC_MQTT_TOPIC=hanbat/power/316
```

- [ ] **Step 4: Material Icons 폰트를 `app/layout.tsx`에 추가**

`<head>`에 추가:
```html
<link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />
```

- [ ] **Step 5: 개발 서버 기동 확인**

Run: `npm run dev`
Expected: `http://localhost:3000` 200 응답, 콘솔 에러 없음

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: scaffold next app with deps and env"
```

---

### Task 2: 페이로드 파서 (`lib/parsePower.ts`)

**Files:**
- Create: `lib/parsePower.ts`
- Test: `lib/parsePower.test.ts`

**Interfaces:**
- Produces: `parsePower(raw: string): number | null`

- [ ] **Step 1: 실패 테스트 작성**

`lib/parsePower.test.ts`:
```ts
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
```

- [ ] **Step 2: vitest 설치 및 테스트 실패 확인**

```bash
npm install -D vitest
```
Run: `npx vitest run lib/parsePower.test.ts`
Expected: FAIL ("parsePower" not defined)

- [ ] **Step 3: 구현 작성**

`lib/parsePower.ts`:
```ts
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
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run lib/parsePower.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add robust power payload parser"
```

---

### Task 3: MQTT 훅 (`hooks/useMqttPower.ts`)

**Files:**
- Create: `hooks/useMqttPower.ts`

**Interfaces:**
- Consumes: `parsePower(raw: string): number | null`
- Produces: `useMqttPower(): { value: number | null; status: ConnectionStatus; raw: string | null }`
  - `type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'error' | 'closed'`

- [ ] **Step 1: 훅 구현 작성**

`hooks/useMqttPower.ts`:
```ts
'use client'

import { useEffect, useState } from 'react'
import mqtt from 'mqtt'
import { parsePower } from '@/lib/parsePower'

export type ConnectionStatus =
  | 'connecting' | 'connected' | 'reconnecting' | 'error' | 'closed'

export function useMqttPower() {
  const [value, setValue] = useState<number | null>(null)
  const [raw, setRaw] = useState<string | null>(null)
  const [status, setStatus] = useState<ConnectionStatus>('connecting')

  useEffect(() => {
    const host = process.env.NEXT_PUBLIC_MQTT_HOST
    const port = process.env.NEXT_PUBLIC_MQTT_PORT
    const topic = process.env.NEXT_PUBLIC_MQTT_TOPIC as string
    const url = `wss://${host}:${port}/mqtt`

    const client = mqtt.connect(url, {
      username: process.env.NEXT_PUBLIC_MQTT_USERNAME,
      password: process.env.NEXT_PUBLIC_MQTT_PASSWORD,
      protocolVersion: 5,
      reconnectPeriod: 3000,
    })

    client.on('connect', () => {
      setStatus('connected')
      client.subscribe(topic, { qos: 0 })
    })
    client.on('reconnect', () => setStatus('reconnecting'))
    client.on('close', () => setStatus('closed'))
    client.on('error', (err) => {
      console.error('MQTT error', err)
      setStatus('error')
    })
    client.on('message', (_t, payload) => {
      const text = payload.toString()
      setRaw(text)
      const parsed = parsePower(text)
      if (parsed === null) {
        console.warn('파싱 실패, 원본:', text)
        return
      }
      setValue(parsed)
    })

    return () => {
      client.end(true)
    }
  }, [])

  return { value, status, raw }
}
```

- [ ] **Step 2: 타입 체크 통과 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: add useMqttPower hook"
```

---

### Task 4: PowerCircle 컴포넌트 (`components/PowerCircle.tsx`)

**Files:**
- Create: `components/PowerCircle.tsx`

**Interfaces:**
- Consumes: 없음 (props로 `value` 수신)
- Produces: `PowerCircle({ value }: { value: number | null })`

- [ ] **Step 1: 컴포넌트 구현 작성**

`components/PowerCircle.tsx`:
```tsx
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
```

- [ ] **Step 2: 타입 체크 통과 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: add PowerCircle with gsap countup and pulse"
```

---

### Task 5: 페이지 조립 (`app/page.tsx`)

**Files:**
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `useMqttPower()`, `PowerCircle`

- [ ] **Step 1: 페이지 작성**

`app/page.tsx`:
```tsx
'use client'

import styled from '@emotion/styled'
import { useMqttPower, ConnectionStatus } from '@/hooks/useMqttPower'
import { PowerCircle } from '@/components/PowerCircle'

const Main = styled.main`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 32px;
  background: #0d1117;
`

const Title = styled.h1`
  color: #fff;
  font-size: 28px;
  font-weight: 600;
`

const Status = styled.div<{ color: string }>`
  display: flex;
  align-items: center;
  gap: 6px;
  color: ${(p) => p.color};
  font-size: 14px;
`

const STATUS_META: Record<ConnectionStatus, { icon: string; color: string; label: string }> = {
  connecting: { icon: 'sync', color: '#d29922', label: '연결 중' },
  connected: { icon: 'check_circle', color: '#3fb950', label: '연결됨' },
  reconnecting: { icon: 'sync', color: '#d29922', label: '재연결 중' },
  error: { icon: 'error', color: '#f85149', label: '오류' },
  closed: { icon: 'cancel', color: '#8b949e', label: '연결 끊김' },
}

export default function Home() {
  const { value, status } = useMqttPower()
  const meta = STATUS_META[status]

  return (
    <Main>
      <Title>실시간 전력 사용량</Title>
      <PowerCircle value={value} />
      <Status color={meta.color}>
        <span className="material-icons">{meta.icon}</span>
        {meta.label}
      </Status>
    </Main>
  )
}
```

- [ ] **Step 2: 개발 서버에서 동작 확인**

Run: `npm run dev`
Expected: "실시간 전력 사용량" + 원, 상태 "연결됨", HiveMQ에서 publish 시 원 안 숫자가 변경되고 펄스 애니메이션 동작

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: assemble realtime power page"
```

---

## Self-Review

- **Spec coverage:** 연결정보(T1/T3), env.local(T1), 파싱전략(T2), 훅(T3), PowerCircle GSAP 카운트업+펄스(T4), 페이지 텍스트+원+상태아이콘(T5) — 모두 커버.
- **Placeholder scan:** 없음.
- **Type consistency:** `ConnectionStatus`, `parsePower`, `useMqttPower`, `PowerCircle` 시그니처 태스크 간 일치.
