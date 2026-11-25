import { notFound, redirect } from 'next/navigation'
import { ShieldCheck } from 'lucide-react'
import { Header } from '@/components/schoolmall/header'
import { AdminDashboard } from '@/components/schoolmall/admin-dashboard'
import { createClient } from '@/lib/supabase/server'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=%2Fadmin')
  const { data: isAdmin } = await supabase.rpc('is_schoolmall_admin')
  if (!isAdmin) notFound()

  const [{ data: products }, { data: reports }, { data: categories }, { data: profiles }, { data: restrictions }] = await Promise.all([
    supabase.from('products').select('id, title, description, transaction_type, status, owner_id, created_at, rejection_reason').in('status', ['pending', 'rejected']).order('created_at', { ascending: true }).limit(100),
    supabase.from('reports').select('id, product_id, reporter_id, reason, created_at').eq('status', 'open').order('created_at', { ascending: true }).limit(100),
    supabase.from('categories').select('id, name, slug').order('sort_order'),
    supabase.from('profiles').select('id, display_name, grade').order('display_name').limit(200),
    supabase.from('account_restrictions').select('user_id, reason, created_at'),
  ])
  const restrictionByUser = new Map((restrictions ?? []).map((restriction) => [restriction.user_id, restriction]))
  const accounts = (profiles ?? []).filter((profile) => profile.id !== user.id).map((profile) => ({
    ...profile,
    restriction: restrictionByUser.get(profile.id) ?? null,
  }))
  const productIds = [...new Set((reports ?? []).map((report) => report.product_id))]
  const reporterIds = [...new Set((reports ?? []).map((report) => report.reporter_id))]
  const [{ data: reportedProducts }, { data: reporterProfiles }] = await Promise.all([
    productIds.length ? supabase.from('products').select('id, title').in('id', productIds) : Promise.resolve({ data: [] }),
    reporterIds.length ? supabase.from('profiles').select('id, display_name').in('id', reporterIds) : Promise.resolve({ data: [] }),
  ])
  const titleById = new Map((reportedProducts ?? []).map((product) => [product.id, product.title]))
  const nameById = new Map((reporterProfiles ?? []).map((profile) => [profile.id, profile.display_name]))
  const reportCards = (reports ?? []).map((report) => ({
    ...report,
    productTitle: titleById.get(report.product_id) ?? 'Sản phẩm đã gỡ',
    reporterName: nameById.get(report.reporter_id) ?? 'Học sinh',
  }))

  return <main className="min-h-screen bg-[#f7f9fc]"><Header /><div className="mx-auto max-w-6xl px-5 py-9 sm:px-8 sm:py-12"><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-700 text-white"><ShieldCheck size={22} /></span><div><p className="text-xs font-extrabold uppercase tracking-[.18em] text-blue-700">SchoolMall</p><h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">Quản trị</h1></div></div><p className="mt-3 text-sm text-slate-500">Kiểm duyệt sản phẩm, xử lý báo cáo và quản lý danh mục. Quyền quản trị được cấp riêng, không thể chọn khi đăng ký.</p><div className="mt-8"><AdminDashboard products={products ?? []} reports={reportCards} categories={categories ?? []} accounts={accounts} /></div></div></main>
}
