# 실시간 전력 사용량 표시 - 설계 문서

작성일: 2026-06-23

## 목적

HiveMQ Cloud MQTT 브로커에서 전력 사용량 데이터를 WebSocket(WSS)으로 실시간 수신하여, 화면에 현재 사용량(Wh)을 원형 위젯으로 표시한다.

## 연결 정보

- 브로커: `b942a27d63114572a40e60961a18fc58.s1.eu.hivemq.cloud`
- 포트: `8884` (WSS WebSocket)
- 연결 URL: `wss://<host>:8884/mqtt`
- 인증: username / password (`.env.local`에 보관, 코드 하드코딩 금지)
- 구독 토픽: `hanbat/power/316`
- QoS: 0

## 기술 스택

- Next.js (App Router) + TypeScript
- `mqtt` (mqtt.js) — 브라우저에서 WSS 직결
- `@emotion/react` (styled) — 스타일링
- GSAP — 애니메이션
- Material Icons (웹폰트) — 연결 상태 아이콘

## 컴포넌트 구조

### `useMqttPower` (커스텀 훅)
- 책임: MQTT 연결/구독/메시지 파싱, 상태 관리
- 반환: `{ value: number | null, status: ConnectionStatus, raw: string | null }`
- `ConnectionStatus`: `'connecting' | 'connected' | 'reconnecting' | 'error' | 'closed'`
- 마운트 시 연결, 언마운트 시 정리(`client.end()`)
- mqtt.js 기본 자동 재연결 사용

### 페이로드 파싱 전략 (형식 미확정 대응)
1. 숫자 직접 파싱 시도 (`"3"`, `"3.5"`)
2. 실패 시 JSON 파싱 후 숫자 필드 추출 (키 우선순위: `power`, `wh`, `value`, `w` → 그 외 첫 숫자값)
3. 그래도 실패하면 원본을 `console.warn`으로 로깅, 화면은 직전 값 유지

### `PowerCircle` (컴포넌트)
- 책임: 원 + 내부 Wh 숫자 표시
- props: `value: number | null`
- GSAP: 값 변경 시 이전 값 → 새 값 카운트업, 수신 시 원 펄스(scale/glow)
- 값이 `null`이면 `--` 표시

### 페이지 (`app/page.tsx`)
- "실시간 전력 사용량" 텍스트(상단)
- `PowerCircle`
- 연결 상태 표시: Material Icon + 색상 (connected=초록, error=빨강, connecting/reconnecting=노랑)

## 데이터 흐름

```
HiveMQ ──WSS──> mqtt.js ──> useMqttPower(state) ──> PowerCircle ──GSAP──> 화면
```

## 에러 처리

- 연결 실패/끊김: 상태 아이콘으로 표시, 자동 재연결
- 파싱 실패: 콘솔 경고 + 직전 값 유지
- 값 수신 전: `--` 표시

## 환경 변수 (`.env.local`)

```
NEXT_PUBLIC_MQTT_HOST=b942a27d63114572a40e60961a18fc58.s1.eu.hivemq.cloud
NEXT_PUBLIC_MQTT_PORT=8884
NEXT_PUBLIC_MQTT_USERNAME=test1
NEXT_PUBLIC_MQTT_PASSWORD=Test1123
NEXT_PUBLIC_MQTT_TOPIC=hanbat/power/316
```

> 참고: 브라우저 직결 구조상 `NEXT_PUBLIC_` 접두사가 필요하며, 자격증명이 클라이언트 번들에 포함된다. 데모용 한정이며, 운영 시에는 서버 프록시를 권장.

## 범위 밖 (YAGNI)

- 히스토리/그래프
- 다중 토픽/다중 디바이스
- 데이터 영속화
- 인증 UI
