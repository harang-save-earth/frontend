'use client'

import styled from '@emotion/styled'
import { useMqttPower, type ConnectionStatus } from '@/hooks/useMqttPower'
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
