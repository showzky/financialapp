import React from 'react'

type SurplusSensorProps = {
  totalPocketMoney: number // in cents
}

export const SurplusSensor: React.FC<SurplusSensorProps> = ({ totalPocketMoney }) => {
  return (
    <div className="obsidian-card h-full">
      <div className="mb-6 flex items-center gap-2">
        <span className="obsidian-dot animate-pulse-slow bg-[#5ebd97]" />
        <h3 className="obsidian-kicker m-0">
          Surplus Sensor
        </h3>
      </div>

      <div className="text-center">
        <span className="mb-2 block text-[0.65rem] uppercase tracking-[0.14em] text-[#6b6862]">
          Total Pocket Money
        </span>
        <span className="obsidian-metric block text-[2rem] text-[#f0ede8] [text-shadow:0_0_14px_rgba(94,189,151,0.18)]">
          <span className="hud-currency">KR</span>
          {Math.floor(totalPocketMoney / 100)}
        </span>
      </div>
    </div>
  )
}
