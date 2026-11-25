'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Check, LockKeyhole, Plus, ShieldCheck, UnlockKeyhole, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Product = { id: string; title: string; description: string; transaction_type: string; status: string; owner_id: string; created_at: string; rejection_reason: string | null }
type Report = { id: string; product_id: string; reporter_id: string; reason: string; created_at: string; productTitle: string; reporterName: string }
type Category = { id: string; name: string; slug: string }
type Account = { id: string; display_name: string; grade: string | null; restriction: { user_id: string; reason: string; created_at: string } | null }

export function AdminDashboard({ products, reports, categories, accounts }: { products: Product[]; reports: Report[]; categories: Category[]; accounts: Account[] }) {
  const router = useRouter()
  const [reason, setReason] = useState<Record<string, string>>({})
  const [categoryName, setCategoryName] = useState('')
  const [restrictionReasons, setRestrictionReasons] = useState<Record<string, string>>({})
  const [message, setMessage] = useState('')
  const [busyId, setBusyId] = useState('')

  async function moderate(productId: string, status: 'approved' | 'rejected') {
    const rejectionReason = reason[productId]?.trim() ?? ''
    if (status === 'rejected' && rejectionReason.length < 10) {
      setMessage('Lý do từ chối cần ít nhất 10 ký tự.')
      return
    }
    setBusyId(productId)
    setMessage('')
    const { error } = await createClient().rpc('set_schoolmall_product_status', { p_product_id: productId, p_status: status, p_reason: status === 'rejected' ? rejectionReason : null })
    setBusyId('')
    setMessage(error ? 'Không thể cập nhật sản phẩm. Hãy tải lại trang và thử lại.' : status === 'approved' ? 'Sản phẩm đã được duyệt.' : 'Đã từ chối sản phẩm.')
    if (!error) router.refresh()
  }

  async function resolve(reportId: string, status: 'resolved' | 'dismissed') {
    setBusyId(reportId)
    const { error } = await createClient().rpc('resolve_schoolmall_report', { p_report_id: reportId, p_status: status })
    setBusyId('')
    setMessage(error ? 'Không thể cập nhật báo cáo.' : 'Đã cập nhật báo cáo.')
    if (!error) router.refresh()
  }

  async function setAccountRestriction(account: Account, restricted: boolean) {
    const reason = restrictionReasons[account.id]?.trim() ?? ''
    if (restricted && (reason.length < 3 || reason.length > 500)) {
      setMessage('Lý do cần từ 3 đến 500 ký tự.')
      return
    }
    setBusyId(account.id)
    setMessage('')
    const { error } = await createClient().rpc('set_schoolmall_account_restriction', {
      p_user_id: account.id,
      p_reason: restricted ? reason : null,
      p_restricted: restricted,
    })
    setBusyId('')
    setMessage(error ? 'Không thể cập nhật tài khoản. Có thể tài khoản này thuộc quản trị viên.' : restricted ? 'Đã khóa tài khoản.' : 'Đã mở khóa tài khoản.')
    if (!error) {
      setRestrictionReasons((current) => ({ ...current, [account.id]: '' }))
      router.refresh()
    }
  }

  async function addCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = categoryName.trim()
    if (name.length < 2 || name.length > 60) {
      setMessage('Tên danh mục cần từ 2 đến 60 ký tự.')
      return
    }
    setBusyId('category')
    setMessage('')
    const slug = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const { error } = await createClient().from('categories').insert({ name, slug, active: true, sort_order: categories.length })
    setBusyId('')
    setMessage(error ? 'Không thể thêm danh mục. Tên hoặc đường dẫn có thể đã tồn tại.' : 'Đã thêm danh mục.')
    if (!error) {
      setCategoryName('')
      router.refresh()
    }
  }

  return <div className="space-y-9"><div className="grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm font-semibold text-slate-500">Chờ duyệt</p><p className="mt-2 text-3xl font-black text-slate-900">{products.filter((product) => product.status === 'pending').length}</p></div><div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm font-semibold text-slate-500">Báo cáo đang mở</p><p className="mt-2 text-3xl font-black text-slate-900">{reports.length}</p></div><div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm font-semibold text-slate-500">Danh mục hoạt động</p><p className="mt-2 text-3xl font-black text-slate-900">{categories.length}</p></div></div>
    {message && <p role="status" className="rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-900">{message}</p>}
    <section><div className="flex items-center gap-2"><ShieldCheck className="text-blue-700" size={20} /><h2 className="text-xl font-black text-slate-900">Kiểm duyệt sản phẩm</h2></div><div className="mt-4 space-y-3">{products.length ? products.map((product) => <article key={product.id} className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-extrabold text-slate-900">{product.title}</h3><p className="mt-1 line-clamp-3 text-sm leading-6 text-slate-600">{product.description}</p><p className="mt-2 text-xs text-slate-400">{product.transaction_type} · {product.status} · {new Date(product.created_at).toLocaleDateString('vi-VN')}</p>{product.rejection_reason && <p className="mt-2 text-xs text-red-700">Gần nhất: {product.rejection_reason}</p>}</div><span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">{product.status}</span></div><div className="mt-4 flex flex-col gap-2 sm:flex-row"><button onClick={() => moderate(product.id, 'approved')} disabled={busyId === product.id || product.status === 'approved'} className="inline-flex h-10 items-center justify-center gap-1 rounded-xl bg-emerald-700 px-4 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-50"><Check size={14} /> Duyệt</button><label className="sr-only" htmlFor={`reject-${product.id}`}>Lý do từ chối {product.title}</label><input id={`reject-${product.id}`} value={reason[product.id] ?? ''} onChange={(event) => setReason((current) => ({ ...current, [product.id]: event.target.value }))} maxLength={500} placeholder="Lý do từ chối (ít nhất 10 ký tự)" className="h-10 min-w-0 flex-1 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-500" /><button onClick={() => moderate(product.id, 'rejected')} disabled={busyId === product.id} className="inline-flex h-10 items-center justify-center gap-1 rounded-xl border border-slate-200 px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"><X size={14} /> Từ chối</button></div></article>) : <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">Không có sản phẩm cần kiểm duyệt.</p>}</div></section>
    <section><h2 className="text-xl font-black text-slate-900">Báo cáo sản phẩm</h2><div className="mt-4 space-y-3">{reports.length ? reports.map((report) => <article key={report.id} className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-extrabold text-slate-900">{report.productTitle}</h3><p className="mt-1 text-xs text-slate-500">Báo cáo từ {report.reporterName} · {new Date(report.created_at).toLocaleDateString('vi-VN')}</p><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{report.reason}</p></div></div><div className="mt-4 flex gap-2"><button onClick={() => resolve(report.id, 'resolved')} disabled={busyId === report.id} className="h-9 rounded-lg bg-blue-700 px-3 text-xs font-bold text-white hover:bg-blue-800 disabled:opacity-50">Đã xử lý</button><button onClick={() => resolve(report.id, 'dismissed')} disabled={busyId === report.id} className="h-9 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50">Bỏ qua</button></div></article>) : <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">Không có báo cáo đang mở.</p>}</div></section>
    <section><h2 className="text-xl font-black text-slate-900">Quản lý tài khoản</h2><p className="mt-1 text-sm text-slate-500">Tạm khóa tài khoản sẽ chặn đăng sản phẩm và gửi yêu cầu giao dịch. Quản trị viên không thể khóa chính mình hoặc tài khoản quản trị khác.</p><div className="mt-4 space-y-3">{accounts.length ? accounts.map((account) => <article key={account.id} className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-extrabold text-slate-900">{account.display_name}</h3><p className="mt-1 text-xs text-slate-500">{account.grade ? `Lớp ${account.grade}` : 'Chưa cập nhật lớp'}</p>{account.restriction && <div className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800"><p className="font-bold">Đang bị khóa</p><p className="mt-1">Lý do: {account.restriction.reason}</p><p className="mt-1 text-xs text-red-600">Từ {new Date(account.restriction.created_at).toLocaleDateString('vi-VN')}</p></div>}</div><span className={`rounded-full px-3 py-1 text-xs font-bold ${account.restriction ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>{account.restriction ? 'Đang khóa' : 'Hoạt động'}</span></div>{account.restriction ? <button onClick={() => setAccountRestriction(account, false)} disabled={busyId === account.id} className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"><UnlockKeyhole size={16} />{busyId === account.id ? 'Đang cập nhật…' : 'Mở khóa tài khoản'}</button> : <div className="mt-4 space-y-2"><label className="sr-only" htmlFor={`restriction-${account.id}`}>Lý do khóa tài khoản {account.display_name}</label><textarea id={`restriction-${account.id}`} value={restrictionReasons[account.id] ?? ''} onChange={(event) => setRestrictionReasons((current) => ({ ...current, [account.id]: event.target.value }))} minLength={3} maxLength={500} rows={2} placeholder="Nêu lý do khóa (3–500 ký tự)" className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-500" /><button onClick={() => setAccountRestriction(account, true)} disabled={busyId === account.id} className="inline-flex h-10 items-center gap-2 rounded-xl bg-red-700 px-4 text-sm font-bold text-white hover:bg-red-800 disabled:opacity-50"><LockKeyhole size={16} />{busyId === account.id ? 'Đang cập nhật…' : 'Khóa tài khoản'}</button></div>}</article>) : <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">Chưa có tài khoản nào để quản lý.</p>}</div></section>
    <section><h2 className="text-xl font-black text-slate-900">Danh mục</h2><form onSubmit={addCategory} className="mt-4 flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row"><label className="sr-only" htmlFor="new-category">Tên danh mục mới</label><input id="new-category" value={categoryName} onChange={(event) => setCategoryName(event.target.value)} minLength={2} maxLength={60} placeholder="Tên danh mục mới" className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-500" /><button disabled={busyId === 'category'} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 text-sm font-bold text-white hover:bg-blue-800 disabled:opacity-50"><Plus size={16} /> Thêm danh mục</button></form><div className="mt-3 flex flex-wrap gap-2">{categories.map((category) => <span key={category.id} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">{category.name}</span>)}</div></section>
  </div>
}
