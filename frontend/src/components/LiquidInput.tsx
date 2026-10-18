import { Send } from 'lucide-react'

interface Props {
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  placeholder?: string
  loading?: boolean
}

/**
 * 液态玻璃输入栏
 * - 半透明渐变玻璃质感 + 内高光
 * - 两个光源点围绕边框旋转（锥形渐变 + 环形遮罩），光点经过处边框被微微点亮
 */
export default function LiquidInput({
  value,
  onChange,
  onSubmit,
  placeholder = '问问导师...',
  loading,
}: Props) {
  return (
    <div className="liquid-glass relative rounded-full flex items-center pl-4 pr-1.5 py-1.5">
      {/* 流光层：两个光源点绕边框公转，照亮扫过的一小段边框 */}
      <div className="liquid-border-glow absolute inset-0 rounded-full pointer-events-none" aria-hidden="true" />

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
        placeholder={placeholder}
        className="flex-1 min-w-0 bg-transparent outline-none text-sm text-white placeholder-gray-500"
      />
      <button
        onClick={onSubmit}
        disabled={loading || !value.trim()}
        className="w-9 h-9 rounded-full bg-accent-blue flex items-center justify-center text-white disabled:opacity-40 transition-all hover:shadow-[0_0_12px_rgba(59,130,246,0.5)] flex-shrink-0"
      >
        <Send size={16} />
      </button>
    </div>
  )
}
