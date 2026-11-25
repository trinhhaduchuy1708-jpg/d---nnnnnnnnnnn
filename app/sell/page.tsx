import { redirect } from 'next/navigation'
import { Header } from '@/components/schoolmall/header'
import { SellForm } from '@/components/schoolmall/sell-form'
import { createClient } from '@/lib/supabase/server'
import { signProductImages } from '@/lib/supabase/product-images'

type SearchParams = Promise<{ edit?: string }>

export default async function SellPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=%2Fsell')
  const [{ data: categories }, { data: editable }] = await Promise.all([
    supabase.from('categories').select('id, name').eq('active', true).order('sort_order'),
    params.edit ? supabase.from('products').select('id, category_id, title, description, condition, transaction_type, price, exchange_wish, image_paths, status').eq('id', params.edit).eq('owner_id', user.id).maybeSingle() : Promise.resolve({ data: null }),
  ])
  const initial = editable && ['pending', 'rejected'].includes(editable.status) ? {
    ...editable,
    imageUrls: await signProductImages(supabase, editable.image_paths),
  } : undefined
  if (params.edit && !initial) redirect('/account')

  return <main className="min-h-screen bg-[#f7f9fc]"><Header /><section className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14"><p className="text-xs font-extrabold uppercase tracking-[.18em] text-blue-700">Chia sẻ với bạn học</p><h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">{initial ? 'Chỉnh sửa sản phẩm' : 'Đăng sản phẩm'}</h1><p className="mt-3 text-sm leading-6 text-slate-500">{initial ? 'Sau khi lưu, sản phẩm được gửi lại để quản trị viên duyệt.' : 'Đăng món đồ hữu ích để bạn khác trong trường có thể mua, trao đổi hoặc nhận tặng.'}</p><div className="mt-7"><SellForm categories={categories ?? []} initial={initial} /></div></section></main>
}
