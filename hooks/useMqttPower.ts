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
