'use client'

import styled from '@emotion/styled'
import { useMqttPower, type ConnectionStatus } from '@/hooks/useMqttPower'
import { PowerCircle } from '@/components/PowerCircle'

const Main = styled.main`
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 48px;
  background: var(--canvas);
  padding: 24px;
`

const Header = styled.header`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  text-align: center;
`

const Eyebrow = styled.span`
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: 0.96px;
  text-transform: uppercase;
  color: var(--muted);
`

const Title = styled.h1`
  margin: 0;
  font-family: var(--font-display);
  font-size: 48px;
  font-weight: 300;
  line-height: 1.08;
  letter-spacing: -0.96px;
  color: var(--ink);

  @media (max-width: 640px) {
    font-size: 32px;
  }
`

const StatusBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--surface-strong);
  border-radius: 9999px;
  padding: 6px 14px;
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.96px;
  text-transform: uppercase;
  color: var(--body);
`

const Dot = styled.span<{ $color: string }>`
  width: 7px;
  height: 7px;
  border-radius: 9999px;
  background: ${(p) => p.$color};
`

const STATUS_META: Record<ConnectionStatus, { color: string; label: string }> = {
  connecting: { color: 'var(--muted)', label: '연결 중' },
  connected: { color: 'var(--success)', label: '연결됨' },
  reconnecting: { color: 'var(--muted)', label: '재연결 중' },
  error: { color: 'var(--error)', label: '오류' },
  closed: { color: 'var(--muted-soft)', label: '연결 끊김' },
}

export default function Home() {
  const { value, status } = useMqttPower()
  const meta = STATUS_META[status]

  return (
    <Main>
      <Header>
        <Eyebrow>Live feed — No. 316</Eyebrow>
        <Title>실시간 전력 사용량</Title>
      </Header>
      <PowerCircle value={value} />
      <StatusBadge>
        <Dot $color={meta.color} />
        {meta.label}
      </StatusBadge>
    </Main>
  )
}
