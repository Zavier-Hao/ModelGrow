import type { ApiResponse, ModelInfo, Tutorial, ChatResult, BiliVideo, WorkGrade } from './types'

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
