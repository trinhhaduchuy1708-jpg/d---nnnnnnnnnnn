import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, ShieldCheck } from 'lucide-react'
import { Header } from '@/components/schoolmall/header'
import { TransactionRequestForm } from '@/components/schoolmall/transaction-request-form'
import { createClient } from '@/lib/supabase/server'
import { signProductImages } from '@/lib/supabase/product-images'

const conditions: Record<string, string> = { new: 'Mới', like_new: 'Như mới', good: 'Tốt', fair: 'Đã qua sử dụng' }
const transactionLabels: Record<string, string> = { sale: 'Mua bán', exchange: 'Trao đổi', free: 'Cho tặng' }

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: product } = await supabase.from('products').select('id, owner_id, category_id, title, description, condition, transaction_type, price, exchange_wish, image_paths, status, created_at').eq('id', id).maybeSingle()
  if (!product) notFound()

  const [{ data: category }, { data: profile }, { data: offers }] = await Promise.all([
    supabase.from('categories').select('name').eq('id', product.category_id).maybeSingle(),
    supabase.from('profiles').select('display_name, grade').eq('id', product.owner_id).maybeSingle(),
    user ? supabase.from('products').select('id, title').eq('owner_id', user.id).eq('status', 'approved').neq('id', product.id).order('created_at', { ascending: false }).limit(30) : Promise.resolve({ data: [] }),
  ])
  const imageUrls = await signProductImages(supabase, product.image_paths)
  const isOwner = user?.id === product.owner_id
  const statusLabel: Record<string, string> = { pending: 'Đang chờ duyệt', rejected: 'Chưa được duyệt', hidden: 'Đang ẩn', reserved: 'Đang giao dịch', completed: 'Đã hoàn tất' }

  return <main className="min-h-screen bg-[#f7f9fc]"><Header /><div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12"><Link href="/products" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-blue-700"><ArrowLeft size={16} /> Quay lại danh sách</Link><div className="mt-6 grid gap-8 lg:grid-cols-[1.1fr_.9fr]">
    <section><div className="grid grid-cols-2 gap-3">{imageUrls.length ? imageUrls.map((url, index) => <div key={url} className={`overflow-hidden rounded-3xl bg-slate-100 ${index === 0 ? 'col-span-2 aspect-[16/10]' : 'aspect-square'}`}><img src={url} alt={`${product.title} — ảnh ${index + 1}`} className="h-full w-full object-cover" /></div>) : <div className="col-span-2 flex aspect-[16/10] items-center justify-center rounded-3xl bg-gradient-to-br from-blue-50 to-slate-100 text-slate-400"><span className="text-sm font-semibold">Chưa có ảnh sản phẩm</span></div>}</div></section>
    <section><div className="flex flex-wrap gap-2"><span className="rounded-full bg-blue-100 px-3 py-1.5 text-xs font-bold text-blue-800">{transactionLabels[product.transaction_type]}</span><span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">{conditions[product.condition]}</span>{isOwner && product.status !== 'approved' && <span className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-800">{statusLabel[product.status] ?? product.status}</span>}</div><h1 className="mt-4 text-3xl font-black leading-tight tracking-tight text-slate-900">{product.title}</h1><p className={`mt-3 text-2xl font-black ${product.transaction_type === 'free' ? 'text-emerald-700' : 'text-blue-800'}`}>{product.transaction_type === 'free' ? 'Miễn phí' : product.transaction_type === 'exchange' ? 'Đổi đồ' : `${Number(product.price ?? 0).toLocaleString('vi-VN')}đ`}</p><div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 border-y border-slate-200 py-4 text-sm text-slate-500"><span>{category?.name ?? 'Chưa phân loại'}</span><span>Đăng {new Date(product.created_at).toLocaleDateString('vi-VN')}</span></div><div className="mt-6"><h2 className="font-extrabold text-slate-900">Mô tả sản phẩm</h2><p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-600">{product.description}</p></div>{product.transaction_type === 'exchange' && product.exchange_wish && <div className="mt-5 rounded-2xl bg-violet-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-violet-800">Mong muốn trao đổi</p><p className="mt-1.5 text-sm leading-6 text-violet-950">{product.exchange_wish}</p></div>}<div className="mt-5 flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><ShieldCheck size={20} /></span><div><p className="text-sm font-extrabold text-slate-900">{profile?.display_name ?? 'Học sinh SchoolMall'}{profile?.grade ? ` · Lớp ${profile.grade}` : ''}</p><p className="mt-1 text-xs leading-5 text-slate-500">Email, số điện thoại và địa chỉ riêng tư không được hiển thị. Hãy thỏa thuận giao nhận tại nơi được nhà trường cho phép.</p></div></div>
      {product.status === 'approved' && !isOwner && <div className="mt-5"><TransactionRequestForm productId={product.id} requestType={product.transaction_type} offerProducts={offers ?? []} loggedIn={Boolean(user)} /></div>}
      {isOwner && <div className="mt-5 flex items-center gap-2 rounded-2xl bg-blue-50 p-4 text-sm font-semibold text-blue-900"><CheckCircle2 size={18} /> Đây là sản phẩm bạn đã đăng.</div>}
    </section></div></div></main>
}
