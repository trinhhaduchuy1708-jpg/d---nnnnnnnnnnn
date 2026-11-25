import Link from 'next/link'
import { Search, SlidersHorizontal } from 'lucide-react'
import { Header } from '@/components/schoolmall/header'
import { ProductCard } from '@/components/schoolmall/product-card'
import { createClient } from '@/lib/supabase/server'
import { signProductImages } from '@/lib/supabase/product-images'

type SearchParams = Promise<{ q?: string; type?: string; category?: string; sort?: string }>

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const supabase = await createClient()
  let query = supabase.from('products').select('id, title, description, condition, transaction_type, price, image_paths').eq('status', 'approved')
  const term = (params.q ?? '').trim().slice(0, 80)
  if (term) query = query.ilike('title', `%${term.replace(/[%_,]/g, ' ')}%`)
  if (['sale', 'exchange', 'free'].includes(params.type ?? '')) query = query.eq('transaction_type', params.type!)
  if (params.category) query = query.eq('category_id', params.category)
  query = params.sort === 'price' ? query.order('price', { ascending: true, nullsFirst: false }) : query.order('created_at', { ascending: false })
  const [{ data: products, error }, { data: categories }] = await Promise.all([query.limit(40), supabase.from('categories').select('id, name').eq('active', true).order('sort_order')])
  const productsWithImages = await Promise.all((products ?? []).map(async (product) => ({
    ...product,
    imageUrl: (await signProductImages(supabase, product.image_paths))[0] ?? null,
  })))
  const title = params.type === 'exchange' ? 'Sản phẩm trao đổi' : params.type === 'free' ? 'Đồ tặng miễn phí' : 'Khám phá sản phẩm'

  return <main className="min-h-screen bg-[#f7f9fc]"><Header /><div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14"><div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-extrabold uppercase tracking-[.18em] text-blue-700">SchoolMall · Chợ trong trường</p><h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">{title}</h1><p className="mt-2 text-sm text-slate-500">Chỉ hiển thị sản phẩm đã được duyệt.</p></div><span className="text-sm font-semibold text-slate-500">{products?.length ?? 0} sản phẩm</span></div>
    <form action="/products" className="mt-8 grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 sm:grid-cols-[1fr_190px_170px_auto] sm:p-5"><label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4"><Search size={18} className="shrink-0 text-slate-400" /><span className="sr-only">Tìm sản phẩm</span><input name="q" defaultValue={term} placeholder="Tìm sách, balo, dụng cụ học tập..." className="h-12 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400" /></label><label className="flex items-center gap-2 rounded-2xl border border-slate-200 px-3"><SlidersHorizontal size={16} className="text-slate-400" /><span className="sr-only">Danh mục</span><select name="category" defaultValue={params.category ?? ''} className="h-12 min-w-0 flex-1 bg-transparent text-sm text-slate-700 outline-none"><option value="">Tất cả danh mục</option>{(categories ?? []).map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label><label className="sr-only" htmlFor="type">Hình thức</label><select id="type" name="type" defaultValue={params.type ?? ''} className="h-12 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none"><option value="">Mọi hình thức</option><option value="sale">Mua bán</option><option value="exchange">Trao đổi</option><option value="free">Cho tặng</option></select><button className="rounded-2xl bg-blue-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-800">Tìm kiếm</button></form>
    {error ? <div role="alert" className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">Không tải được danh sách sản phẩm. Vui lòng thử tải lại trang.</div> : products?.length ? <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">{productsWithImages.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center"><h2 className="text-lg font-extrabold text-slate-900">Chưa tìm thấy sản phẩm</h2><p className="mt-2 text-sm text-slate-500">Thử đổi từ khóa hoặc bộ lọc. Sản phẩm chỉ xuất hiện sau khi được duyệt.</p><Link href="/" className="mt-5 inline-flex rounded-full bg-blue-700 px-5 py-3 text-sm font-bold text-white">Về trang chủ</Link></div>}</div></main>
}
