import type { ApiResponse, ModelInfo, Tutorial, ChatResult, BiliVideo, WorkGrade } from './types'

/** 后端地址：默认跟随当前访问的主机名（支持 IP+端口 局域网访问），端口固定 3000 */
const API_BASE =
  import.meta.env.VITE_API_BASE || `http://${window.location.hostname}:3000`

/** AI 请求超时：超时后 fetch 抛 AbortError，由调用方展示重试，避免界面永久卡住 */
const AI_TIMEOUT = 150_000

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
  })
  return res.json()
}

export async function searchBilibili(keyword: string): Promise<ApiResponse<{ videos: BiliVideo[]; keyword: string }>> {
  const res = await fetch(`${API_BASE}/api/bilibili/search?keyword=${encodeURIComponent(keyword)}`)
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
