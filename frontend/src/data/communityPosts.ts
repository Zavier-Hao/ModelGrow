﻿export interface CommentItem {
  id: string
  author: string
  avatar: string
  content: string
  time: string
  /** 楼中楼回复对象名 */
  replyTo?: string
}

export interface Post {
  id: string
  author: string
  avatar: string
  time: string
  tag: string
  content: string
  images: string[]
  likes: number
  liked: boolean
  comments: CommentItem[]
}

export const TAGS = ['全部', '素组打卡', '上色交流', '做旧', '新手求助', '工具分享']

/** 「我」的头像（发帖/评论时用） */
export const MY_AVATAR = '/community/avatars/a6.jpg'

const AV = {
  cat: '/community/avatars/a7.jpg', // 半夜不睡觉的猫
  chibi: '/community/avatars/a6.jpg', // 奶油小方
  boy1: '/community/avatars/a4.jpg', // 风见悠一
  girl3: '/community/avatars/a3.jpg', // 晚风踩着云朵
  boy2: '/community/avatars/a5.jpg', // 打不过就加入
  panda: '/community/avatars/a12.jpg', // 铁锅炖自己
  grumpy: '/community/avatars/a8.jpg', // 摸鱼协会会长
  doge: '/community/avatars/a9.jpg', // 阿宅快乐水
  girl2: '/community/avatars/a2.jpg', // 桃子气泡水
  girl1: '/community/avatars/a1.jpg', // 不吃香菜喵
  emoji: '/community/avatars/a11.jpg', // 滑稽本稽
  hamster: '/community/avatars/a10.jpg', // 老白干加冰
}

/**
 * 模拟社区帖子：2025 年 3 月发帖时间、二次元/梗图混杂头像、配图 /community/p1-p6.jpg
 */
export const INITIAL_POSTS: Post[] = [
  {
    id: 'post1',
    author: '半夜不睡觉的猫',
    avatar: AV.cat,
    time: '2025-03-08',
    tag: '素组打卡',
    content:
      '3D打印的虎式初期型下地了，打印件的层纹比水口还难搞，400→800→1200 目砂纸一路磨下来，履带活动链接也是折磨。附一张工作台现状，下周开始上色，大家帮我看看还有哪里需要整形的？',
    images: ['/community/p1.jpg'],
    likes: 87,
    liked: false,
    comments: [
      { id: 'c11', author: '阿宅快乐水', avatar: AV.doge, content: '老哥这个履带是活动链接还是一体件？', time: '2025-03-08' },
      { id: 'c12', author: '半夜不睡觉的猫', avatar: AV.cat, content: '活动链接，36节一节节剪的，剪到手抽筋', time: '2025-03-09', replyTo: '阿宅快乐水' },
      { id: 'c13', author: '晚风踩着云朵', avatar: AV.girl3, content: '车体首上的铸造纹理好赞，用什么整的形？', time: '2025-03-09' },
      { id: 'c14', author: '滑稽本稽', avatar: AV.emoji, content: '看到层纹已经开始手酸了，这是真大佬', time: '2025-03-10' },
    ],
  },
  {
    id: 'post2',
    author: '奶油小方',
    avatar: AV.chibi,
    time: '2025-03-12',
    tag: '新手求助',
    content:
      '人生第一个高达 RX-78-2 素组完成！但是水口处理翻车现场太多了，好几处发白，用笔刀刮了一层又一层的膏，求各位大佬指点怎么补救 😭',
    images: ['/community/p2.jpg'],
    likes: 43,
    liked: false,
    comments: [
      { id: 'c21', author: '摸鱼协会会长', avatar: AV.grumpy, content: '发白别慌，800目轻磨+渗线笔补一下基本看不出来', time: '2025-03-12' },
      { id: 'c22', author: '风见悠一', avatar: AV.boy1, content: '下次剪水口留0.2mm余量再削，别贴根剪', time: '2025-03-12' },
      { id: 'c23', author: '奶油小方', avatar: AV.chibi, content: '学到了，第二盒已经安排上', time: '2025-03-13' },
      { id: 'c24', author: '桃子气泡水', avatar: AV.girl2, content: '我第一次做直接把天线剪没了哈哈', time: '2025-03-14' },
    ],
  },
  {
    id: 'post3',
    author: '风见悠一',
    avatar: AV.boy1,
    time: '2025-03-15',
    tag: '上色交流',
    content:
      '第一套喷泵到家，压力表这个读数是不是有点飘？涂料稀释比例 1:1.5 稠了还是稀了？附上泵的照片，求前辈指点新手参数',
    images: ['/community/p3.jpg'],
    likes: 65,
    liked: false,
    comments: [
      { id: 'c31', author: '老白干加冰', avatar: AV.hamster, content: '压力调到 0.15-0.2MPa 喷面，稀释到牛奶状就差不多了', time: '2025-03-15' },
      { id: 'c32', author: '风见悠一', avatar: AV.boy1, content: '明白，今晚就试', time: '2025-03-16', replyTo: '老白干加冰' },
      { id: 'c33', author: '不吃香菜喵', avatar: AV.girl1, content: '记得加防堵剂，不然三天两头洗笔', time: '2025-03-16' },
    ],
  },
  {
    id: 'post4',
    author: '晚风踩着云朵',
    avatar: AV.girl3,
    time: '2025-03-19',
    tag: '做旧',
    content:
      '1/700 俾斯麦进度更新，甲板木纹贴完了，第一次尝试渍洗做旧，舰舯的锈渍还是下手重了，下次轻一点。有舰船佬指点下渍洗液浓度吗？',
    images: ['/community/p4.jpg'],
    likes: 112,
    liked: false,
    comments: [
      { id: 'c41', author: '打不过就加入', avatar: AV.boy2, content: '锈渍重了就再压一层浅色，别急着擦掉重来', time: '2025-03-20' },
      { id: 'c42', author: '晚风踩着云朵', avatar: AV.girl3, content: '好思路，明天试试', time: '2025-03-20', replyTo: '打不过就加入' },
      { id: 'c43', author: '阿宅快乐水', avatar: AV.doge, content: '渍洗液1:3先薄薄来一遍，别学我直接糊上去', time: '2025-03-21' },
    ],
  },
  {
    id: 'post5',
    author: '打不过就加入',
    avatar: AV.boy2,
    time: '2025-03-24',
    tag: '素组打卡',
    content:
      '1/48 黑鹰直升机，旋翼根部接缝用补土填了三遍才平，机身和短翼的结合缝也算交代过去了。旋翼党是真的少，同好冒个头？',
    images: ['/community/p5.jpg'],
    likes: 38,
    liked: false,
    comments: [
      { id: 'c51', author: '打不过就加入', avatar: AV.boy2, content: '补个小技巧：补土别一次堆满，薄涂多遍不容易塌', time: '2025-03-24' },
      { id: 'c52', author: '铁锅炖自己', avatar: AV.panda, content: '旋翼党+1，就是小零件丢了第二天就找不到', time: '2025-03-25' },
    ],
  },
  {
    id: 'post6',
    author: '铁锅炖自己',
    avatar: AV.panda,
    time: '2025-03-28',
    tag: '工具分享',
    content:
      '给新手整理的水口钳/笔刀/打磨条入门清单，工具不求贵但求顺手，全部下来不到两百块。有没有想要链接的，评论区扣1',
    images: ['/community/p6.jpg'],
    likes: 95,
    liked: false,
    comments: [
      { id: 'c61', author: '奶油小方', avatar: AV.chibi, content: '扣1！水口钳选薄刃还是单刃？', time: '2025-03-28' },
      { id: 'c62', author: '铁锅炖自己', avatar: AV.panda, content: '新手单刃够了，薄刃剪流道容易崩口', time: '2025-03-29', replyTo: '奶油小方' },
      { id: 'c63', author: '摸鱼协会会长', avatar: AV.grumpy, content: '补一个切割垫，桌面保命神器', time: '2025-03-30' },
    ],
  },
]
