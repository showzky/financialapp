import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Dimensions, StyleSheet, Text, View } from 'react-native'
import Svg, { Circle, G, Line, Path, Text as SvgText } from 'react-native-svg'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDecay,
} from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'
import type { FinancialAccount } from './types'

const SCREEN_W = Dimensions.get('window').width
const SIZE = Math.min(SCREEN_W - 16, 316)
const CX = SIZE / 2
const CY = SIZE / 2
const OUTER_R = SIZE * 0.375
const INNER_R = SIZE * 0.235
const GAP_DEG = 2.5
const FILL_DURATION = 1100

function polar(r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) }
}

function arcPath(outerR: number, innerR: number, startDeg: number, endDeg: number): string {
  const span = endDeg - startDeg
  if (span <= 0) return ''
  const clamped = Math.min(span, 359.99)
  const o1 = polar(outerR, startDeg)
  const o2 = polar(outerR, startDeg + clamped)
  const i2 = polar(innerR, startDeg + clamped)
  const i1 = polar(innerR, startDeg)
  const large = clamped > 180 ? 1 : 0
  return (
    `M ${o1.x} ${o1.y} ` +
    `A ${outerR} ${outerR} 0 ${large} 1 ${o2.x} ${o2.y} ` +
    `L ${i2.x} ${i2.y} ` +
    `A ${innerR} ${innerR} 0 ${large} 0 ${i1.x} ${i1.y} Z`
  )
}

const formatTotal = (v: number) =>
  `${v < 0 ? '-' : ''}kr ${Math.abs(v).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

type SegmentData = {
  globalStart: number
  fullSweep: number
  color: string
  lineP1: { x: number; y: number }
  lineP2: { x: number; y: number }
  labelPt: { x: number; y: number }
  name: string
  showLabel: boolean
}

type Props = {
  accounts: FinancialAccount[]
}

export function BalanceDonutChart({ accounts }: Props) {
  // ─── Spin gesture ──────────────────────────────────────────────────────────
  const rotation = useSharedValue(0)
  const prevAngle = useSharedValue(0)

  const pan = Gesture.Pan()
    .onBegin((e) => {
      prevAngle.value = Math.atan2(e.y - CY, e.x - CX) * (180 / Math.PI)
    })
    .onUpdate((e) => {
      const cur = Math.atan2(e.y - CY, e.x - CX) * (180 / Math.PI)
      let delta = cur - prevAngle.value
      if (delta > 180) delta -= 360
      if (delta < -180) delta += 360
      rotation.value += delta
      prevAngle.value = cur
    })
    .onEnd((e) => {
      const dx = e.x - CX
      const dy = e.y - CY
      const r = Math.sqrt(dx * dx + dy * dy) || 1
      const angVelDeg = ((e.velocityX * dy - e.velocityY * dx) / (r * r)) * (180 / Math.PI)
      rotation.value = withDecay({ velocity: angVelDeg, deceleration: 0.993 })
    })

  const rotStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }))

  // ─── Segment geometry (static, not animated) ──────────────────────────────
  const segments = useMemo<SegmentData[]>(() => {
    const absSum = accounts.reduce((s, a) => s + Math.abs(a.amount), 0)
    if (absSum === 0 || accounts.length === 0) return []

    let cursor = 0
    return accounts.map((acc) => {
      const frac = Math.abs(acc.amount) / absSum
      const sweep = Math.max(frac * 360 - GAP_DEG, 0.5)
      const start = cursor
      const mid = start + sweep / 2
      cursor += frac * 360

      return {
        globalStart: start,
        fullSweep: sweep,
        color: acc.color || '#5DA2FF',
        lineP1: polar(OUTER_R + 5, mid),
        lineP2: polar(OUTER_R + 17, mid),
        labelPt: polar(OUTER_R + 30, mid),
        name: acc.name,
        showLabel: frac > 0.04,
      }
    })
  }, [accounts])

  // ─── JS-driven fill + counter animation ────────────────────────────────────
  const total = useMemo(() => accounts.reduce((s, a) => s + a.amount, 0), [accounts])
  const [progress, setProgress] = useState(0)
  const [displayedTotal, setDisplayedTotal] = useState(0)
  const rafRef = useRef<number | null>(null)
  const accountsKey = accounts.map((a) => a.id).join(',')

  useEffect(() => {
    const start = performance.now()

    const tick = (now: number) => {
      const elapsed = now - start
      const t = Math.min(elapsed / FILL_DURATION, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setProgress(eased)
      setDisplayedTotal(total * eased)
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }

    setProgress(0)
    setDisplayedTotal(0)
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [total, accountsKey])

  // Build visible arc paths clipped to current progress
  const revealDeg = progress * 360
  const visiblePaths = segments.map((seg) => {
    if (revealDeg <= seg.globalStart) return ''
    const visibleSweep = Math.min(revealDeg - seg.globalStart, seg.fullSweep)
    if (visibleSweep <= 0) return ''
    return arcPath(OUTER_R, INNER_R, seg.globalStart, seg.globalStart + visibleSweep)
  })

  if (accounts.length === 0) return null

  return (
    <View style={styles.outerWrap}>
      <GestureDetector gesture={pan}>
        <Animated.View style={[{ width: SIZE, height: SIZE }, rotStyle]}>
          <Svg width={SIZE} height={SIZE}>
            {/* track ring */}
            <Circle cx={CX} cy={CY} r={(OUTER_R + INNER_R) / 2} fill="none"
              stroke="rgba(255,255,255,0.04)" strokeWidth={OUTER_R - INNER_R} />
            {/* dark center */}
            <Circle cx={CX} cy={CY} r={INNER_R - 1} fill="#0A0A0E" />
            {segments.map((seg, i) =>
              visiblePaths[i] ? (
                <Path key={i} d={visiblePaths[i]} fill={seg.color} />
              ) : null,
            )}
            {segments.map(
              (seg, i) =>
                seg.showLabel && (
                  <G key={`lbl${i}`}>
                    <Line
                      x1={seg.lineP1.x} y1={seg.lineP1.y}
                      x2={seg.lineP2.x} y2={seg.lineP2.y}
                      stroke="rgba(200,214,240,0.38)" strokeWidth={1.2}
                    />
                    <SvgText
                      x={seg.labelPt.x} y={seg.labelPt.y + 3.5}
                      fill="rgba(212,224,248,0.78)" fontSize={9} textAnchor="middle"
                    >
                      {seg.name}
                    </SvgText>
                  </G>
                ),
            )}
          </Svg>
        </Animated.View>
      </GestureDetector>

      {/* center label — does not rotate */}
      <View style={styles.center} pointerEvents="none">
        <View style={styles.modePill}>
          <Text style={styles.modeLabel}>Balance</Text>
          <Ionicons name="chevron-down" size={11} color="rgba(218,228,255,0.55)" />
        </View>
        <Text style={styles.totalText} numberOfLines={1} adjustsFontSizeToFit>
          {formatTotal(displayedTotal)}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  outerWrap: {
    alignSelf: 'center',
    width: SIZE,
    height: SIZE,
    marginTop: 10,
    marginBottom: 16,
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  modePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(24,28,42,0.92)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  modeLabel: {
    color: 'rgba(222,230,255,0.72)',
    fontSize: 13,
    fontFamily: 'DMSans_600SemiBold',
  },
  totalText: {
    color: '#EEF2FB',
    fontSize: 22,
    fontFamily: 'DMSans_700Bold',
    textAlign: 'center',
    maxWidth: INNER_R * 1.75,
  },
})

