import Link from 'next/link'
import { ArrowUpRight, ImageOff } from 'lucide-react'

type Product = {
  id: string
  title: string
  description: string
  condition: string
  transaction_type: string
  price: number | null
  image_paths: string[] | null
  imageUrl?: string | null
}

const typeLabel: Record<string, string> = { sale: 'Mua bán', exchange: 'Trao đổi', free: 'Cho tặng' }
const conditionLabel: Record<string, string> = { new: 'Mới', like_new: 'Như mới', good: 'Tốt', fair: 'Đã qua sử dụng' }

export function ProductCard({ product }: { product: Product }) {
  const image = product.imageUrl
  const badgeStyle = product.transaction_type === 'free' ? 'bg-emerald-100 text-emerald-800' : product.transaction_type === 'exchange' ? 'bg-violet-100 text-violet-800' : 'bg-blue-100 text-blue-800'

  return (
    <Link href={`/products/${product.id}`} className="group min-w-0 overflow-hidden rounded-3xl border border-slate-200 bg-white transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-slate-200/70">
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-blue-50 to-slate-100">
        {image ? <img src={image} alt={product.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center text-slate-300"><ImageOff size={34} strokeWidth={1.4} /></div>}
        <span className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-bold ${badgeStyle}`}>{typeLabel[product.transaction_type] ?? 'Sản phẩm'}</span>
        <span className="absolute bottom-3 right-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-600 backdrop-blur">{conditionLabel[product.condition] ?? product.condition}</span>
      </div>
      <div className="p-4 sm:p-5">
        <h3 className="line-clamp-1 font-bold text-slate-900 group-hover:text-blue-700">{product.title}</h3>
        <p className="mt-1.5 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">{product.description}</p>
        <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
          <span className={`font-extrabold ${product.transaction_type === 'free' ? 'text-emerald-700' : 'text-blue-800'}`}>
            {product.transaction_type === 'free' ? 'Miễn phí' : product.transaction_type === 'exchange' ? 'Đổi đồ' : `${Number(product.price ?? 0).toLocaleString('vi-VN')}đ`}
          </span>
          <span className="flex items-center gap-1 text-xs font-bold text-slate-400 transition group-hover:text-blue-700">Chi tiết <ArrowUpRight size={14} /></span>
        </div>
      </div>
    </Link>
  )
}
