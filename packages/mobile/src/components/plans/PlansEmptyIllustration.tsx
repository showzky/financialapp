import React from 'react'
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg'

type Props = {
  width?: number
  height?: number
}

export function PlansEmptyIllustration({ width = 220, height = 170 }: Props) {
  return (
    <Svg width={width} height={height} viewBox="0 0 220 170" fill="none">
      <Ellipse cx="110" cy="146" rx="66" ry="10" fill="rgba(255,255,255,0.05)" />
      <Path
        d="M34 87C34 58 57 36 86 36H132C161 36 184 58 184 87C184 114 164 136 138 138H83C56 138 34 115 34 87Z"
        fill="#3A3E4C"
      />
      <Path
        d="M72 60C72 55.5817 75.5817 52 80 52H140C144.418 52 148 55.5817 148 60V104C148 108.418 144.418 112 140 112H80C75.5817 112 72 108.418 72 104V60Z"
        fill="#555A69"
      />
      <Rect x="82" y="64" width="56" height="36" rx="8" fill="#6D7385" />
      <Path
        d="M92 81L104 92L128 69"
        stroke="#A9C8FF"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="58" cy="115" r="18" fill="#2A2E39" />
      <Circle cx="164" cy="118" r="18" fill="#2A2E39" />
      <Path d="M50 112H66" stroke="#F1F4FB" strokeWidth="4" strokeLinecap="round" />
      <Path d="M158 118H170" stroke="#F1F4FB" strokeWidth="4" strokeLinecap="round" />
      <Circle cx="48" cy="78" r="11" fill="#678CFF" fillOpacity="0.28" />
      <Circle cx="173" cy="63" r="8" fill="#7B52DC" fillOpacity="0.26" />
    </Svg>
  )
}
