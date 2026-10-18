import { useEffect } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  footer?: React.ReactNode
}

export default function Modal({ open, onClose, title, children, footer }: Props) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center animate-fade-in pb-[calc(4.5rem+env(safe-area-inset-bottom))]">
      {/* 背景遮罩 - 模糊 */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* 弹窗主体 - 磨砂玻璃（悬浮在底部导航上方，不与其重叠） */}
      <div className="relative w-full max-w-[480px] frosted-glass-strong rounded-3xl p-5 animate-slide-up max-h-[68vh] overflow-y-auto">
        {title && (
          <h3 className="text-lg font-bold text-white mb-4 text-center">{title}</h3>
        )}
        {children}
        {footer && <div className="mt-5">{footer}</div>}
      </div>
    </div>
  )
}
