import { useState, useRef } from 'react'
import { ChevronRight, Wrench, Lightbulb, AlertTriangle, Loader2, PlayCircle } from 'lucide-react'
import type { Tutorial, WorkGrade as WorkGradeResult } from '../lib/types'
import { chatStep } from '../lib/api'
import VideoRecommend from './VideoRecommend'
import MarkdownText from './MarkdownText'
import LiquidInput from './LiquidInput'
import WorkGrade from './WorkGrade'
import StepIllustration from './StepIllustration'

interface Props {
  tutorial: Tutorial
  onBack?: () => void
}

interface ChatMsg {
  role: 'user' | 'ai'
  text: string
  keywords?: string[]
}

export default function TutorialView({ tutorial, onBack }: Props) {
  const [activeStep, setActiveStep] = useState(0)
  const step = tutorial.steps[activeStep]
  const [messages, setMessages] = useState<Record<number, ChatMsg[]>>({})
  const [grades, setGrades] = useState<Record<number, WorkGradeResult>>({})
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const touchStart = useRef<{ x: number; y: number } | null>(null)

  const allTools = Array.from(new Set(tutorial.steps.flatMap((s) => s.tools)))

  // ---------- 左右滑动切换步骤 ----------
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0]
    touchStart.current = { x: t.clientX, y: t.clientY }
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return
    const t = e.changedTouches[0]
    const dx = t.clientX - touchStart.current.x
    const dy = t.clientY - touchStart.current.y
    touchStart.current = null
    // 水平位移足够大且明显大于纵向位移才判定为滑动（避免与页面纵向滚动冲突）
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return
    if (dx < 0 && activeStep < tutorial.steps.length - 1) {
      setActiveStep(activeStep + 1)
    } else if (dx > 0 && activeStep > 0) {
      setActiveStep(activeStep - 1)
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const q = input.trim()
    const stepMsgs = messages[activeStep] || []
    setMessages({ ...messages, [activeStep]: [...stepMsgs, { role: 'user', text: q }] })
    setInput('')
    setLoading(true)
    try {
      const res = await chatStep(q, step.name, tutorial.model_name)
      if (res.success) {
        setMessages((prev) => ({
          ...prev,
          [activeStep]: [
            ...(prev[activeStep] || []),
            { role: 'ai', text: res.data.answer, keywords: res.data.keywords },
          ],
        }))
      } else {
        setMessages((prev) => ({
          ...prev,
          [activeStep]: [...(prev[activeStep] || []), { role: 'ai', text: '抱歉，出了点问题，请稍后再试' }],
        }))
      }
    } catch {
      setMessages((prev) => ({
        ...prev,
        [activeStep]: [...(prev[activeStep] || []), { role: 'ai', text: '网络错误，请稍后重试' }],
      }))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade-in">
      {/* 头部 */}
      <div className="flex items-center gap-3 mb-5">
        {onBack && (
          <button
            onClick={onBack}
            className="frosted-glass w-9 h-9 rounded-full flex items-center justify-center text-gray-300 hover:text-white"
          >
            ←
          </button>
        )}
        <div>
          <h1 className="text-xl font-bold text-white">{tutorial.model_name}</h1>
          <p className="text-xs text-gray-400">{tutorial.category} · 分步教程</p>
        </div>
      </div>

      {/* 工具材料清单 */}
      <div className="frosted-glass rounded-2xl p-4 mb-5">
        <div className="flex items-center gap-2 text-accent-blue-light mb-2">
          <Wrench size={16} />
          <span className="text-sm font-semibold">工具材料清单</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {allTools.map((t, i) => (
            <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300">
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* 步骤切换器 */}
      <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
        {tutorial.steps.map((s, i) => (
          <button
            key={i}
            onClick={() => setActiveStep(i)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeStep === i
                ? 'bg-accent-blue text-white shadow-[0_0_12px_rgba(59,130,246,0.5)]'
                : 'frosted-glass text-gray-400 hover:text-gray-200'
            }`}
          >
            {i + 1}. {s.name}
          </button>
        ))}
      </div>

      {/* 圆点指示器 + 滑动提示 */}
      <div className="flex items-center justify-center gap-1.5 mb-1">
        {tutorial.steps.map((_, i) => (
          <button
            key={i}
            aria-label={`跳到第 ${i + 1} 步`}
            onClick={() => setActiveStep(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              activeStep === i ? 'w-5 bg-accent-blue' : 'w-1.5 bg-white/20'
            }`}
          />
        ))}
      </div>
      <p className="text-center text-[10px] text-gray-600 mb-3">左右滑动切换步骤</p>

      {/* 当前步骤内容（支持左右滑动切换） */}
      <div
        className="frosted-glass rounded-2xl p-5 mb-5 animate-slide-up"
        key={activeStep}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-white">
            第 {activeStep + 1} 步：{step.name}
          </h2>
        </div>

        {/* 步骤示例图（贴合当前模型与步骤生成） */}
        <StepIllustration modelName={tutorial.model_name} stepName={step.name} />

        <p className="text-sm text-gray-300 leading-relaxed mb-4">{step.description}</p>

        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <Lightbulb size={16} className="text-yellow-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-yellow-400 mb-1">操作要点</p>
              <p className="text-sm text-gray-300">{step.tips}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="text-orange-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-orange-400 mb-1">注意事项</p>
              <p className="text-sm text-gray-300">{step.caution}</p>
            </div>
          </div>
        </div>

        {/* AI 判作业：提交这一步的成果，AI 打分并建议返工或继续 */}
        <WorkGrade
          stepName={step.name}
          stepDesc={`${step.description}（操作要点：${step.tips}）`}
          modelName={tutorial.model_name}
          grade={grades[activeStep]}
          onGrade={(g) => setGrades((prev) => ({ ...prev, [activeStep]: g }))}
          onNextStep={
            activeStep < tutorial.steps.length - 1
              ? () => setActiveStep(activeStep + 1)
              : undefined
          }
        />

        {/* 步骤内对话 */}
        <div className="mt-5 pt-4 border-t border-white/10">
          <p className="text-xs text-gray-400 mb-3">对这一步有疑问？问问 AI 导师</p>

          <div className="space-y-2 mb-3 max-h-64 overflow-y-auto">
            {(messages[activeStep] || []).map((m, i) => (
              <div
                key={i}
                className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                    m.role === 'user'
                      ? 'bg-accent-blue text-white rounded-br-sm whitespace-pre-wrap break-words'
                      : 'frosted-glass text-gray-200 rounded-bl-sm'
                  }`}
                >
                  {m.role === 'ai' ? <MarkdownText content={m.text} /> : m.text}
                </div>
                {m.role === 'ai' && m.keywords && (
                  <div className="w-full max-w-[90%]">
                    <VideoRecommend keywords={m.keywords} />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="frosted-glass px-3 py-2 rounded-2xl rounded-bl-sm">
                  <Loader2 size={16} className="animate-spin text-accent-blue-light" />
                </div>
              </div>
            )}
          </div>

          <LiquidInput
            value={input}
            onChange={setInput}
            onSubmit={sendMessage}
            placeholder={`关于「${step.name}」提问...`}
            loading={loading}
          />
        </div>
      </div>

      {/* 网上教程推荐（基于 AI 识别结果自动搜索） */}
      <div className="mb-5">
        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
          <PlayCircle size={14} className="text-[#fb7299] flex-shrink-0" />
          <span className="text-xs text-gray-400">
            识别到 <span className="text-accent-blue-light font-medium">{tutorial.model_name}</span>，为你找到的网上教程
          </span>
        </div>
        <VideoRecommend keywords={[tutorial.model_name]} auto />
      </div>

      {/* 下一步按钮 */}
      {activeStep < tutorial.steps.length - 1 && (
        <button
          onClick={() => setActiveStep(activeStep + 1)}
          className="w-full frosted-glass rounded-2xl py-3 text-sm text-accent-blue-light font-medium flex items-center justify-center gap-1 hover:bg-white/5 transition-colors"
        >
          下一步：{tutorial.steps[activeStep + 1].name}
          <ChevronRight size={16} />
        </button>
      )}
    </div>
  )
}
