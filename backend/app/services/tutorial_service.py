import json
import re
from typing import Any
from app.services.ai_client import ai_client, AIClientError


# 标准 5 步工序模板
STEP_TEMPLATE = [
    {
        "name": "补土",
        "purpose": "填补缝隙、缩胶，统一表面质感",
        "tools": ["补土（牙膏补土/AB补土）", "砂纸（400#-1000#）", "调色刀/牙签"],
        "tips": "薄涂多层，每次干透再打磨；注意零件结合处的缝隙处理",
        "caution": "补土未干透不要打磨，会粘砂纸",
    },
    {
        "name": "水口处理",
        "purpose": "修剪并打磨零件从板件上剪下的痕迹",
        "tools": ["模型剪（斜口钳）", "笔刀", "砂纸（600#-1200#）", "打磨板"],
        "tips": "剪水口时留 1-2mm 余量，再用笔刀削平，最后砂纸打磨；单向打磨避免划痕",
        "caution": "不要一刀剪平，容易发白或缺肉",
    },
    {
        "name": "拼接/假组",
        "purpose": "试装确认组合度，必要时修整，然后正式粘接",
        "tools": ["模型胶水（溜缝胶/黄盖）", "镊子", "假组胶带"],
        "tips": "先假组检查组合度，有问题先打磨修正；粘接时少涂胶，利用毛细作用",
        "caution": "胶水流到表面会腐蚀漆面，注意保护",
    },
    {
        "name": "上色",
        "purpose": "喷涂或手涂底漆、面漆，表现模型色彩",
        "tools": ["喷笔/手涂笔", "底漆（水补土）", "模型漆（油性/水性）", "调色皿", "口罩/通风设备"],
        "tips": "先喷水补土统一底色并检查瑕疵；薄喷多层，每层干透再喷下一层；注意色差和阴影",
        "caution": "油漆有毒，务必在通风环境操作并佩戴防护",
    },
    {
        "name": "做旧",
        "purpose": "通过渍洗、干扫、掉漆等手法表现真实质感和岁月痕迹",
        "tools": ["渍洗液（棕色/黑色）", "干扫笔", "掉漆液/海绵", "旧化粉彩", "棉签"],
        "tips": "渍洗后及时擦除多余部分；干扫用笔尖少量漆轻扫棱角；掉漆要自然随机",
        "caution": "做旧要克制，过犹不及，先从少量开始",
    },
]


def _get_generic_tutorial() -> dict:
    """通用兜底教程模板"""
    steps = []
    for s in STEP_TEMPLATE:
        steps.append({
            "name": s["name"],
            "description": s["purpose"],
            "tools": s["tools"],
            "tips": s["tips"],
            "caution": s["caution"],
        })
    return {
        "model_name": "通用拼装模型",
        "category": "通用",
        "steps": steps,
    }


SYSTEM_PROMPT_TUTORIAL = (
    "你是一位资深的模型制作导师，擅长拼装模型（高达、军模、手办等）的全程指导。"
    "模型信息通常来自 AI 对用户上传图片的识别结果。"
    "请在教程开头自然地呼应用户上传的模型（例如：“识别到你制作的是一架直升机模型”或“从图片看你做的应该是黑鹰直升机这类 1/35 军模”），"
    "并点出该类别模型的核心制作难点（如飞机的机身接缝与进气口、坦克的履带与负重轮、船舰的甲板栏杆、高达的水口与无缝等），"
    "然后按标准工序为该模型定制分步教程。每一步都要结合该模型的特点给出具体建议，不要太笼统。"
)


def _build_tutorial_user_prompt(model_info: dict) -> str:
    steps_desc = "\n".join(
        f"{i+1}. {s['name']}：{s['purpose']}。常用工具：{'、'.join(s['tools'])}"
        for i, s in enumerate(STEP_TEMPLATE)
    )
    return (
        f"模型信息（AI 图片识别结果）：\n"
        f"- 名称：{model_info.get('name', '未知')}\n"
        f"- 类别：{model_info.get('category', '未知')}\n"
        f"- 比例：{model_info.get('scale', '未知')}\n"
        f"- 难度：{model_info.get('difficulty', '未知')}\n"
        f"- 零件数：{model_info.get('parts_count', '未知')}\n"
        f"- 材质：{model_info.get('material', '未知')}\n"
        f"- 特点：{model_info.get('features', '未知')}\n\n"
        f"请按以下 5 个标准工序生成针对该模型的教程：\n{steps_desc}\n\n"
        f"定制化要求：\n"
        f"1. model_name 必须使用上面识别出的模型名称（禁止写“未知模型”）。\n"
        f"2. 第一步的 description 开头先用一句话回应用户，例如“识别到你制作的是直升机模型”，"
        f"并紧接着点出这类模型的核心制作难点（如机身接缝、旋翼结合、履带细节、甲板蚀刻片等，按实际类别）。\n"
        f"3. 每一步的 tips/caution 都要结合该模型类别的特征给建议，不要给通用套话。\n\n"
        f"返回严格的 JSON 格式，结构如下：\n"
        f'{{\n'
        f'  "model_name": "模型名称",\n'
        f'  "category": "类别",\n'
        f'  "steps": [\n'
        f'    {{\n'
        f'      "name": "步骤名",\n'
        f'      "description": "本步骤针对该模型的具体说明（2-4句）",\n'
        f'      "tools": ["工具1", "工具2"],\n'
        f'      "tips": "操作要点（针对该模型的具体建议）",\n'
        f'      "caution": "注意事项"\n'
        f'    }}\n'
        f'  ]\n'
        f'}}\n'
        f"只返回 JSON，不要有 markdown 标记或额外文字。"
    )


async def generate_tutorial(model_info: dict) -> dict:
    """根据模型信息生成教程，失败则返回兜底模板"""
    try:
        user_prompt = _build_tutorial_user_prompt(model_info)
        result = await ai_client.generate_text(SYSTEM_PROMPT_TUTORIAL, user_prompt, temperature=0.6)
        tutorial = _parse_json_result(result)
        # 校验结构
        if not isinstance(tutorial, dict) or "steps" not in tutorial or len(tutorial["steps"]) != 5:
            return _get_generic_tutorial()
        return tutorial
    except (AIClientError, Exception):
        return _get_generic_tutorial()


def _parse_json_result(text: str) -> Any:
    """从模型返回文本中解析 JSON（兼容 markdown 代码块）"""
    # 去除 markdown 代码块标记
    text = re.sub(r"```json\s*", "", text)
    text = re.sub(r"```\s*", "", text)
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # 尝试提取第一个 { 到最后一个 }
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1:
            try:
                return json.loads(text[start:end + 1])
            except json.JSONDecodeError:
                return {}
        return {}


# ---------- 对话服务 ----------

SYSTEM_PROMPT_CHAT = (
    "你是一位模型制作导师，正在指导用户完成模型制作的某个步骤。"
    "回答要具体、实用、有针对性，结合当前步骤给出建议。"
    "如果用户问题与当前步骤无关，也可以回答但要简洁。"
    "回答可以使用 Markdown 格式（加粗、列表、换行等）。"
)


async def chat_about_step(question: str, step_name: str, model_name: str) -> dict:
    """针对当前步骤的对话，返回 answer 和 keywords"""
    user_prompt = (
        f"当前模型：{model_name}\n"
        f"当前步骤：{step_name}\n"
        f"用户问题：{question}\n\n"
        f"请针对该步骤回答用户的问题，给出具体可操作的建议。\n"
        f"回答结束后，请另起一行输出关键词标记，格式为：【关键词:关键词1,关键词2,关键词3】\n"
        f"关键词应为模型制作相关术语（如：水口处理、做旧、上色、打磨等），最多 3 个。"
    )
    try:
        result = await ai_client.generate_text(SYSTEM_PROMPT_CHAT, user_prompt, temperature=0.7)
        return _split_answer_and_keywords(result, step_name)
    except AIClientError:
        return {
            "answer": "抱歉，AI 服务暂时不可用。建议：可以检查工具是否齐全，按教程要点操作，遇到问题多尝试几次。",
            "keywords": [step_name],
        }


SYSTEM_PROMPT_GUIDE = (
    "你是一位模型制作导购和导师，熟悉市面上的模型套件、工具材料和制作技法。"
    "用户会问你关于模型制作的各种问题，比如推荐入门模型、推荐工具、某个技法怎么做等。"
    "回答要实用、具体，给出明确的建议。语气友好，适合新手。"
    "回答可以使用 Markdown 格式（加粗、列表、换行等）。"
)


async def guide_chat(question: str) -> dict:
    """教程 Tab 的导购对话，返回 answer 和 keywords"""
    user_prompt = (
        f"用户问题：{question}\n\n"
        f"请回答用户的问题，给出具体实用的建议。\n"
        f"回答结束后，请另起一行输出关键词标记，格式为：【关键词:关键词1,关键词2,关键词3】\n"
        f"关键词应为模型制作相关术语（如：水口处理、做旧、上色、高达、军模等），最多 3 个。"
    )
    try:
        result = await ai_client.generate_text(SYSTEM_PROMPT_GUIDE, user_prompt, temperature=0.7)
        return _split_answer_and_keywords(result, question)
    except AIClientError:
        return {
            "answer": "抱歉，AI 服务暂时不可用。你可以稍后再试，或者检查网络和 API Key 配置。",
            "keywords": ["模型制作"],
        }


# ---------- AI 判作业 ----------

async def grade_work(
    model_name: str,
    step_name: str,
    step_desc: str,
    image_b64: str,
    image_type: str = "image/jpeg",
) -> dict:
    """
    AI 判作业：对学生提交的某一步制作成果照片评分。
    返回 {score, verdict: 'continue'|'rework', feedback}；失败抛异常由路由层转 _fail。
    """
    instruction = (
        f"你是一位严格但友善的模型制作导师，正在批改学生针对「{step_name}」这一步提交的作业照片。\n"
        f"模型：{model_name}\n"
        f"当前步骤：{step_name}\n"
        f"该步骤要求：{step_desc or '按标准工序完成该步骤'}\n\n"
        f"评分范围（严格限定）：\n"
        f"- 只评价「{step_name}」这一步的工艺完成质量，所有点评必须紧扣该步骤。\n"
        f"- 例如当前步骤是水口处理，就只评价水口剪除是否干净、有无发白缺肉、表面平整度；"
        f"是做旧就只评价做旧效果。不要评价模型其他步骤（如素组/拼装/上色等）的完成度。\n\n"
        f"请根据图片判断该步骤的完成质量，返回严格的 JSON：\n"
        f'{{\n'
        f'  "score": 0到100的整数，表示「{step_name}」这一步的完成度评分,\n'
        f'  "verdict": "continue"（这一步可以收工进入下一步）或 "rework"（这一步建议返工）,\n'
        f'  "feedback": "2-4句中文点评：先肯定「{step_name}」做得好的地方，再指出该步骤的具体问题，最后给1条针对该步骤的改进建议"\n'
        f'}}\n'
        f"评分参考：新手首次完成、达到基本要求即可给 70 分以上；有明显缺陷或遗漏给 40-69；"
        f"图片模糊或看不出与「{step_name}」相关的内容时 score 给 0，verdict 给 rework，"
        f"并在 feedback 中说明看不清该步骤的内容（不要转而去评价其他步骤）。\n"
        f"只返回 JSON，不要有 markdown 标记或额外文字。"
    )
    result = await ai_client.vision_json(instruction, image_b64, image_type)
    parsed = _parse_json_result(result)
    score = parsed.get("score") if isinstance(parsed, dict) else None
    verdict = str(parsed.get("verdict", "")).strip().lower() if isinstance(parsed, dict) else ""
    if not isinstance(score, (int, float)) or verdict not in ("continue", "rework"):
        raise ValueError("AI 返回的评分结果格式无效")
    feedback = str(parsed.get("feedback", "")).strip()
    return {
        "score": max(0, min(100, int(score))),
        "verdict": verdict,
        "feedback": feedback or "AI 未给出具体点评，建议对照步骤要点自查。",
    }


def _split_answer_and_keywords(text: str, fallback_topic: str) -> dict:
    """
    从 AI 返回文本中分离回答正文和关键词。
    AI 可能在末尾用 【关键词:xxx,yyy】 或 【KEYWORDS:xxx】 标记关键词。
    若未标记，则尝试从正文中提取，最终兜底用 fallback_topic。
    """
    keywords = []

    # 匹配 【关键词: ...】 或 【KEYWORDS: ...】 标记
    patterns = [
        r"【关键词[：:]\s*([^】]+)】",
        r"【KEYWORDS[：:]\s*([^】]+)】",
        r"\[关键词[：:]\s*([^\]]+)\]",
        r"关键词[：:]\s*([^\n]+)",
    ]
    for p in patterns:
        m = re.search(p, text)
        if m:
            raw = m.group(1)
            keywords = [k.strip() for k in re.split(r"[，,、\s]+", raw) if k.strip()]
            text = re.sub(p, "", text).strip()
            break

    # 兜底：从用户话题生成
    if not keywords:
        keywords = [fallback_topic] if fallback_topic else ["模型制作"]

    return {"answer": text.strip(), "keywords": keywords[:3]}
