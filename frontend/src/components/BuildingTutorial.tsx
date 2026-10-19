import { useEffect, useState } from 'react'
import { Hammer } from 'lucide-react'

const STAGES = [
  '正在读取模型信息…',
  '正在规划分步流程…',
  '正在撰写教程内容…',
  '正在打磨细节，马上就好…',
]

/** 生成教程的中间态：轨道光点 + 分阶段文案 + 进度光条 */
export default function BuildingTutorial() {
  const [stage, setStage] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setStage((s) => Math.min(s + 1, STAGES.length - 1)), 5000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center py-24 select-none">
      {/* 中心：脉冲图标 + 两颗轨道光点 */}
      <div className="relative w-28 h-28 mb-8">
        <div className="absolute inset-0 rounded-full border border-white/10" />
        <div
          className="absolute inset-2.5 rounded-full frosted-glass flex items-center justify-center"
          style={{ animation: 'genPulse 2.4s ease-in-out infinite' }}
        >
          <Hammer size={30} className="text-accent-blue-light" />
        </div>
        <div className="absolute inset-0" style={{ animation: 'genOrbit 2.6s linear infinite' }}>
          <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-accent-blue shadow-[0_0_10px_rgba(59,130,246,0.9)]" />
        </div>
        <div className="absolute inset-3" style={{ animation: 'genOrbit 4.2s linear infinite reverse' }}>
          <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
        </div>
      </div>

      <p className="text-sm text-gray-200 font-medium mb-1.5">正在搭建教程中</p>
      <p key={stage} className="text-xs text-gray-500 h-4 animate-fade-in">
        {STAGES[stage]}
      </p>

      {/* 进度光条 */}
      <div className="w-48 h-1 rounded-full bg-white/10 overflow-hidden mt-6 relative">
        <span
          className="absolute top-0 h-full w-1/3 rounded-full bg-gradient-to-r from-transparent via-accent-blue to-transparent"
          style={{ animation: 'genBar 1.6s ease-in-out infinite' }}
        />
      </div>
    </div>
  )
}
