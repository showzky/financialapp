import React from 'react'
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg'

type Props = {
  width?: number
  height?: number
}

export function BalanceEmptyIllustration({ width = 260, height = 190 }: Props) {
  return (
    <Svg width={width} height={height} viewBox="0 0 260 190" fill="none">
      <Defs>
        <LinearGradient id="bgGlow" x1="130" y1="18" x2="130" y2="184" gradientUnits="userSpaceOnUse">
          <Stop stopColor="#7A53C4" stopOpacity="0.28" />
          <Stop offset="1" stopColor="#0D1017" stopOpacity="0" />
        </LinearGradient>
        <LinearGradient id="orb" x1="68" y1="64" x2="168" y2="164" gradientUnits="userSpaceOnUse">
          <Stop stopColor="#6AE2FF" stopOpacity="0.95" />
          <Stop offset="1" stopColor="#3D5CFF" stopOpacity="0.08" />
        </LinearGradient>
        <LinearGradient id="cardGrad" x1="90" y1="88" x2="212" y2="162" gradientUnits="userSpaceOnUse">
          <Stop stopColor="#1B2233" />
          <Stop offset="1" stopColor="#121726" />
        </LinearGradient>
        <LinearGradient id="coinGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop stopColor="#D8B760" />
          <Stop offset="1" stopColor="#9B7A2F" />
        </LinearGradient>
      </Defs>

      <Rect x="8" y="8" width="244" height="174" rx="34" fill="url(#bgGlow)" />

      <Ellipse cx="130" cy="136" rx="84" ry="22" fill="#0A0D14" opacity="0.6" />
      <Circle cx="138" cy="90" r="52" fill="url(#orb)" opacity="0.16" />
      <Circle cx="138" cy="90" r="46" stroke="#5FE4FF" strokeOpacity="0.18" strokeWidth="1.5" />
      <Path
        d="M56 110C90 72 150 60 208 84"
        stroke="#5FE4FF"
        strokeOpacity="0.38"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <Circle cx="208" cy="84" r="5" fill="#5FE4FF" />
      <Circle cx="56" cy="110" r="4" fill="#D8B760" />

      <G>
        <Rect x="92" y="72" width="104" height="70" rx="18" fill="url(#cardGrad)" />
        <Rect x="108" y="90" width="72" height="8" rx="4" fill="#2C3854" />
        <Rect x="108" y="106" width="48" height="8" rx="4" fill="#22304A" />
        <Rect x="108" y="122" width="58" height="8" rx="4" fill="#1E2840" />
        <Rect x="84" y="92" width="28" height="22" rx="8" fill="#0F1521" />
        <Path
          d="M90 104H106M90 99.5H106M93 96.5V101.5"
          stroke="#7ED6FF"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </G>

      <G opacity="0.92">
        <Circle cx="74" cy="142" r="15" fill="url(#coinGrad)" />
        <Circle cx="86" cy="148" r="15" fill="url(#coinGrad)" opacity="0.76" />
        <Path
          d="M70 142H78M74 138V146"
          stroke="#2A2110"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </G>

      <G opacity="0.9">
        <Circle cx="196" cy="134" r="14" fill="#151B29" />
        <Path
          d="M189 134H203M196 127V141"
          stroke="#BBD3FF"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </G>
    </Svg>
  )
}
