import { useEffect, useState } from 'react'
import { Wrench } from 'lucide-react'

const LOGO_DURATION = 1400

interface Props {
  onFinish: () => void
}

export default function SplashScreen({ onFinish }: Props) {
  const [out, setOut] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setOut(true), LOGO_DURATION)
    const t2 = setTimeout(onFinish, LOGO_DURATION + 600)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [onFinish])

  return (
    <div
      className={`fixed inset-0 z-[100] bg-[#05050a] overflow-hidden flex items-center justify-center ${
        out ? 'animate-splash-out' : ''
      }`}
    >
      {/* 呼吸蓝光背景 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-accent-blue/20 blur-[100px] animate-breath" />
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 rounded-full bg-cyan-500/15 blur-[80px] animate-breath" style={{ animationDelay: '1.5s' }} />
      </div>

      {/* Logo 降噪显现 */}
      <div className="relative z-10 flex flex-col items-center animate-splash-logo">
        <div className="w-20 h-20 rounded-3xl bg-accent-blue/15 border border-accent-blue/40 flex items-center justify-center mb-4 shadow-[0_0_40px_rgba(59,130,246,0.4)]">
          <Wrench size={36} className="text-accent-blue-light" />
        </div>
        <h1 className="text-3xl font-bold text-white tracking-widest mb-2">ModelGrow</h1>
        <p className="text-xs text-gray-400 tracking-[0.35em]">让每一个模型，从零到一</p>
      </div>

      {/* 顶部装饰线 */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-blue/60 to-transparent" />
    </div>
  )
}
