import json
import sqlite3
import threading
import time
from typing import Any

DB_PATH = None  # 延迟初始化，main 引入时赋值
_lock = threading.Lock()
_conn: sqlite3.Connection | None = None


def init(db_path: str):
    global DB_PATH, _conn
    DB_PATH = db_path
    _conn = sqlite3.connect(db_path, check_same_thread=False)
    _conn.row_factory = sqlite3.Row
    _conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS posts (
            id TEXT PRIMARY KEY,
            author TEXT NOT NULL,
            avatar TEXT NOT NULL,
            tag TEXT NOT NULL,
            content TEXT NOT NULL,
            images TEXT NOT NULL DEFAULT '[]',
            likes INTEGER NOT NULL DEFAULT 0,
            liked INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS comments (
            id TEXT PRIMARY KEY,
            post_id TEXT NOT NULL,
            author TEXT NOT NULL,
            avatar TEXT NOT NULL,
            content TEXT NOT NULL,
            reply_to TEXT,
            created_at TEXT NOT NULL
        );
        """
    )
    _conn.commit()
    _seed_if_empty()


def _seed_if_empty():
    """首次启动时灌入初始帖子"""
    n = _conn.execute("SELECT COUNT(*) FROM posts").fetchone()[0]
    if n > 0:
        return
    for p in SEED_POSTS:
        _conn.execute(
            "INSERT INTO posts (id, author, avatar, tag, content, images, likes, liked, created_at) VALUES (?,?,?,?,?,?,?,0,?)",
            (p["id"], p["author"], p["avatar"], p["tag"], p["content"], json.dumps(p["images"]), p["likes"], p["time"]),
        )
        for c in p["comments"]:
            _conn.execute(
                "INSERT INTO comments (id, post_id, author, avatar, content, reply_to, created_at) VALUES (?,?,?,?,?,?,?)",
                (c["id"], p["id"], c["author"], c["avatar"], c["content"], c.get("replyTo"), c["time"]),
            )
    _conn.commit()


def _post_row_to_dict(row) -> dict:
    return {
        "id": row["id"],
        "author": row["author"],
        "avatar": row["avatar"],
        "tag": row["tag"],
        "content": row["content"],
        "images": json.loads(row["images"]),
        "likes": row["likes"],
        "liked": bool(row["liked"]),
        "time": row["created_at"],
    }


def _comment_rows(post_id: str) -> list:
    rows = _conn.execute(
        "SELECT * FROM comments WHERE post_id = ? ORDER BY rowid ASC", (post_id,)
    ).fetchall()
    return [
        {
            "id": r["id"],
            "author": r["author"],
            "avatar": r["avatar"],
            "content": r["content"],
            "replyTo": r["reply_to"] or None,
            "time": r["created_at"],
        }
        for r in rows
    ]


def list_posts() -> list:
    with _lock:
        rows = _conn.execute("SELECT * FROM posts ORDER BY created_at DESC, rowid DESC").fetchall()
        posts = [_post_row_to_dict(r) for r in rows]
    for p in posts:
        p["comments"] = _comment_rows(p["id"])
    return posts


def create_post(author: str, avatar: str, tag: str, content: str, images: list) -> dict:
    pid = f"p{int(time.time() * 1000)}"
    created = time.strftime("%Y-%m-%d %H:%M")
    with _lock:
        _conn.execute(
            "INSERT INTO posts (id, author, avatar, tag, content, images, likes, liked, created_at) VALUES (?,?,?,?,?,?,0,0,?)",
            (pid, author, avatar, tag, content, json.dumps(images), created),
        )
        _conn.commit()
    return {
        "id": pid, "author": author, "avatar": avatar, "tag": tag, "content": content,
        "images": images, "likes": 0, "liked": False, "time": created, "comments": [],
    }


def set_like(post_id: str, liked: bool) -> dict | None:
    with _lock:
        row = _conn.execute("SELECT likes, liked FROM posts WHERE id = ?", (post_id,)).fetchone()
        if not row:
            return None
        delta = 0
        if liked and not row["liked"]:
            delta = 1
        elif not liked and row["liked"]:
            delta = -1
        likes = max(0, row["likes"] + delta)
        _conn.execute("UPDATE posts SET likes = ?, liked = ? WHERE id = ?", (likes, int(liked), post_id))
        _conn.commit()
    return {"likes": likes, "liked": liked}


def add_comment(post_id: str, author: str, avatar: str, content: str, reply_to: str | None) -> dict | None:
    with _lock:
        exists = _conn.execute("SELECT 1 FROM posts WHERE id = ?", (post_id,)).fetchone()
        if not exists:
            return None
        cid = f"c{int(time.time() * 1000)}"
        created = time.strftime("%Y-%m-%d %H:%M")
        _conn.execute(
            "INSERT INTO comments (id, post_id, author, avatar, content, reply_to, created_at) VALUES (?,?,?,?,?,?,?)",
            (cid, post_id, author, avatar, content, reply_to, created),
        )
        _conn.commit()
    return {"id": cid, "author": author, "avatar": avatar, "content": content, "replyTo": reply_to, "time": created}


# ---------- 种子数据（与前端 communityPosts.ts 保持一致） ----------
A = "/community/avatars"
SEED_POSTS = [
    {
        "id": "post1", "author": "半夜不睡觉的猫", "avatar": f"{A}/a7.jpg", "time": "2025-03-08",
        "tag": "素组打卡",
        "content": "3D打印的虎式初期型下地了，打印件的层纹比水口还难搞，400→800→1200 目砂纸一路磨下来，履带活动链接也是折磨。附一张工作台现状，下周开始上色，大家帮我看看还有哪里需要整形的？",
        "images": ["/community/p1.jpg"], "likes": 87,
        "comments": [
            {"id": "c11", "author": "阿宅快乐水", "avatar": f"{A}/a9.jpg", "content": "老哥这个履带是活动链接还是一体件？", "time": "2025-03-08"},
            {"id": "c12", "author": "半夜不睡觉的猫", "avatar": f"{A}/a7.jpg", "content": "活动链接，36节一节节剪的，剪到手抽筋", "time": "2025-03-09", "replyTo": "阿宅快乐水"},
            {"id": "c13", "author": "晚风踩着云朵", "avatar": f"{A}/a3.jpg", "content": "车体首上的铸造纹理好赞，用什么整的形？", "time": "2025-03-09"},
            {"id": "c14", "author": "滑稽本稽", "avatar": f"{A}/a11.jpg", "content": "看到层纹已经开始手酸了，这是真大佬", "time": "2025-03-10"},
        ],
    },
    {
        "id": "post2", "author": "奶油小方", "avatar": f"{A}/a6.jpg", "time": "2025-03-12",
        "tag": "新手求助",
        "content": "人生第一个高达 RX-78-2 素组完成！但是水口处理翻车现场太多了，好几处发白，用笔刀刮了一层又一层的膏，求各位大佬指点怎么补救 😭",
        "images": ["/community/p2.jpg"], "likes": 43,
        "comments": [
            {"id": "c21", "author": "摸鱼协会会长", "avatar": f"{A}/a8.jpg", "content": "发白别慌，800目轻磨+渗线笔补一下基本看不出来", "time": "2025-03-12"},
            {"id": "c22", "author": "风见悠一", "avatar": f"{A}/a4.jpg", "content": "下次剪水口留0.2mm余量再削，别贴根剪", "time": "2025-03-12"},
            {"id": "c23", "author": "奶油小方", "avatar": f"{A}/a6.jpg", "content": "学到了，第二盒已经安排上", "time": "2025-03-13"},
            {"id": "c24", "author": "桃子气泡水", "avatar": f"{A}/a2.jpg", "content": "我第一次做直接把天线剪没了哈哈", "time": "2025-03-14"},
        ],
    },
    {
        "id": "post3", "author": "风见悠一", "avatar": f"{A}/a4.jpg", "time": "2025-03-15",
        "tag": "上色交流",
        "content": "第一套喷泵到家，压力表这个读数是不是有点飘？涂料稀释比例 1:1.5 稠了还是稀了？附上泵的照片，求前辈指点新手参数",
        "images": ["/community/p3.jpg"], "likes": 65,
        "comments": [
            {"id": "c31", "author": "老白干加冰", "avatar": f"{A}/a10.jpg", "content": "压力调到 0.15-0.2MPa 喷面，稀释到牛奶状就差不多了", "time": "2025-03-15"},
            {"id": "c32", "author": "风见悠一", "avatar": f"{A}/a4.jpg", "content": "明白，今晚就试", "time": "2025-03-16", "replyTo": "老白干加冰"},
            {"id": "c33", "author": "不吃香菜喵", "avatar": f"{A}/a1.jpg", "content": "记得加防堵剂，不然三天两头洗笔", "time": "2025-03-16"},
        ],
    },
    {
        "id": "post4", "author": "晚风踩着云朵", "avatar": f"{A}/a3.jpg", "time": "2025-03-19",
        "tag": "做旧",
        "content": "1/700 俾斯麦进度更新，甲板木纹贴完了，第一次尝试渍洗做旧，舰舯的锈渍还是下手重了，下次轻一点。有舰船佬指点下渍洗液浓度吗？",
        "images": ["/community/p4.jpg"], "likes": 112,
        "comments": [
            {"id": "c41", "author": "打不过就加入", "avatar": f"{A}/a5.jpg", "content": "锈渍重了就再压一层浅色，别急着擦掉重来", "time": "2025-03-20"},
            {"id": "c42", "author": "晚风踩着云朵", "avatar": f"{A}/a3.jpg", "content": "好思路，明天试试", "time": "2025-03-20", "replyTo": "打不过就加入"},
            {"id": "c43", "author": "阿宅快乐水", "avatar": f"{A}/a9.jpg", "content": "渍洗液1:3先薄薄来一遍，别学我直接糊上去", "time": "2025-03-21"},
        ],
    },
    {
        "id": "post5", "author": "打不过就加入", "avatar": f"{A}/a5.jpg", "time": "2025-03-24",
        "tag": "素组打卡",
        "content": "1/48 黑鹰直升机，旋翼根部接缝用补土填了三遍才平，机身和短翼的结合缝也算交代过去了。旋翼党是真的少，同好冒个头？",
        "images": ["/community/p5.jpg"], "likes": 38,
        "comments": [
            {"id": "c51", "author": "打不过就加入", "avatar": f"{A}/a5.jpg", "content": "补个小技巧：补土别一次堆满，薄涂多遍不容易塌", "time": "2025-03-24"},
            {"id": "c52", "author": "铁锅炖自己", "avatar": f"{A}/a12.jpg", "content": "旋翼党+1，就是小零件丢了第二天就找不到", "time": "2025-03-25"},
        ],
    },
    {
        "id": "post6", "author": "铁锅炖自己", "avatar": f"{A}/a12.jpg", "time": "2025-03-28",
        "tag": "工具分享",
        "content": "给新手整理的水口钳/笔刀/打磨条入门清单，工具不求贵但求顺手，全部下来不到两百块。有没有想要链接的，评论区扣1",
        "images": ["/community/p6.jpg"], "likes": 95,
        "comments": [
            {"id": "c61", "author": "奶油小方", "avatar": f"{A}/a6.jpg", "content": "扣1！水口钳选薄刃还是单刃？", "time": "2025-03-28"},
            {"id": "c62", "author": "铁锅炖自己", "avatar": f"{A}/a12.jpg", "content": "新手单刃够了，薄刃剪流道容易崩口", "time": "2025-03-29", "replyTo": "奶油小方"},
            {"id": "c63", "author": "摸鱼协会会长", "avatar": f"{A}/a8.jpg", "content": "补一个切割垫，桌面保命神器", "time": "2025-03-30"},
        ],
    },
]
