import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "siliconflow")

    # 通用 API Key（兼容 OpenAI 格式的供应商都用这个）
    AI_API_KEY: str = os.getenv("AI_API_KEY", os.getenv("DASHSCOPE_API_KEY", ""))

    # API Base URL（OpenAI 兼容格式）
    AI_BASE_URL: str = os.getenv(
        "AI_BASE_URL",
        "https://api.siliconflow.cn/v1" if AI_PROVIDER == "siliconflow"
        else "https://dashscope.aliyuncs.com/compatible-mode/v1",
    )

    # 模型名称（默认硅基流动免费模型）
    VISION_MODEL: str = os.getenv("VISION_MODEL", "Qwen/Qwen2.5-VL-7B-Instruct")
    TEXT_MODEL: str = os.getenv("TEXT_MODEL", "Qwen/Qwen2.5-7B-Instruct")


config = Config()
