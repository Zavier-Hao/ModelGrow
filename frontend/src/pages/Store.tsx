import { Store as StoreIcon, ExternalLink, Flame, ShoppingBag } from 'lucide-react'

interface StoreItem {
  id: string
  name: string
  brand: string
  price: string
  image: string
  tags: string[]
  hot?: boolean
  /** 京东商品链接 */
  jdUrl: string
}

const STORE_ITEMS: StoreItem[] = [
  {
    id: 'tiger1',
    name: '田宫 1/35 虎式坦克初期型 35216',
    brand: '田宫 TAMIYA',
    price: '¥ 210',
    image: '/store/tiger.jpg',
    tags: ['零基础友好', '经典军模', '教程丰富'],
    hot: true,
    jdUrl: 'https://item.jd.com/39675524300.html',
  },
  {
    id: 'rg-unicorn',
    name: '万代 RG 1/144 RX-0 独角兽高达',
    brand: '万代 BANDAI',
    price: '¥ 219',
    image: '/store/unicorn.jpg',
    tags: ['热门IP', '爆甲机构', '进阶'],
    hot: true,
    jdUrl: 'https://item.jd.com/100154371845.html',
  },
  {
    id: 'j20',
    name: '小号手 1/72 歼-20 威龙隐形战斗机',
    brand: '小号手 Trumpeter',
    price: '¥ 88',
    image: '/store/j20.jpg',
    tags: ['国货之光', '免胶分色', '新手可选'],
    jdUrl: 'https://item.jd.com/10087234104561.html',
  },
  {
    id: 'missouri',
    name: '田宫 1/700 密苏里号战列舰 31613',
    brand: '田宫 TAMIYA',
    price: '¥ 165',
    image: '/store/missouri.jpg',
    tags: ['舰船经典', '细节丰富', '进阶'],
    jdUrl: 'https://item.jd.com/10076594417003.html',
  },
  {
    id: 'pgu-rx78',
    name: '万代 PG UNLEASHED 1/60 RX-78-2 元祖高达',
    brand: '万代 BANDAI',
    price: '¥ 1499',
    image: '/store/pgu.jpg',
    tags: ['镇宅神物', '极致细节', '高手向'],
    hot: true,
    jdUrl: 'https://item.jd.com/10026119285330.html',
  },
  {
    id: 'toolkit',
    name: '高达拼装工具套装 新手入门11件套',
    brand: '模型制作工具',
    price: '¥ 59',
    image: '/store/toolkit.jpg',
    tags: ['新手必备', '一套搞定'],
    jdUrl: 'https://item.jd.com/10138375225570.html',
  },
]

export default function Store() {
  return (
    <div className="flex flex-col min-h-[100dvh] animate-fade-in pb-28">
      {/* 头部 */}
      <div className="px-4 pt-6 pb-3 flex items-center gap-2">
        <StoreIcon className="text-accent-blue-light" size={22} />
        <h1 className="text-2xl font-bold text-white">商店</h1>
      </div>
      <p className="px-4 text-xs text-gray-400 mb-4">
        当下热门模型精选 · 点击跳转京东购买
      </p>

      {/* 商品列表 */}
      <div className="px-4 grid grid-cols-2 gap-3">
        {STORE_ITEMS.map((item) => (
          <div
            key={item.id}
            className="frosted-glass rounded-2xl overflow-hidden flex flex-col transition-transform active:scale-[0.97]"
          >
            {/* 商品图 */}
            <div className="relative aspect-square bg-black/30">
              <img
                src={item.image}
                alt={item.name}
                loading="lazy"
                className="w-full h-full object-cover"
              />
              {item.hot && (
                <div className="absolute top-2 left-2 flex items-center gap-1 bg-accent-blue/90 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                  <Flame size={10} />
                  HOT
                </div>
              )}
            </div>

            {/* 信息 */}
            <div className="p-3 flex-1 flex flex-col">
              <p className="text-[10px] text-gray-500 mb-0.5">{item.brand}</p>
              <h3 className="text-sm font-semibold text-white leading-snug mb-1 line-clamp-2">
                {item.name}
              </h3>
              <div className="flex flex-wrap gap-1 mb-2">
                {item.tags.map((t) => (
                  <span
                    key={t}
                    className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-gray-400"
                  >
                    {t}
                  </span>
                ))}
              </div>
              <p className="text-sm font-bold text-accent-blue-light mb-2 mt-auto">
                {item.price}
              </p>

              {/* 京东跳转 */}
              <a
                href={item.jdUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1 py-1.5 rounded-lg bg-accent-blue/15 border border-accent-blue/30 text-accent-blue-light text-[11px] font-medium hover:bg-accent-blue/25 transition-colors"
              >
                <ShoppingBag size={11} />
                去京东购买
                <ExternalLink size={9} />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
