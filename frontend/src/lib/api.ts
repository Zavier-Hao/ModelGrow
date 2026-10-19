import type { ApiResponse, ModelInfo, Tutorial, ChatResult, BiliVideo, WorkGrade } from './types'
import type { Post, CommentItem } from '../data/communityPosts'

// 跟随访问主机名，IP 直连也能请求到后端
const API_BASE =
  import.meta.env.VITE_API_BASE || `http://${window.location.hostname}:3000`

// AI 接口慢，超时就报错重试，别一直转圈
const AI_TIMEOUT = 150_000
const CHAT_TIMEOUT = 60_000
const SEARCH_TIMEOUT = 20_000

export async function analyzeModel(file: File): Promise<ApiResponse<ModelInfo>> {
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch(`${API_BASE}/api/model/analyze`, {
    method: 'POST',
    body: formData,
    signal: AbortSignal.timeout(AI_TIMEOUT),
  })
  return res.json()
}

export async function generateTutorial(
  modelInfo: ModelInfo
): Promise<ApiResponse<Tutorial>> {
  const res = await fetch(`${API_BASE}/api/tutorial/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model_info: modelInfo }),
    signal: AbortSignal.timeout(AI_TIMEOUT),
  })
  return res.json()
}

export async function chatStep(
  question: string,
  stepName: string,
  modelName: string
): Promise<ApiResponse<ChatResult>> {
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, step_name: stepName, model_name: modelName }),
    signal: AbortSignal.timeout(CHAT_TIMEOUT),
  })
  return res.json()
}

export async function guideChat(
  question: string
): Promise<ApiResponse<ChatResult>> {
  const res = await fetch(`${API_BASE}/api/tutorial/guide`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
    signal: AbortSignal.timeout(CHAT_TIMEOUT),
  })
  return res.json()
}

export async function searchBilibili(keyword: string): Promise<ApiResponse<{ videos: BiliVideo[]; keyword: string }>> {
  const res = await fetch(`${API_BASE}/api/bilibili/search?keyword=${encodeURIComponent(keyword)}`, {
    signal: AbortSignal.timeout(SEARCH_TIMEOUT),
  })
  return res.json()
}

export async function gradeWork(
  file: File,
  ctx: { modelName: string; stepName: string; stepDesc?: string }
): Promise<ApiResponse<WorkGrade>> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('model_name', ctx.modelName)
  formData.append('step_name', ctx.stepName)
  if (ctx.stepDesc) formData.append('step_desc', ctx.stepDesc)
  const res = await fetch(`${API_BASE}/api/tutorial/grade`, {
    method: 'POST',
    body: formData,
    signal: AbortSignal.timeout(AI_TIMEOUT),
  })
  return res.json()
}

// ---------- 社区（SQLite 持久化） ----------

export async function getCommunityPosts(): Promise<ApiResponse<{ posts: Post[] }>> {
  const res = await fetch(`${API_BASE}/api/community/posts`, {
    signal: AbortSignal.timeout(SEARCH_TIMEOUT),
  })
  return res.json()
}

export async function createCommunityPost(p: {
  tag: string
  content: string
  images: string[]
  author: string
  avatar: string
}): Promise<ApiResponse<Post>> {
  const res = await fetch(`${API_BASE}/api/community/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(p),
    signal: AbortSignal.timeout(SEARCH_TIMEOUT),
  })
  return res.json()
}

export async function toggleCommunityLike(
  id: string,
  liked: boolean
): Promise<ApiResponse<{ likes: number; liked: boolean }>> {
  const res = await fetch(`${API_BASE}/api/community/posts/${id}/like`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ liked }),
    signal: AbortSignal.timeout(SEARCH_TIMEOUT),
  })
  return res.json()
}

export async function addCommunityComment(
  id: string,
  c: { content: string; author: string; avatar: string; replyTo?: string }
): Promise<ApiResponse<CommentItem>> {
  const res = await fetch(`${API_BASE}/api/community/posts/${id}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(c),
    signal: AbortSignal.timeout(SEARCH_TIMEOUT),
  })
  return res.json()
}
