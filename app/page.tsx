import Link from 'next/link'
import { ArrowRight, ArrowUpRight, Backpack, BookOpen, Calculator, Dumbbell, HeartHandshake, Laptop, Package, Pencil, Scissors, Shirt, ShieldCheck, Sparkles } from 'lucide-react'
import { Header } from '@/components/schoolmall/header'
import { ProductCard } from '@/components/schoolmall/product-card'
import { createClient } from '@/lib/supabase/server'
import { signProductImages } from '@/lib/supabase/product-images'

const categoryIcons: Record<string, typeof Package> = {
  'sach-truyen': BookOpen,
  'dung-cu-hoc-tap': Pencil,
  'may-tinh': Calculator,
  'thiet-bi-dien-tu': Laptop,
  'dong-phuc': Shirt,
  'balo-phu-kien': Backpack,
  handmade: Scissors,
  'do-the-thao': Dumbbell,
  khac: Package,
}

export default async function Home() {
  const supabase = await createClient()
  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase.from('categories').select('id, name, slug, icon').eq('active', true).order('sort_order'),
    supabase.from('products').select('id, title, description, condition, transaction_type, price, image_paths').eq('status', 'approved').order('created_at', { ascending: false }).limit(8),
  ])
  const productsWithImages = await Promise.all((products ?? []).map(async (product) => ({
    ...product,
    imageUrl: (await signProductImages(supabase, product.image_paths))[0] ?? null,
  })))

  return (
    <main className="min-h-screen bg-[#f7f9fc] text-slate-900">
      <Header />
      <section className="relative isolate overflow-hidden bg-[#102c68] text-white">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_75%_15%,rgba(73,139,255,.42),transparent_38%),radial-gradient(ellipse_at_10%_110%,rgba(38,81,173,.6),transparent_40%)]" />
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1.1fr_.9fr] lg:py-24">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-semibold text-blue-100"><Sparkles size={14} className="text-orange-300" /> Chợ trực tuyến dành riêng cho học sinh</div>
            <h1 className="max-w-2xl text-4xl font-black leading-[1.08] tracking-tight sm:text-5xl lg:text-[64px]">Món đồ hay,<br /><span className="text-orange-300">trao tay đúng người.</span></h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-blue-100 sm:text-lg">Mua bán, trao đổi và chia sẻ những món đồ hữu ích ngay trong trường học — an toàn, thân thiện, không thu phí giao dịch.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/products" className="inline-flex items-center gap-2 rounded-full bg-orange-400 px-6 py-3.5 text-sm font-extrabold text-slate-950 transition hover:bg-orange-300">Khám phá sản phẩm <ArrowRight size={17} /></Link>
              <Link href="/sign-up" className="inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white/10">Tham gia SchoolMall <ArrowUpRight size={16} /></Link>
            </div>
            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-xs font-medium text-blue-100">
              <span className="inline-flex items-center gap-2"><ShieldCheck size={15} className="text-emerald-300" /> Tôn trọng quyền riêng tư</span>
              <span className="inline-flex items-center gap-2"><HeartHandshake size={15} className="text-orange-300" /> Giao nhận trong trường</span>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-[470px]">
            <div className="absolute -inset-5 rounded-[40px] bg-blue-400/15 blur-2xl" />
            <div className="relative rounded-[32px] border border-white/15 bg-white/[.08] p-5 shadow-2xl backdrop-blur-sm sm:p-7">
              <div className="flex items-center justify-between border-b border-white/15 pb-5">
                <div><p className="text-xs font-semibold uppercase tracking-[.18em] text-blue-200">SchoolMall</p><h2 className="mt-1 text-xl font-extrabold">Chợ của trường mình</h2></div>
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-400 text-slate-950"><BookOpen size={23} /></span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {[
                  { icon: '01', title: 'Mua bán', detail: 'Đồ dùng còn hữu ích', tone: 'bg-blue-400/15 text-blue-100' },
                  { icon: '02', title: 'Trao đổi', detail: 'Đổi món bạn cần', tone: 'bg-violet-400/15 text-violet-100' },
                  { icon: '03', title: 'Cho tặng', detail: 'Chia sẻ miễn phí', tone: 'bg-emerald-400/15 text-emerald-100' },
                  { icon: '04', title: 'Trong trường', detail: 'Tự thỏa thuận giao nhận', tone: 'bg-orange-300/15 text-orange-100' },
                ].map((item) => <div key={item.title} className="rounded-2xl border border-white/10 bg-white/[.06] p-4"><span className={`inline-flex rounded-lg px-2 py-1 text-[10px] font-extrabold ${item.tone}`}>{item.icon}</span><h3 className="mt-3 text-sm font-bold">{item.title}</h3><p className="mt-1 text-xs text-blue-100/75">{item.detail}</p></div>)}
              </div>
              <div className="mt-4 flex items-start gap-3 rounded-2xl bg-white p-4 text-slate-800">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700"><ShieldCheck size={19} /></div>
                <div><p className="text-sm font-extrabold">An toàn là ưu tiên</p><p className="mt-1 text-xs leading-5 text-slate-500">Thông tin liên hệ riêng tư không hiển thị công khai. Hai bên tự thống nhất điểm hẹn được nhà trường cho phép.</p></div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-16">
        <div className="flex items-end justify-between gap-4"><div><p className="text-xs font-extrabold uppercase tracking-[.18em] text-blue-700">Khám phá</p><h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Danh mục nổi bật</h2><p className="mt-2 text-sm text-slate-500">Tìm nhanh món đồ bạn đang cần.</p></div><Link href="/products" className="hidden items-center gap-1 text-sm font-bold text-blue-700 sm:flex">Tất cả sản phẩm <ArrowRight size={16} /></Link></div>
        <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {(categories ?? []).map((category) => <Link key={category.id} href={`/products?category=${encodeURIComponent(category.id)}`} className="group flex flex-col items-center rounded-2xl border border-slate-200 bg-white px-3 py-5 text-center transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-100/60"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-2xl transition group-hover:bg-blue-100">{(() => { const Icon = categoryIcons[category.slug] ?? Package; return <Icon size={22} strokeWidth={1.8} /> })()}</span><span className="mt-3 text-xs font-bold leading-4 text-slate-700">{category.name}</span></Link>)}
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-5 pb-16 sm:px-8 sm:pb-20">
        <div className="flex items-end justify-between gap-4"><div><p className="text-xs font-extrabold uppercase tracking-[.18em] text-orange-600">Mới cập nhật</p><h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Sản phẩm mới đăng</h2><p className="mt-2 text-sm text-slate-500">Các sản phẩm đã được duyệt và đang sẵn sàng kết nối.</p></div><Link href="/products" className="flex shrink-0 items-center gap-1 text-sm font-bold text-blue-700">Xem tất cả <ArrowRight size={16} /></Link></div>
        {products?.length ? <div className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">{productsWithImages.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className="mt-7 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700"><BookOpen size={25} /></span><h3 className="mt-4 text-lg font-extrabold">Chưa có sản phẩm được duyệt</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Danh sách này lấy trực tiếp từ SchoolMall. Khi học sinh đăng sản phẩm và quản trị viên duyệt, sản phẩm sẽ xuất hiện ở đây.</p><Link href="/sign-up" className="mt-5 inline-flex items-center gap-2 rounded-full bg-blue-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-800">Tạo tài khoản để đăng bán <ArrowRight size={16} /></Link></div>}
      </section>
      <footer className="border-t border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-7 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8"><span className="font-bold text-slate-700">SchoolMall · Chia sẻ điều hữu ích</span><span>Không xử lý thanh toán hoặc giao hàng. Giao dịch do hai bên tự thỏa thuận.</span></div></footer>
    </main>
  )
}
