import base64
import httpx
from typing import Optional
from app.config import config


class AIClientError(Exception):
    """AI 调用异常"""
    pass


class AIClient:
    """AI 服务客户端，封装国内大模型 API（默认通义千问 DashScope）"""

    def __init__(self):
        self.api_key = config.AI_API_KEY
        self.base_url = config.AI_BASE_URL
        self.vision_model = config.VISION_MODEL
        self.text_model = config.TEXT_MODEL

    @property
    def headers(self):
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    async def _chat_completion(self, model: str, messages: list, temperature: float = 0.7) -> str:
        """通用 chat completion 调用"""
        if not self.api_key or self.api_key in ("your_api_key_here", ""):
            raise AIClientError("未配置有效的 AI_API_KEY")

        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
        }
        url = f"{self.base_url}/chat/completions"

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                resp = await client.post(url, json=payload, headers=self.headers)
                if resp.status_code != 200:
                    raise AIClientError(f"API 调用失败 {resp.status_code}: {resp.text}")
                data = resp.json()
                return data["choices"][0]["message"]["content"]
        except httpx.RequestError as e:
            raise AIClientError(f"网络请求失败: {str(e)}")

    async def recognize_model(self, image_b64: str, image_type: str = "image/jpeg") -> str:
        """
        视觉识别：根据模型图片识别模型类型、比例、特征
        image_b64: 不含 data: 前缀的纯 base64 字符串
        """
        data_url = f"data:{image_type};base64,{image_b64}"
        prompt = (
            "你是一个模型制作专家。请识别这张图片中的拼装模型，并返回以下信息（用 JSON 格式）：\n"
            '{\n'
            '  "name": "模型名称。规则：能确认具体套件时写「品牌+比例+型号」（如：小鹰 1/35 UH-60 黑鹰直升机、田宫 1/35 虎式坦克）；'
            '只能判断类型时写「类别名+模型」（如：直升机模型、四号坦克模型、高达模型、战列舰模型）；'
            '禁止写“未知模型”或“未知”",\n'
            '  "category": "模型类别（军模/高达/手办/民用车辆/科幻等）",\n'
            '  "scale": "比例（如 1/35、1/48、1/144，未知则写未知）",\n'
            '  "difficulty": "制作难度（入门/中等/进阶）",\n'
            '  "parts_count": "大致零件数量（估算）",\n'
            '  "material": "主要材质（塑料/树脂/金属等）",\n'
            '  "features": "该模型或该类别模型的特点与制作难点，例如飞机的机身接缝与进气口、坦克的履带负重轮、船舰的甲板栏杆与蚀刻片等，简短描述"\n'
            '}\n'
            "只返回 JSON，不要有额外文字。"
        )
        messages = [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": data_url}},
                ],
            }
        ]
        return await self._chat_completion(self.vision_model, messages, temperature=0.3)

    async def vision_json(self, instruction: str, image_b64: str, image_type: str = "image/jpeg") -> str:
        """通用视觉+指令调用：对图片执行结构化识别任务（如判作业），返回原始文本"""
        data_url = f"data:{image_type};base64,{image_b64}"
        messages = [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": instruction},
                    {"type": "image_url", "image_url": {"url": data_url}},
                ],
            }
        ]
        return await self._chat_completion(self.vision_model, messages, temperature=0.3)

    async def generate_text(self, system_prompt: str, user_prompt: str, temperature: float = 0.7) -> str:
        """文本生成：系统提示 + 用户提示"""
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]
        return await self._chat_completion(self.text_model, messages, temperature=temperature)


ai_client = AIClient()
