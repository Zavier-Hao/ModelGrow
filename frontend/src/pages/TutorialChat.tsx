import { useState, useRef, useEffect } from 'react'
import { MessageCircle, Bot } from 'lucide-react'
import { guideChat } from '../lib/api'
import VideoRecommend from '../components/VideoRecommend'
import MarkdownText from '../components/MarkdownText'
import LiquidInput from '../components/LiquidInput'
import TypingBubble from '../components/TypingBubble'

interface Msg {
  role: 'user' | 'ai'
  text: string
  keywords?: string[]
}

const SUGGESTIONS = [
  '推荐一个入门模型',
  '做旧有哪些技法？',
  '新手需要买哪些工具？',
  '水口发白怎么处理？',
]

export default function TutorialChat() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'ai', text: '你好！我是你的模型制作导师。可以问我任何关于模型制作的问题，比如推荐模型、工具选购、技法讲解等。' },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = async (text?: string) => {
    const q = (text ?? input).trim()
    if (!q || loading) return
    setMessages((m) => [...m, { role: 'user', text: q }])
    setInput('')
    setLoading(true)
    try {
      const res = await guideChat(q)
      if (res.success) {
        setMessages((m) => [...m, { role: 'ai', text: res.data.answer, keywords: res.data.keywords }])
      } else {
        setMessages((m) => [...m, { role: 'ai', text: '抱歉，出了点问题，请稍后再试' }])
      }
    } catch {
      setMessages((m) => [...m, { role: 'ai', text: '网络错误，请稍后重试' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    // 弹性布局：负 margin 抵消 AppLayout 全局 pb-24 的底部预留（本页自管底部间距）；
    // 消息列表延伸到屏幕底部，可从悬浮输入栏后方滚过（磨砂透视）
    <div className="relative flex flex-col h-[100dvh] -mb-24 animate-fade-in">
      {/* 头部 */}
      <div className="px-4 pt-6 pb-3 flex items-center gap-2 flex-shrink-0">
        <MessageCircle className="text-accent-blue-light" size={22} />
        <h1 className="text-2xl font-bold text-white">教程</h1>
      </div>

      {/* 消息列表（底部留出输入栏悬浮空间，内容可滚入其后方） */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-[7rem] space-y-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex flex-col ${
              m.role === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <div className={`flex gap-2 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              {m.role === 'ai' && (
                <div className="w-8 h-8 rounded-full bg-accent-blue/20 flex items-center justify-center flex-shrink-0">
                  <Bot size={18} className="text-accent-blue-light" />
                </div>
              )}
              <div
                className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-accent-blue text-white rounded-br-sm whitespace-pre-wrap break-words'
                    : 'frosted-glass text-gray-200 rounded-bl-sm'
                }`}
              >
                {m.role === 'ai' ? <MarkdownText content={m.text} /> : m.text}
              </div>
            </div>
            {m.role === 'ai' && m.keywords && (
              <div className="ml-10 w-full">
                <VideoRecommend keywords={m.keywords} />
              </div>
            )}
          </div>
        ))}
        {loading && <TypingBubble />}
        {/* 快捷建议（仅初始时展示，随消息流滚动） */}
        {messages.length <= 1 && (
          <div className="pt-2">
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="frosted-glass px-3 py-1.5 rounded-full text-xs text-gray-300 hover:text-white hover:bg-white/5"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* 悬浮输入栏：无背景条，液态玻璃胶囊贴在底部导航上方 ~6px */}
      <div className="absolute left-0 right-0 bottom-[calc(4.1875rem+env(safe-area-inset-bottom))] px-4">
        <LiquidInput value={input} onChange={setInput} onSubmit={() => send()} loading={loading} />
      </div>
    </div>
  )
}
