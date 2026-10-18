import { useRef, useState } from 'react'
import { Camera, ImagePlus, Loader2, RotateCcw, ArrowRight, ClipboardCheck, AlertCircle } from 'lucide-react'
import { gradeWork } from '../lib/api'
import type { WorkGrade as WorkGradeResult } from '../lib/types'
import MarkdownText from './MarkdownText'

interface Props {
  stepName: string
  stepDesc: string
  modelName: string
  grade?: WorkGradeResult
  onGrade: (g: WorkGradeResult) => void
  /** verdict 为 continue 时展示的「进入下一步」回调 */
  onNextStep?: () => void
}

/** 评分环：SVG 圆环 + 分数，颜色随判定结果变化 */
function ScoreRing({ score, verdict }: { score: number; verdict: WorkGradeResult['verdict'] }) {
  const R = 26
  const C = 2 * Math.PI * R
  const color = verdict === 'continue' ? 'text-green-400' : 'text-orange-400'
  return (
    <div className="relative w-16 h-16 flex-shrink-0">
      <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
        <circle
          cx="32"
          cy="32"
          r={R}
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          className={color}
          strokeDasharray={C}
          strokeDashoffset={C * (1 - score / 100)}
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.22, 1, 0.36, 1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-sm font-bold ${color}`}>{score}</span>
      </div>
    </div>
  )
}

/** 把后端/AI 错误转成用户能看懂的提示 */
const friendlyError = (msg: string): string => {
  if (msg.includes('402') || msg.toLowerCase().includes('balance')) return 'AI 服务额度不足，请为硅基流动账户充值后再试'
  if (msg.includes('Model does not exist')) return 'AI 模型配置无效，请检查 VISION_MODEL 配置'
  return msg
}

/**
 * AI 判作业：完成某一步后拍照/上传成果图，AI 打分并建议「返工」或「进入下一步」
 */
export default function WorkGrade({ stepName, stepDesc, modelName, grade, onGrade, onNextStep }: Props) {
  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleFile = (f: File | null | undefined) => {
    if (!f || loading) return
    setError('')
    setPreview(URL.createObjectURL(f))
    setLoading(true)
    gradeWork(f, { modelName, stepName, stepDesc })
      .then((res) => {
        if (res.success) onGrade(res.data)
        else setError(friendlyError(res.error || '评分失败，请重试'))
      })
      .catch(() => setError('网络错误，请稍后重试'))
      .finally(() => setLoading(false))
  }

  const reset = () => {
    setPreview('')
    setError('')
  }

  const inputCls = 'hidden'
  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFile(e.target.files?.[0])
    e.currentTarget.value = ''
  }

  return (
    <div className="mt-5 pt-4 border-t border-white/10">
      <div className="flex items-center gap-2 mb-1">
        <ClipboardCheck size={16} className="text-accent-blue-light" />
        <span className="text-sm font-semibold text-white">AI 判作业</span>
      </div>
      <p className="text-xs text-gray-400 mb-3">
        完成「{stepName}」后拍照或上传成果，AI 为你打分并建议返工或继续
      </p>

      {/* 上传入口 */}
      {!preview && !loading && (
        <div className="flex gap-2">
          <button
            onClick={() => cameraRef.current?.click()}
            className="flex-1 frosted-glass rounded-xl py-2.5 text-xs text-gray-200 flex items-center justify-center gap-1.5 hover:bg-white/5 transition-colors active:scale-[0.98]"
          >
            <Camera size={14} />
            拍照评分
          </button>
          <button
            onClick={() => galleryRef.current?.click()}
            className="flex-1 frosted-glass rounded-xl py-2.5 text-xs text-gray-200 flex items-center justify-center gap-1.5 hover:bg-white/5 transition-colors active:scale-[0.98]"
          >
            <ImagePlus size={14} />
            从相册选择
          </button>
        </div>
      )}

      {/* 加载中 */}
      {loading && (
        <div className="animate-slide-up">
          {preview && (
            <img src={preview} alt="作业预览" className="w-full h-40 object-cover rounded-xl mb-3" />
          )}
          <div className="frosted-glass rounded-xl px-4 py-3 flex items-center gap-2">
            <Loader2 size={14} className="animate-spin text-accent-blue-light flex-shrink-0" />
            <span className="text-xs text-gray-300">AI 正在检查你的「{stepName}」成果...</span>
          </div>
        </div>
      )}

      {/* 评分结果 */}
      {grade && !loading && (
        <div className="animate-slide-up">
          {preview && (
            <img src={preview} alt="作业" className="w-full h-40 object-cover rounded-xl mb-3" />
          )}
          <div className="frosted-glass rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <ScoreRing score={grade.score} verdict={grade.verdict} />
              <div className="flex-1 min-w-0">
                <span
                  className={`inline-block text-[11px] font-medium px-2.5 py-1 rounded-full ${
                    grade.verdict === 'continue'
                      ? 'bg-green-500/15 text-green-400'
                      : 'bg-orange-500/15 text-orange-400'
                  }`}
                >
                  {grade.verdict === 'continue' ? '完成度不错，可以进入下一步' : '建议返工后再继续'}
                </span>
                <p className="text-[11px] text-gray-500 mt-1.5">基于你提交的成果照片评定</p>
              </div>
            </div>
            <MarkdownText content={grade.feedback} />

            <div className="flex gap-2 mt-3">
              {grade.verdict === 'continue' && onNextStep ? (
                <>
                  <button
                    onClick={() => cameraRef.current?.click()}
                    className="frosted-glass flex-1 rounded-xl py-2.5 text-xs text-gray-200 flex items-center justify-center gap-1.5 hover:bg-white/5 transition-colors active:scale-[0.98]"
                  >
                    <RotateCcw size={13} />
                    再评一次
                  </button>
                  <button
                    onClick={onNextStep}
                    className="flex-1 rounded-xl py-2.5 bg-accent-blue text-white text-xs font-medium flex items-center justify-center gap-1.5 hover:shadow-[0_0_12px_rgba(59,130,246,0.5)] transition-all active:scale-[0.98]"
                  >
                    进入下一步
                    <ArrowRight size={13} />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => cameraRef.current?.click()}
                  className="flex-1 rounded-xl py-2.5 bg-accent-blue text-white text-xs font-medium flex items-center justify-center gap-1.5 hover:shadow-[0_0_12px_rgba(59,130,246,0.5)] transition-all active:scale-[0.98]"
                >
                  <Camera size={13} />
                  返工后重新拍照评分
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 错误提示 */}
      {error && !loading && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-orange-400">
          <AlertCircle size={13} className="flex-shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={reset} className="underline hover:text-orange-300">
            重试
          </button>
        </div>
      )}

      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className={inputCls} onChange={onPick} />
      <input ref={galleryRef} type="file" accept="image/*" className={inputCls} onChange={onPick} />
    </div>
  )
}
