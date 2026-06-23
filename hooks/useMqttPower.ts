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
    // 환경 변수 검증 — 누락 시 연결 시도하지 않음
    const host = process.env.NEXT_PUBLIC_MQTT_HOST
    const port = process.env.NEXT_PUBLIC_MQTT_PORT
    const topic = process.env.NEXT_PUBLIC_MQTT_TOPIC
    if (!host || !port || !topic) {
      console.error('MQTT 환경 변수 누락: NEXT_PUBLIC_MQTT_HOST, NEXT_PUBLIC_MQTT_PORT, NEXT_PUBLIC_MQTT_TOPIC 를 확인하세요.')
      setStatus('error')
      return
    }

    const url = `wss://${host}:${port}/mqtt`

    // StrictMode 이중 실행 방어 플래그
    let destroyed = false

    const client = mqtt.connect(url, {
      username: process.env.NEXT_PUBLIC_MQTT_USERNAME,
      password: process.env.NEXT_PUBLIC_MQTT_PASSWORD,
      // protocolVersion 생략 → mqtt.js 기본값 MQTT 3.1.1 (HiveMQ Cloud 호환)
      reconnectPeriod: 3000,
    })

    client.on('connect', () => {
      if (destroyed) return
      setStatus('connected')
      client.subscribe(topic, { qos: 0 })
    })
    client.on('reconnect', () => {
      if (destroyed) return
      setStatus('reconnecting')
    })
    client.on('close', () => {
      if (destroyed) return
      setStatus('closed')
    })
    client.on('error', (err) => {
      if (destroyed) return
      console.error('MQTT error', err)
      setStatus('error')
    })
    client.on('message', (_t, payload) => {
      if (destroyed) return
      const text = payload.toString()
      const parsed = parsePower(text)
      if (parsed === null) {
        // 파싱 실패 시 raw/value 모두 이전 값 유지
        console.warn('파싱 실패, 원본:', text)
        return
      }
      // 파싱 성공 시에만 raw 와 value 를 함께 갱신
      setRaw(text)
      setValue(parsed)
    })

    return () => {
      destroyed = true
      client.end(true)
    }
  }, [])

  return { value, status, raw }
}
