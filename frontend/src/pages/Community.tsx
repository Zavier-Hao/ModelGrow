import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, Heart, ImagePlus, MessageCircle, Plus, Send, Users, X } from 'lucide-react'
import { INITIAL_POSTS, MY_AVATAR, TAGS, type Post } from '../data/communityPosts'
import { getCommunityPosts, createCommunityPost, toggleCommunityLike, addCommunityComment } from '../lib/api'

/** 种子帖子的时间是展示文案直接用；新帖子是 ISO 时间转相对时间 */
const fmtTime = (t: string) => {
  if (!/^\d{4}-\d{2}-\d{2}/.test(t) || t.length <= 10) return t
  const diff = (Date.now() - new Date(t).getTime()) / 1000
  if (diff < 60) return '刚刚'
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`
  if (diff < 172800) return '昨天'
  return t.slice(5, 10)
}

/** 圆形图片头像 */
function Avatar({ src, size }: { src: string; size: string }) {
  return (
    <img
      src={src}
      alt="头像"
      loading="lazy"
      className={`${size} rounded-full object-cover flex-shrink-0 select-none ring-1 ring-white/10 bg-white/5`}
    />
  )
}

/** 点赞按钮：红心弹跳 + 小爱心飘出 */
function LikeButton({
  liked,
  likes,
  onToggle,
  size = 15,
}: {
  liked: boolean
  likes: number
  onToggle: () => void
  size?: number
}) {
  const [burst, setBurst] = useState(0)
  const handle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!liked) setBurst((b) => b + 1) // 仅点赞时放粒子
    onToggle()
  }
  return (
    <button
      onClick={handle}
      className={`relative flex items-center gap-1.5 text-xs transition-colors active:scale-90 ${
        liked ? 'text-red-400' : 'text-gray-400 hover:text-gray-200'
      }`}
    >
      <span className="relative inline-flex">
        <Heart
          key={`${liked}-${burst}`}
          size={size}
          className={`${liked ? 'fill-current' : ''} ${liked && burst > 0 ? 'animate-like-pop' : ''}`}
        />
        {/* 飘出的小爱心粒子 */}
        {burst > 0 && (
          <span key={burst} className="pointer-events-none absolute left-1/2 top-0">
            <Heart size={9} className="animate-like-fly absolute -left-1 text-red-400 fill-current" style={{ '--fx': '-10px' } as React.CSSProperties} />
            <Heart size={7} className="animate-like-fly absolute -left-1 text-rose-300 fill-current" style={{ '--fx': '9px', animationDelay: '0.08s' } as React.CSSProperties} />
          </span>
        )}
      </span>
      {likes}
    </button>
  )
}

/** 帖子卡片（信息流里的缩略形态，点击进详情） */
function PostCard({ post, onOpen, onLike }: { post: Post; onOpen: () => void; onLike: () => void }) {
  return (
    <div onClick={onOpen} className="frosted-glass rounded-2xl p-4 mb-4 animate-slide-up cursor-pointer active:scale-[0.99] transition-transform">
      <div className="flex items-center gap-2.5 mb-3">
        <Avatar src={post.avatar} size="w-9 h-9" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{post.author}</p>
          <p className="text-[11px] text-gray-500">
            {fmtTime(post.time)} · {post.tag}
          </p>
        </div>
      </div>

      <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap mb-3 line-clamp-4">{post.content}</p>

      {post.images.length > 0 && (
        <div className={`grid gap-2 mb-1 ${post.images.length > 1 ? 'grid-cols-2' : ''}`}>
          {post.images.map((src) => (
            <div key={src} className="rounded-xl overflow-hidden bg-white/5">
              <img
                src={src}
                alt="帖子配图"
                loading="lazy"
                className={`w-full object-cover ${post.images.length > 1 ? 'aspect-square' : 'max-h-64'}`}
              />
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-6 pt-3 mt-1 border-t border-white/5">
        <LikeButton liked={post.liked} likes={post.likes} onToggle={onLike} />
        <span className="flex items-center gap-1.5 text-xs text-gray-400">
          <MessageCircle size={15} />
          {post.comments.length}
        </span>
      </div>
    </div>
  )
}

/** 帖子详情（贴吧移动端式：全屏接管，上滑浏览楼层，底部固定评论栏） */
function PostDetail({
  post,
  onBack,
  onLike,
  onComment,
}: {
  post: Post
  onBack: () => void
  onLike: () => void
  onComment: (id: string, text: string) => void
}) {
  const [draft, setDraft] = useState('')
  const listRef = useRef<HTMLDivElement>(null)

  const submit = () => {
    const t = draft.trim()
    if (!t) return
    onComment(post.id, t)
    setDraft('')
    // 评论后滚到底部看自己的跟帖
    requestAnimationFrame(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' }))
  }

  return (
    <div className="fixed inset-0 z-40 bg-bg-deep">
      <div className="mx-auto max-w-[480px] h-full flex flex-col">
        {/* 顶栏 */}
        <div className="frosted-glass-strong border-x-0 border-t-0 flex items-center gap-3 px-4 py-3 flex-shrink-0">
          <button onClick={onBack} className="w-8 h-8 rounded-full flex items-center justify-center text-gray-300 hover:text-white">
            <ChevronLeft size={22} />
          </button>
          <p className="flex-1 text-sm font-medium text-white">帖子详情</p>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-accent-blue/20 text-accent-blue-light">{post.tag}</span>
        </div>

        {/* 可滚动内容：正文 + 楼层跟帖 */}
        <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto px-4 pt-4 pb-6">
          {/* 楼主 */}
          <div className="flex items-center gap-2.5 mb-3">
            <Avatar src={post.avatar} size="w-10 h-10" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{post.author}</p>
              <p className="text-[11px] text-gray-500">{post.time} · 楼主</p>
            </div>
            <LikeButton liked={post.liked} likes={post.likes} onToggle={onLike} size={17} />
          </div>
          <p className="text-[15px] text-gray-100 leading-relaxed whitespace-pre-wrap mb-4">{post.content}</p>
          {post.images.length > 0 && (
            <div className="space-y-2 mb-4">
              {post.images.map((src) => (
                <div key={src} className="rounded-xl overflow-hidden bg-white/5">
                  <img src={src} alt="帖子配图" className="w-full object-cover" />
                </div>
              ))}
            </div>
          )}

          {/* 跟帖区 */}
          <div className="flex items-center gap-2 pt-3 mt-2 border-t border-white/10 mb-3">
            <MessageCircle size={14} className="text-accent-blue-light" />
            <p className="text-xs text-gray-400">共 {post.comments.length} 条跟帖</p>
          </div>
          <div className="space-y-4">
            {post.comments.map((c, i) => (
              <div key={c.id} className="flex gap-2.5 animate-slide-up">
                <Avatar src={c.avatar} size="w-8 h-8" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className={`text-xs ${c.author === post.author ? 'text-accent-blue-light' : 'text-gray-400'}`}>
                      {c.author}
                      {c.author === post.author && ' · 楼主'}
                    </span>
                    <span className="text-[10px] text-gray-600">
                      {i + 1}楼 · {fmtTime(c.time)}
                    </span>
                  </div>
                  <p className="text-[13px] text-gray-200 leading-relaxed mt-1 break-words">
                    {c.replyTo && <span className="text-accent-blue-light">回复 @{c.replyTo}：</span>}
                    {c.content}
                  </p>
                </div>
              </div>
            ))}
            {post.comments.length === 0 && (
              <p className="text-xs text-gray-600 text-center py-6">还没有跟帖，来抢沙发</p>
            )}
          </div>
        </div>

        {/* 底部评论栏 */}
        <div className="frosted-glass-strong border-x-0 border-b-0 flex items-center gap-2 px-4 py-3 flex-shrink-0" style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="友善跟帖..."
            className="flex-1 frosted-glass rounded-full px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-accent-blue/50 min-w-0"
          />
          <button
            onClick={submit}
            disabled={!draft.trim()}
            className="w-9 h-9 rounded-full bg-accent-blue flex items-center justify-center text-white disabled:opacity-40 flex-shrink-0 transition-all hover:shadow-[0_0_12px_rgba(59,130,246,0.5)]"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}

/** 发帖底部弹层 */
function PublishSheet({ onClose, onPublish }: { onClose: () => void; onPublish: (tag: string, content: string, images: string[]) => void }) {
  const [content, setContent] = useState('')
  const [tag, setTag] = useState(TAGS[1])
  const [images, setImages] = useState<string[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  const pickImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 4 - images.length)
    files.forEach((f) => {
      const r = new FileReader()
      r.onload = () => setImages((imgs) => [...imgs, String(r.result)].slice(0, 4))
      r.readAsDataURL(f)
    })
    e.target.value = ''
  }

  const publish = () => {
    const t = content.trim()
    if (!t) return
    onPublish(tag, t, images)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        onClick={(e) => e.stopPropagation()}
        className="frosted-glass-strong relative w-full max-w-[480px] rounded-t-3xl px-5 pt-3 animate-slide-up"
        style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
      >
        <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-4" />
        <div className="flex items-center justify-between mb-4">
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
          <p className="text-sm font-medium text-white">发布新帖</p>
          <button
            onClick={publish}
            disabled={!content.trim()}
            className="px-4 py-1.5 rounded-full bg-accent-blue text-xs text-white font-medium disabled:opacity-40 transition-all hover:shadow-[0_0_12px_rgba(59,130,246,0.5)]"
          >
            发布
          </button>
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="分享你的模型进度、翻车现场或求助..."
          rows={5}
          autoFocus
          className="w-full frosted-glass rounded-2xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-accent-blue/50 resize-none mb-3"
        />

        {/* 图片选择 */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {images.map((src, i) => (
            <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden bg-white/5">
              <img src={src} alt="待发布图" className="w-full h-full object-cover" />
              <button
                onClick={() => setImages((imgs) => imgs.filter((_, j) => j !== i))}
                className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center text-white"
              >
                <X size={11} />
              </button>
            </div>
          ))}
          {images.length < 4 && (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-16 h-16 rounded-xl frosted-glass flex flex-col items-center justify-center text-gray-400 hover:text-white transition-colors"
            >
              <ImagePlus size={18} />
              <span className="text-[9px] mt-0.5">加图</span>
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={pickImages} />
        </div>

        {/* 标签选择 */}
        <div className="flex gap-2 flex-wrap">
          {TAGS.filter((t) => t !== '全部').map((t) => (
            <button
              key={t}
              onClick={() => setTag(t)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                tag === t ? 'bg-accent-blue text-white shadow-[0_0_12px_rgba(59,130,246,0.4)]' : 'frosted-glass text-gray-400'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/** Siri 风格发帖按钮：磨砂玻璃圆 + 内部蓝绿液态流光 + 呼吸 + 周期扫光 */
function SiriFab({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="发帖"
      className="fixed z-40 w-14 h-14 rounded-full active:scale-90 transition-transform"
      style={{
        right: 'max(1rem, calc(50% - 14rem))',
        bottom: 'calc(4.1875rem + env(safe-area-inset-bottom) + 0.75rem)',
        animation: 'fabBreath 2.6s ease-in-out infinite',
      }}
    >
      {/* 磨砂玻璃底 */}
      <div className="absolute inset-0 rounded-full overflow-hidden backdrop-blur-xl bg-white/10 border border-white/25 shadow-inner">
        {/* 蓝绿液态交融流光（两团模糊色块反向公转，屏幕混合） */}
        <div
          className="absolute -inset-[40%] mix-blend-screen"
          style={{
            background: 'radial-gradient(circle at 35% 35%, rgba(74,168,255,0.95) 0%, rgba(74,168,255,0) 55%)',
            animation: 'siriSpinA 5s linear infinite',
          }}
        />
        <div
          className="absolute -inset-[40%] mix-blend-screen"
          style={{
            background: 'radial-gradient(circle at 65% 60%, rgba(52,245,197,0.9) 0%, rgba(52,245,197,0) 55%)',
            animation: 'siriSpinB 7s linear infinite',
          }}
        />
        <div
          className="absolute -inset-[40%] mix-blend-screen opacity-70"
          style={{
            background: 'radial-gradient(circle at 50% 80%, rgba(129,140,248,0.8) 0%, rgba(129,140,248,0) 50%)',
            animation: 'siriSpinA 9s linear infinite',
          }}
        />
        {/* 周期扫过的高光 */}
        <div
          className="absolute top-0 bottom-0 w-1/3 bg-gradient-to-r from-transparent via-white/50 to-transparent"
          style={{ animation: 'fabSheen 3.2s ease-in-out infinite' }}
        />
      </div>
      {/* 加号 */}
      <Plus size={26} className="relative z-10 mx-auto text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.8)]" strokeWidth={2.5} />
    </button>
  )
}

export default function Community() {
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS)
  const [activeTag, setActiveTag] = useState('全部')
  const [openId, setOpenId] = useState<string | null>(null)
  const [publishing, setPublishing] = useState(false)

  // 进页面拉服务端数据（SQLite 持久化），拉不到就用本地种子兜底
  useEffect(() => {
    getCommunityPosts()
      .then((res) => {
        if (res.success && res.data.posts.length > 0) setPosts(res.data.posts)
      })
      .catch(() => {})
  }, [])

  const toggleLike = (id: string) => {
    let nextLiked = false
    setPosts((ps) =>
      ps.map((p) => {
        if (p.id !== id) return p
        nextLiked = !p.liked
        return { ...p, liked: nextLiked, likes: p.likes + (nextLiked ? 1 : -1) }
      })
    )
    // 后台同步到服务端，失败就算了（下次进页面会以服务端为准）
    toggleCommunityLike(id, nextLiked).catch(() => {})
  }

  const addComment = async (id: string, text: string) => {
    const temp: Post['comments'][0] = { id: `t${Date.now()}`, author: '我', avatar: MY_AVATAR, content: text, time: '刚刚' }
    setPosts((ps) => ps.map((p) => (p.id === id ? { ...p, comments: [...p.comments, temp] } : p)))
    try {
      const res = await addCommunityComment(id, { content: text, author: '我', avatar: MY_AVATAR })
      if (res.success) {
        // 用服务端返回的正式评论替换临时那条
        setPosts((ps) =>
          ps.map((p) =>
            p.id === id ? { ...p, comments: p.comments.map((c) => (c.id === temp.id ? res.data : c)) } : p
          )
        )
      }
    } catch {
      // 网络失败保留本地显示，不阻塞用户
    }
  }

  const publishPost = async (tag: string, content: string, images: string[]) => {
    setPublishing(false)
    try {
      const res = await createCommunityPost({ tag, content, images, author: '我', avatar: MY_AVATAR })
      if (res.success) {
        setPosts((ps) => [res.data, ...ps])
        return
      }
    } catch {
      // 落到本地兜底
    }
    setPosts((ps) => [
      {
        id: `p${Date.now()}`,
        author: '我',
        avatar: MY_AVATAR,
        time: '刚刚',
        tag,
        content,
        images,
        likes: 0,
        liked: false,
        comments: [],
      },
      ...ps,
    ])
  }

  const filtered = activeTag === '全部' ? posts : posts.filter((p) => p.tag === activeTag)
  const openPost = posts.find((p) => p.id === openId)

  return (
    <div className="px-4 pt-6 animate-fade-in">
      {/* 头部 */}
      <div className="flex items-center gap-2 mb-5">
        <Users className="text-accent-blue-light" size={22} />
        <h1 className="text-2xl font-bold text-white">社区</h1>
      </div>

      {/* 标签筛选 */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 -mx-4 px-4">
        {TAGS.map((t) => (
          <button
            key={t}
            onClick={() => setActiveTag(t)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeTag === t
                ? 'bg-accent-blue text-white shadow-[0_0_12px_rgba(59,130,246,0.4)]'
                : 'frosted-glass text-gray-400 hover:text-gray-200'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* 帖子流 */}
      {filtered.map((p) => (
        <PostCard key={p.id} post={p} onOpen={() => setOpenId(p.id)} onLike={() => toggleLike(p.id)} />
      ))}
      {filtered.length === 0 && (
        <div className="frosted-glass rounded-2xl p-10 text-center">
          <p className="text-sm text-gray-400">这个分类下还没有帖子</p>
        </div>
      )}

      {/* 详情（贴吧式全屏） */}
      {openPost && (
        <PostDetail post={openPost} onBack={() => setOpenId(null)} onLike={() => toggleLike(openPost.id)} onComment={addComment} />
      )}

      {/* Siri 液态流光发帖按钮 */}
      <SiriFab onClick={() => setPublishing(true)} />
      {publishing && <PublishSheet onClose={() => setPublishing(false)} onPublish={publishPost} />}
    </div>
  )
}
