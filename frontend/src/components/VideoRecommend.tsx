import { useState, useEffect } from 'react'
import { PlayCircle, ThumbsUp, X, Search, Loader2, ExternalLink, Eye } from 'lucide-react'
import { searchBilibili } from '../lib/api'
import type { BiliVideo } from '../lib/types'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

interface Props {
  keywords: string[]
  /** 自动模式：跳过询问，直接搜索（用于教程页基于识别结果的推荐） */
  auto?: boolean
}

const formatPlay = (n: number): string => {
  if (n >= 10000) return (n / 10000).toFixed(1) + '万'
  return String(n)
}

export default function VideoRecommend({ keywords, auto = false }: Props) {
  const [state, setState] = useState<'ask' | 'loading' | 'show' | 'dismissed'>(auto ? 'loading' : 'ask')
  const [videos, setVideos] = useState<BiliVideo[]>([])
  const [errMsg, setErrMsg] = useState('')

  if (state === 'dismissed' || keywords.length === 0) return null

  const keyword = keywords[0]
  const searchMoreUrl = `https://search.bilibili.com/all?keyword=${encodeURIComponent(keyword)}`

  const handleRecommend = async () => {
    setState('loading')
    setErrMsg('')
    try {
      const res = await searchBilibili(keyword)
      if (res.success && res.data.videos.length > 0) {
        setVideos(res.data.videos)
        setState('show')
      } else {
        setErrMsg(res.error || '未找到相关视频')
        setState('show')
      }
    } catch {
      setErrMsg('网络错误，请稍后重试')
      setState('show')
    }
  }

  useEffect(() => {
    if (auto) handleRecommend()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className={auto ? 'w-full animate-slide-up' : 'mt-2 max-w-[85%] animate-slide-up'}>
      {state === 'ask' && (
        <div className="frosted-glass rounded-2xl rounded-bl-sm px-4 py-3">
          <div className="flex items-center gap-2 mb-2.5">
            <PlayCircle size={14} className="text-[#fb7299] flex-shrink-0" />
            <p className="text-xs text-gray-300">
              是否需要推荐<span className="text-accent-blue-light font-medium">「{keyword}」</span>相关的讲解视频？
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRecommend}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-accent-blue text-white text-xs font-medium hover:shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all"
            >
              <ThumbsUp size={11} />
              推荐视频
            </button>
            <button
              onClick={() => setState('dismissed')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-gray-400 text-xs hover:text-gray-200 transition-colors"
            >
              <X size={11} />
              不了
            </button>
          </div>
        </div>
      )}

      {state === 'loading' && (
        <div className="frosted-glass rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
          <Loader2 size={14} className="animate-spin text-accent-blue-light" />
          <span className="text-xs text-gray-400">正在搜索「{keyword}」相关视频...</span>
        </div>
      )}

      {state === 'show' && (
        <div className="space-y-2">
          {errMsg ? (
            <p className="text-xs text-gray-500 px-1">{errMsg}</p>
          ) : (
            videos.map((v) => (
              <a
                key={v.bvid}
                href={v.url}
                target="_blank"
                rel="noopener noreferrer"
                className="frosted-glass rounded-2xl overflow-hidden flex hover:bg-white/8 transition-colors group"
              >
                <div className="relative w-24 h-16 flex-shrink-0 bg-black/40">
                  {v.cover ? (
                    <img
                      src={v.cover}
                      alt={v.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        // 防盗链失败时回退到后端代理
                        const target = e.currentTarget
                        const proxyUrl = `${API_BASE}/api/bilibili/proxy-image?url=${encodeURIComponent(v.cover)}`
                        if (!target.src.includes('proxy-image')) {
                          target.src = proxyUrl
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <PlayCircle size={20} className="text-gray-600" />
                    </div>
                  )}
                  {v.duration && (
                    <span className="absolute bottom-0.5 right-0.5 bg-black/70 text-white text-[9px] px-1 rounded">
                      {v.duration}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0 p-2 flex flex-col justify-between">
                  <p className="text-xs font-medium text-gray-200 line-clamp-2 leading-snug">{v.title}</p>
                  <div className="flex items-center gap-2 text-[10px] text-gray-500">
                    <span>{v.author}</span>
                    {v.play > 0 && (
                      <span className="flex items-center gap-0.5">
                        <Eye size={10} />
                        {formatPlay(v.play)}
                      </span>
                    )}
                  </div>
                </div>
              </a>
            ))
          )}

          {/* 搜索更多 */}
          <a
            href={searchMoreUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl border border-[#fb7299]/30 bg-[#fb7299]/10 text-[#fb7299] text-xs font-medium hover:bg-[#fb7299]/20 transition-colors"
          >
            <Search size={12} />
            在 B 站搜索更多「{keyword}」视频
            <ExternalLink size={10} />
          </a>
        </div>
      )}
    </div>
  )
}
