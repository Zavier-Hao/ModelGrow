export interface ModelInfo {
  name: string
  category: string
  scale: string
  difficulty: string
  parts_count: string
  material: string
  features: string
}

export interface TutorialStep {
  name: string
  description: string
  tools: string[]
  tips: string
  caution: string
}

export interface Tutorial {
  model_name: string
  category: string
  steps: TutorialStep[]
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  error: string | null
}

export interface ChatResult {
  answer: string
  keywords: string[]
}

export interface BiliVideo {
  title: string
  author: string
  cover: string
  duration: string
  play: number
  bvid: string
  url: string
}

export interface WorkGrade {
  /** 完成度评分 0-100 */
  score: number
  /** continue = 可以进入下一步，rework = 建议返工 */
  verdict: 'continue' | 'rework'
  feedback: string
}
