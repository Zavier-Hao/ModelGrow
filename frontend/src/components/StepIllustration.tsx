import { useState } from 'react'

/** 步骤名关键词 → 本地工艺实拍图（public/steps/） */
const STEP_IMG: Array<[RegExp, string]> = [
  [/补土/, '/steps/putty.jpg'],
  [/水口/, '/steps/nipper.jpg'],
  [/打磨/, '/steps/sand.jpg'],
  [/拼接|假组|粘接|组装/, '/steps/assembly.jpg'],
  [/上色|喷涂|涂装/, '/steps/paint.jpg'],
  [/做旧|旧化|渍洗|渗线/, '/steps/weather.jpg'],
  [/渗线/, '/steps/panel.jpg'],
]

interface Props {
  modelName: string
  stepName: string
}

/** 步骤工艺示意：按步骤名匹配真实工序照片，没有匹配就不展示 */
export default function StepIllustration({ stepName }: Props) {
  const [failed, setFailed] = useState(false)
  const img = STEP_IMG.find(([re]) => re.test(stepName))?.[1]

  if (!img || failed) return null

  return (
    <div className="relative rounded-xl overflow-hidden mb-4 bg-white/5">
      <img
        src={img}
        alt={`${stepName} 工艺示意`}
        loading="lazy"
        className="w-full h-40 object-cover"
        onError={() => setFailed(true)}
      />
      <span className="absolute bottom-2 left-2 text-[10px] px-2 py-0.5 rounded-full bg-black/60 text-gray-200 backdrop-blur-sm">
        工艺示意 · {stepName}
      </span>
    </div>
  )
}
