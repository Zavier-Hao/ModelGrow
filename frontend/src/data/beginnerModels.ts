// 推荐给新手的入门模型（预置数据）
export interface BeginnerModel {
  id: string
  name: string
  category: string
  scale: string
  difficulty: '入门' | '中等'
  image: string
  intro: string
  reason: string
  buyLink: string
}

export const beginnerModels: BeginnerModel[] = [
  {
    id: 'tiger-tank',
    name: '虎式坦克',
    category: '军模',
    scale: '1/35',
    difficulty: '入门',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=WW2%20German%20Tiger%20tank%20model%20kit%20gray%20plastic%20military%20vehicle%20studio%20shot&image_size=square',
    intro: '二战德军经典重型坦克，板件细节丰富',
    reason: '结构清晰、零件数量适中，是军模入门的最佳选择之一，网上零基础教程非常多',
    buyLink: 'https://search.jd.com/Search?keyword=虎式坦克模型',
  },
  {
    id: 'rx78-2',
    name: 'RX-78-2 高达',
    category: '高达',
    scale: '1/144',
    difficulty: '入门',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=RX-78-2%20Gundam%20model%20kit%20white%20blue%20red%20mecha%20robot%20studio%20shot&image_size=square',
    intro: '元祖高达，万代 HG 系列',
    reason: 'HG 系列组合度极佳，免胶拼装，适合完全零基础上手',
    buyLink: 'https://search.jd.com/Search?keyword=HG元祖高达',
  },
  {
    id: 'porsche-911',
    name: '保时捷 911',
    category: '民用车辆',
    scale: '1/24',
    difficulty: '入门',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Porsche%20911%20sports%20car%20model%20kit%20red%20plastic%20studio%20shot&image_size=square',
    intro: '经典跑车，田宫出品',
    reason: '田宫民用车组合度顶级，车身曲线优美，适合学习上色和打磨',
    buyLink: 'https://search.jd.com/Search?keyword=田宫保时捷911模型',
  },
]
