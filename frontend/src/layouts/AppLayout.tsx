import { Outlet } from 'react-router-dom'
import BottomNav from '../components/BottomNav'

export default function AppLayout() {
  return (
    <div className="relative min-h-[100dvh] bg-bg-deep text-gray-200 overflow-hidden">
      {/* RGB 呼吸发光背景 */}
      <div className="pointer-events-none fixed inset-0 z-0">
        {/* 顶部主光晕 */}
        <div
          className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full animate-breath"
          style={{
            background:
              'radial-gradient(circle, rgba(59,130,246,0.35) 0%, rgba(59,130,246,0.12) 40%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
        {/* 辅助光晕 */}
        <div
          className="absolute top-20 -left-20 w-[300px] h-[300px] rounded-full opacity-40 animate-breath"
          style={{
            background:
              'radial-gradient(circle, rgba(96,165,250,0.25) 0%, transparent 70%)',
            filter: 'blur(30px)',
            animationDelay: '1s',
          }}
        />
        <div
          className="absolute top-40 -right-20 w-[280px] h-[280px] rounded-full opacity-30 animate-breath"
          style={{
            background:
              'radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)',
            filter: 'blur(30px)',
            animationDelay: '2s',
          }}
        />
      </div>

      {/* 主内容区 */}
      <div className="relative z-10 mx-auto max-w-[480px] min-h-[100dvh] pb-24">
        <Outlet />
      </div>

      {/* 底部导航 */}
      <BottomNav />
    </div>
  )
}
