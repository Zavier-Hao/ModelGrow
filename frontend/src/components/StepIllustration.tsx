import { useState } from 'react'

/** 步骤名 → 英文工艺关键词（用于生成贴合步骤内容的示例图） */
const EN_STEP: Array<[RegExp, string]> = [
  [/补土/, 'putty application and seam filling'],
  [/水口/, 'sprue gate cutting with nippers and sanding'],
  [/拼接|假组|粘接/, 'parts dry-fitting and glue assembly'],
  [/上色|喷涂|涂装/, 'airbrush painting and priming'],
  [/做旧|旧化/, 'weathering effects with wash and pigments'],
  [/打磨/, 'surface sanding with sandpaper'],
  [/渗线|渍洗/, 'panel line washing'],
]

interface Props {
  modelName: string
  stepName: string
}

/**
 * 步骤示例图：按「当前模型 + 当前步骤」生成贴合的工艺特写示意
 * 图片加载失败时静默隐藏，不影响教程主体
 */
export default function StepIllustration({ modelName, stepName }: Props) {
  const [failed, setFailed] = useState(false)

  if (failed) return null

  const enStep = EN_STEP.find(([re]) => re.test(stepName))?.[1] ?? stepName
  const prompt =
    `close-up tutorial photo of ${enStep} on a ${modelName} scale model kit, ` +
    'hobbyist workbench with modeling tools, realistic, highly detailed, shallow depth of field'
  const url = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=landscape_16_9`

  return (
    <div className="relative rounded-xl overflow-hidden mb-4 bg-white/5">
      <img
        src={url}
        alt={`${stepName} 示例`}
        loading="lazy"
        className="w-full h-40 object-cover"
        onError={() => setFailed(true)}
      />
      <span className="absolute bottom-2 left-2 text-[10px] px-2 py-0.5 rounded-full bg-black/60 text-gray-200 backdrop-blur-sm">
        示例 · {stepName}
      </span>
    </div>
  )
}
