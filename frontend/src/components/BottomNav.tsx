import { NavLink } from 'react-router-dom'
import { Package, MessageCircle, Store, Users, Settings } from 'lucide-react'

const tabs = [
  { to: '/tutorials', label: '我的模型', icon: Package },
  { to: '/guide', label: '教程', icon: MessageCircle },
  { to: '/store', label: '商店', icon: Store },
  { to: '/community', label: '社区', icon: Users },
  { to: '/settings', label: '设置', icon: Settings },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center">
      <div className="frosted-glass-strong w-full max-w-[480px] flex items-stretch px-1 py-2 rounded-t-2xl pb-[env(safe-area-inset-bottom)]">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center justify-center gap-1 py-1.5 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'text-accent-blue-light'
                    : 'text-gray-500 hover:text-gray-300'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={21}
                    strokeWidth={isActive ? 2.2 : 1.8}
                    className={isActive ? 'drop-shadow-[0_0_6px_rgba(96,165,250,0.6)]' : ''}
                  />
                  <span className="text-[10px] font-medium">{tab.label}</span>
                </>
              )}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
