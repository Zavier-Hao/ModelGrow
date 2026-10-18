import { useState, useEffect, useRef } from 'react'
import { Settings as SettingsIcon, ChevronRight, Moon, Info, Image as ImageIcon } from 'lucide-react'

export default function Settings() {
  const [nickname, setNickname] = useState(() => localStorage.getItem('nickname') || '模型玩家')
  const [avatar, setAvatar] = useState(() => localStorage.getItem('avatar') || '')
  const [darkMode, setDarkMode] = useState(true)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    localStorage.setItem('nickname', nickname)
  }, [nickname])

  useEffect(() => {
    if (avatar) localStorage.setItem('avatar', avatar)
  }, [avatar])

  const handleAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setAvatar(url)
    }
  }

  return (
    <div className="px-4 pt-6 animate-fade-in">
      <div className="flex items-center gap-2 mb-6">
        <SettingsIcon className="text-accent-blue-light" size={22} />
        <h1 className="text-2xl font-bold text-white">设置</h1>
      </div>

      {/* 个人信息卡片 */}
      <div className="frosted-glass rounded-2xl p-5 mb-6 flex items-center gap-4">
        <div className="relative">
          {avatar ? (
            <img src={avatar} alt="avatar" className="w-16 h-16 rounded-full object-cover border-2 border-accent-blue/40" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent-blue/40 to-purple-500/40 flex items-center justify-center text-2xl font-bold text-white">
              {nickname.charAt(0)}
            </div>
          )}
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-accent-blue flex items-center justify-center"
          >
            <ImageIcon size={14} className="text-white" />
          </button>
        </div>
        <div className="flex-1">
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="bg-transparent text-lg font-bold text-white outline-none w-full"
          />
          <p className="text-xs text-gray-500 mt-1">点击头像可更换，点击昵称可编辑</p>
        </div>
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />

      {/* 设置项列表 */}
      <div className="frosted-glass rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <Moon size={18} className="text-accent-blue-light" />
            <span className="text-sm text-gray-200">深色模式</span>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`w-11 h-6 rounded-full transition-colors ${darkMode ? 'bg-accent-blue' : 'bg-gray-600'}`}
          >
            <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${darkMode ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>

        <button className="w-full flex items-center justify-between px-4 py-3.5 border-b border-white/5 hover:bg-white/5">
          <div className="flex items-center gap-3">
            <Info size={18} className="text-gray-400" />
            <span className="text-sm text-gray-200">关于我们</span>
          </div>
          <ChevronRight size={16} className="text-gray-500" />
        </button>

        <div className="px-4 py-3.5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">版本</span>
            <span className="text-xs text-gray-500">v0.1.0</span>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-gray-600 mt-8">ModelGrow · 让模型制作更简单</p>
    </div>
  )
}
