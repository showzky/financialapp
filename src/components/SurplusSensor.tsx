import React from 'react'

type SurplusSensorProps = {
  totalPocketMoney: number // in cents
}

export const SurplusSensor: React.FC<SurplusSensorProps> = ({ totalPocketMoney }) => {
  return (
    <div className="hud-glass-card">
      <div className="flex items-center gap-2 mb-6">
        <span className="hud-status-dot animate-pulse-slow bg-green-400" />
        <h3 className="text-[0.7rem] uppercase tracking-[0.15em] text-[var(--color-text-muted)] m-0">
          Surplus Sensor
        </h3>
      </div>

      <div className="text-center">
        <span className="hud-label block">Total Pocket Money</span>
        <span className="hud-value hud-monospaced hud-glow text-[2rem] text-white">
          <span className="hud-currency">KR</span>
          {Math.floor(totalPocketMoney / 100)}
        </span>
      </div>
    </div>
  )
}
