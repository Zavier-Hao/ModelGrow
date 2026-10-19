import base64
import httpx
from typing import Optional
from pydantic import BaseModel, ConfigDict
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Query
from fastapi.responses import Response

from app.services.ai_client import ai_client, AIClientError
from app.services import community_store
from app.services.tutorial_service import (
    generate_tutorial,
    chat_about_step,
    guide_chat,
    grade_work,
    _parse_json_result,
)

router = APIRouter(prefix="/api", tags=["modelgrow"])


class ModelInfo(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    name: str = "未知模型"
    category: str = "未知"
    scale: str = "未知"
    difficulty: str = "未知"
    parts_count: str = "未知"
    material: str = "未知"
    features: str = ""


class GenerateRequest(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    model_info: ModelInfo


class ChatRequest(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    question: str
    step_name: Optional[str] = None
    model_name: Optional[str] = None


class GuideRequest(BaseModel):
    question: str


class CommunityPostIn(BaseModel):
    tag: str
    content: str
    images: list[str] = []
    author: str = "我"
    avatar: str = ""


class CommunityLikeIn(BaseModel):
    liked: bool


class CommunityCommentIn(BaseModel):
    content: str
    author: str = "我"
    avatar: str = ""
    reply_to: Optional[str] = None


def _success(data):
    return {"success": True, "data": data, "error": None}


def _fail(error: str):
    return {"success": False, "data": None, "error": error}


@router.post("/model/analyze")
async def analyze_model(file: UploadFile = File(...)):
    """上传模型图片，返回视觉识别结果"""
    try:
        contents = await file.read()
        if not contents:
            return _fail("图片为空")

        image_b64 = base64.b64encode(contents).decode("utf-8")
        image_type = file.content_type or "image/jpeg"

        result_text = await ai_client.recognize_model(image_b64, image_type)
        parsed = _parse_json_result(result_text)

        if not parsed:
            # 识别失败返回通用信息，让教程生成走兜底
            parsed = {
                "name": "拼装模型",
                "category": "通用",
                "scale": "未知",
                "difficulty": "未知",
                "parts_count": "未知",
                "material": "塑料",
                "features": "未能识别具体特征",
            }
        return _success(parsed)
    except AIClientError as e:
        # AI 失败时返回通用模型信息，前端仍可生成兜底教程
        return _success({
            "name": "拼装模型",
            "category": "通用",
            "scale": "未知",
            "difficulty": "未知",
            "parts_count": "未知",
            "material": "塑料",
            "features": "",
        })
    except Exception as e:
        return _fail(f"识别失败: {str(e)}")


@router.post("/tutorial/generate")
async def generate_tutorial_api(req: GenerateRequest):
    """根据模型信息生成 5 步教程"""
    tutorial = await generate_tutorial(req.model_info.model_dump())
    return _success(tutorial)


@router.post("/chat")
async def chat_api(req: ChatRequest):
    """针对当前步骤的对话"""
    if not req.question.strip():
        return _fail("问题不能为空")
    result = await chat_about_step(
        question=req.question,
        step_name=req.step_name or "未指定步骤",
        model_name=req.model_name or "未指定模型",
    )
    return _success(result)


@router.post("/tutorial/guide")
async def guide_api(req: GuideRequest):
    """教程 Tab 的导购对话"""
    if not req.question.strip():
        return _fail("问题不能为空")
    result = await guide_chat(req.question)
    return _success(result)


@router.post("/tutorial/grade")
async def grade_work_api(
    file: UploadFile = File(...),
    model_name: str = Form("未指定模型"),
    step_name: str = Form("未指定步骤"),
    step_desc: str = Form(""),
):
    """AI 判作业：对某一步的制作成果拍照/上传图片，AI 打分并建议返工或继续"""
    try:
        contents = await file.read()
        if not contents:
            return _fail("图片为空")
        image_b64 = base64.b64encode(contents).decode("utf-8")
        image_type = file.content_type or "image/jpeg"
        result = await grade_work(model_name, step_name, step_desc, image_b64, image_type)
        return _success(result)
    except Exception as e:
        msg = str(e)
        if "402" in msg or "balance is insufficient" in msg:
            return _fail("AI 服务额度不足，请为硅基流动账户充值后再试")
        if "Model does not exist" in msg:
            return _fail("AI 视觉模型配置无效，请检查 VISION_MODEL 配置")
        return _fail(f"评分失败: {msg}")


@router.get("/community/posts")
async def community_posts():
    """社区帖子流（含跟帖），新帖在前"""
    return _success({"posts": community_store.list_posts()})


@router.post("/community/posts")
async def community_create_post(req: CommunityPostIn):
    if not req.content.strip():
        return _fail("内容不能为空")
    post = community_store.create_post(
        req.author or "我",
        req.avatar or "/community/avatars/a6.jpg",
        req.tag or "素组打卡",
        req.content.strip(),
        req.images[:4],
    )
    return _success(post)


@router.post("/community/posts/{post_id}/like")
async def community_like(post_id: str, req: CommunityLikeIn):
    result = community_store.set_like(post_id, req.liked)
    if result is None:
        return _fail("帖子不存在")
    return _success(result)


@router.post("/community/posts/{post_id}/comments")
async def community_comment(post_id: str, req: CommunityCommentIn):
    if not req.content.strip():
        return _fail("评论内容不能为空")
    comment = community_store.add_comment(
        post_id,
        req.author or "我",
        req.avatar or "/community/avatars/a6.jpg",
        req.content.strip(),
        req.reply_to,
    )
    if comment is None:
        return _fail("帖子不存在")
    return _success(comment)


@router.get("/bilibili/search")
async def bilibili_search(keyword: str = Query(..., description="搜索关键词")):
    """代理 B站视频搜索，返回前 3 条视频（避开前端 CORS 限制）"""
    url = "https://api.bilibili.com/x/web-interface/search/all"
    params = {
        "keyword": keyword,
        "page": 1,
    }
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://www.bilibili.com",
    }
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(url, params=params, headers=headers)
            data = resp.json()

        if data.get("code") != 0:
            return _fail(f"B站搜索失败: {data.get('message', '未知错误')}")

        results = data.get("data", {}).get("result", {}).get("video", [])[:3]
        videos = []
        for item in results:
            pic = item.get("pic", "")
            if pic and pic.startswith("//"):
                pic = "https:" + pic
            videos.append({
                "title": _strip_html(item.get("title", "")),
                "author": item.get("author", ""),
                "cover": pic,
                "duration": item.get("duration", ""),
                "play": item.get("play", 0),
                "bvid": item.get("bvid", ""),
                "url": f"https://www.bilibili.com/video/{item.get('bvid', '')}",
            })
        return _success({"videos": videos, "keyword": keyword})
    except Exception as e:
        return _fail(f"B站搜索异常: {str(e)}")


def _strip_html(text: str) -> str:
    """去除 B站返回标题中的 <em> 等高亮标签"""
    import re
    return re.sub(r"<[^>]+>", "", text)


@router.get("/bilibili/proxy-image")
async def bilibili_proxy_image(url: str = Query(..., description="图片URL")):
    """代理 B站图片，绕过前端防盗链限制"""
    if not url.startswith(("http://", "https://")):
        return _fail("无效的图片URL")
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": "https://www.bilibili.com",
    }
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(url, headers=headers)
            if resp.status_code != 200:
                return _fail(f"图片加载失败: {resp.status_code}")
            return Response(
                content=resp.content,
                media_type=resp.headers.get("content-type", "image/jpeg"),
            )
    except Exception as e:
        return _fail(f"图片代理异常: {str(e)}")
