import { useState, useRef, useEffect } from 'react'
import { Sparkles, Baby, Package, Upload, Loader2, ArrowLeft, ExternalLink, AlertCircle } from 'lucide-react'
import { beginnerModels } from '../data/beginnerModels'
import { analyzeModel, generateTutorial } from '../lib/api'
import type { ModelInfo, Tutorial } from '../lib/types'
import TutorialView from '../components/TutorialView'
import Modal from '../components/Modal'

type View = 'main' | 'beginner' | 'upload' | 'tutorial'

/** 把 AI/网络错误转成用户能看懂的提示 */
const friendlyAiError = (msg: string): string => {
  if (msg.includes('402') || msg.toLowerCase().includes('balance')) return 'AI 服务额度不足，请为硅基流动账户充值后再试'
  if (msg.includes('Model does not exist')) return 'AI 模型配置无效，请检查后端 VISION_MODEL / TEXT_MODEL 配置'
  if (msg.includes('aborted') || msg.includes('timeout')) return '请求超时，AI 服务响应太慢，请重试'
  return msg
}

const ambientImg = (prompt: string) =>
  `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=landscape_16_9`

/** 主页底部轮播的模型场景图（隐约氛围背景） */
const AMBIENT_SCENES = [
  ambientImg(
    'photorealistic Tiger tank scale model on diorama base, moody dark atmosphere, faint blue rim light, cinematic, low key lighting'
  ),
  ambientImg(
    'photorealistic attack helicopter scale model in flight pose on display stand, dark background, faint blue volumetric light, cinematic'
  ),
  ambientImg(
    'photorealistic Gundam plastic model silhouette standing on workbench, dark ambient, faint blue LED glow, cinematic low key'
  ),
  ambientImg(
    'photorealistic battleship scale model on ocean diorama, dark moody background, faint blue moonlight, cinematic'
  ),
]

/** 主页底部隐约的模型场景轮播（JS 驱动淡入淡出，进入子流程后随主页卸载消失） */
function AmbientScenes() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % AMBIENT_SCENES.length), 5000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="pointer-events-none fixed bottom-16 left-0 right-0 z-0 flex justify-center">
      <div className="relative w-full max-w-[480px] h-56">
        {AMBIENT_SCENES.map((src, i) => (
          <img
            key={src}
            src={src}
            alt=""
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out"
            style={{
              opacity: i === index ? 0.5 : 0,
              maskImage: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.25) 55%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.25) 55%, transparent 100%)',
              filter: 'blur(2px) saturate(0.9)',
            }}
          />
        ))}
      </div>
    </div>
  )
}

export default function MyTutorials() {
  const [view, setView] = useState<View>('main')
  const [tutorial, setTutorial] = useState<Tutorial | null>(null)
  const [loading, setLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleBeginnerModel = async (model: (typeof beginnerModels)[0]) => {
    setLoading(true)
    setView('tutorial')
    try {
      const modelInfo: ModelInfo = {
        name: model.name,
        category: model.category,
        scale: model.scale,
        difficulty: model.difficulty,
        parts_count: '约300-800',
        material: '塑料',
        // 把精选笔记（简介 + 推荐理由）注入 AI，生成贴合该模型特点的定制教程
        features: `${model.intro}。推荐理由：${model.reason}`,
      }
      const res = await generateTutorial(modelInfo)
      if (res.success) setTutorial(res.data)
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPendingFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setShowPreview(true)
  }

  const confirmAnalyze = async (isRetry = false) => {
    if (!pendingFile) return
    if (!isRetry) {
      setShowPreview(false)
      setView('upload')
    }
    setLoading(true)
    setUploadError('')
    try {
      const analyzeRes = await analyzeModel(pendingFile)
      const modelInfo: ModelInfo = analyzeRes.success
        ? analyzeRes.data
        : { name: '拼装模型', category: '通用', scale: '未知', difficulty: '未知', parts_count: '未知', material: '塑料', features: '' }
      const tutRes = await generateTutorial(modelInfo)
      if (tutRes.success) {
        setTutorial(tutRes.data)
        setView('tutorial')
        setPendingFile(null)
      } else {
        setUploadError(friendlyAiError(tutRes.error || '教程生成失败'))
      }
    } catch {
      setUploadError('网络连接异常，请确认后端服务已启动后重试')
    } finally {
      setLoading(false)
    }
  }

  const goMain = () => {
    setView('main')
    setTutorial(null)
    setPreviewUrl('')
    setPendingFile(null)
    setUploadError('')
  }

  // 教程展示
  if (view === 'tutorial' && tutorial) {
    return (
      <div className="px-4 pt-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 text-gray-400">
            <Loader2 size={40} className="animate-spin text-accent-blue mb-4" />
            <p className="text-sm">AI 正在为你定制教程...</p>
          </div>
        ) : (
          <TutorialView tutorial={tutorial} onBack={goMain} />
        )}
      </div>
    )
  }

  // 识别中 / 失败重试页
  if (view === 'upload') {
    return (
      <div className="px-4 pt-6">
        <div className="flex flex-col items-center justify-center py-24 text-center">
          {previewUrl && (
            <img src={previewUrl} alt="model" className="w-32 h-32 object-cover rounded-2xl mb-6 frosted-glass p-1" />
          )}
          {loading ? (
            <>
              <Loader2 size={40} className="animate-spin text-accent-blue mb-4" />
              <p className="text-sm text-gray-300">正在识别模型并生成教程...</p>
              <p className="text-xs text-gray-500 mt-2">通常需要 10-30 秒</p>
            </>
          ) : (
            <>
              <AlertCircle size={36} className="text-orange-400 mb-4" />
              <p className="text-sm text-gray-300 mb-1">识别或生成没有成功</p>
              <p className="text-xs text-gray-500 mb-6 max-w-[280px] break-all">{uploadError || '未知错误'}</p>
              <div className="flex gap-3">
                <button
                  onClick={goMain}
                  className="frosted-glass px-5 py-2.5 rounded-full text-xs text-gray-300 hover:text-white transition-colors"
                >
                  返回
                </button>
                <button
                  onClick={() => confirmAnalyze(true)}
                  className="bg-accent-blue px-5 py-2.5 rounded-full text-xs text-white font-medium hover:shadow-[0_0_12px_rgba(59,130,246,0.5)] transition-all"
                >
                  重试
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  // 新手引导页
  if (view === 'beginner') {
    return (
      <div className="px-4 pt-6 animate-fade-in">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={goMain} className="frosted-glass w-9 h-9 rounded-full flex items-center justify-center text-gray-300">
            ←
          </button>
          <h1 className="text-xl font-bold text-white">新手入门推荐</h1>
        </div>
        <p className="text-sm text-gray-400 mb-5">精选适合零基础的模型，附带成熟教程</p>
        <div className="space-y-4">
          {beginnerModels.map((m) => (
            <div key={m.id} className="frosted-glass rounded-2xl p-4 animate-slide-up">
              <div className="flex gap-4">
                <img src={m.image} alt={m.name} className="w-24 h-24 object-cover rounded-xl flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-white">{m.name}</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent-blue/20 text-accent-blue-light">
                      {m.difficulty}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mb-1">{m.category} · {m.scale}</p>
                  <p className="text-xs text-gray-400 mb-2 line-clamp-2">{m.intro}</p>
                  <p className="text-xs text-gray-500 line-clamp-2">{m.reason}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => handleBeginnerModel(m)}
                  className="flex-1 py-2 rounded-xl bg-accent-blue text-white text-sm font-medium hover:shadow-[0_0_12px_rgba(59,130,246,0.5)] transition-all"
                >
                  开始制作
                </button>
                <a
                  href={m.buyLink}
                  target="_blank"
                  rel="noreferrer"
                  className="frosted-glass px-4 py-2 rounded-xl text-sm text-gray-300 flex items-center gap-1"
                >
                  <ExternalLink size={14} /> 购买
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // 主页面 - 双入口
  return (
    <div className="px-4 pt-6 animate-fade-in">
      {/* 底部模型场景轮播（氛围背景，进入子流程后随主页卸载消失） */}
      <AmbientScenes />

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="text-accent-blue-light" size={22} />
          <h1 className="text-2xl font-bold text-white">我的模型</h1>
        </div>
        <p className="text-sm text-gray-400 mb-8">开启你的模型制作之旅</p>

      <div className="space-y-4">
        {/* 新手入口 */}
        <button
          onClick={() => setView('beginner')}
          className="w-full frosted-glass rounded-2xl p-6 text-left hover:bg-white/5 transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-blue/30 to-accent-blue/10 flex items-center justify-center flex-shrink-0">
              <Baby className="text-accent-blue-light" size={28} />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-white mb-1">我是新手</h2>
              <p className="text-xs text-gray-400">从零开始，我们为你精选入门模型和教程</p>
            </div>
            <ArrowLeft className="text-gray-500 rotate-180 group-hover:text-accent-blue-light transition-colors" size={20} />
          </div>
        </button>

        {/* 已有模型入口 */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full frosted-glass rounded-2xl p-6 text-left hover:bg-white/5 transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/30 to-purple-500/10 flex items-center justify-center flex-shrink-0">
              <Package className="text-purple-300" size={28} />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-white mb-1">我已有模型</h2>
              <p className="text-xs text-gray-400">上传模型图片，AI 为你定制分步教程</p>
            </div>
            <Upload className="text-gray-500 group-hover:text-purple-300 transition-colors" size={20} />
          </div>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* 图片预览弹窗 */}
      <Modal
        open={showPreview}
        onClose={() => { setShowPreview(false); setPendingFile(null) }}
        title="确认模型图片"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => { setShowPreview(false); setPendingFile(null) }}
              className="flex-1 py-3 rounded-xl frosted-glass text-gray-300 text-sm font-medium"
            >
              取消
            </button>
            <button
              onClick={() => confirmAnalyze()}
              className="flex-1 py-3 rounded-xl bg-accent-blue text-white text-sm font-medium hover:shadow-[0_0_12px_rgba(59,130,246,0.5)]"
            >
              开始识别
            </button>
          </div>
        }
      >
        {previewUrl && (
          <img src={previewUrl} alt="preview" className="w-full rounded-2xl" />
        )}
        <p className="text-xs text-gray-400 text-center mt-3">AI 将识别模型并为你生成定制教程</p>
      </Modal>
      </div>
    </div>
  )
}
