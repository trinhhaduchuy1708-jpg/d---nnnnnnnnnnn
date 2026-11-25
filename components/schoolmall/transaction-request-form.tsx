'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Flag, Handshake, ShoppingCart } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type OfferProduct = { id: string; title: string }
type RequestType = 'sale' | 'exchange' | 'free'

export function TransactionRequestForm({ productId, requestType, offerProducts, loggedIn }: { productId: string; requestType: RequestType; offerProducts: OfferProduct[]; loggedIn: boolean }) {
  const [offerId, setOfferId] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)

  async function sendRequest() {
    if (requestType === 'exchange' && !offerId) {
      setMessage('Hãy chọn món đồ bạn muốn đề nghị trao đổi.')
      return
    }
    setBusy(true)
    setMessage('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setMessage('Phiên đăng nhập đã hết hạn. Đăng nhập lại để gửi yêu cầu.')
      setBusy(false)
      return
    }
    const { error } = await supabase.rpc('create_transaction_request', {
      p_product_id: productId,
      p_request_type: requestType,
      p_offer_product_id: requestType === 'exchange' ? offerId : null,
    })
    setBusy(false)
    if (error) {
      const text = error.message.toLowerCase()
      setMessage(text.includes('restricted') ? 'Tài khoản hiện bị hạn chế giao dịch.' : text.includes('own product') ? 'Bạn không thể gửi yêu cầu cho sản phẩm của mình.' : 'Chưa thể gửi yêu cầu. Sản phẩm có thể đã hết hoặc bạn đã gửi yêu cầu trước đó.')
      return
    }
    setSent(true)
    setMessage('Đã gửi yêu cầu. Bạn có thể theo dõi trạng thái trong trang tài khoản.')
  }

  async function reportProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const reason = String(form.get('reason') ?? '').trim()
    if (reason.length < 10 || reason.length > 1000) {
      setMessage('Lý do báo cáo cần từ 10 đến 1.000 ký tự.')
      return
    }
    setBusy(true)
    setMessage('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setMessage('Đăng nhập để gửi báo cáo.')
      setBusy(false)
      return
    }
    const { error } = await supabase.from('reports').insert({ product_id: productId, reporter_id: user.id, reason })
    setBusy(false)
    setMessage(error ? 'Không thể gửi báo cáo. Hãy thử lại sau.' : 'Đã gửi báo cáo để quản trị viên xem xét.')
    if (!error) formElement.reset()
  }

  const label = requestType === 'sale' ? 'Gửi yêu cầu mua' : requestType === 'free' ? 'Đăng ký nhận đồ' : 'Gửi đề nghị trao đổi'
  const Icon = requestType === 'exchange' ? Handshake : ShoppingCart

  return <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6"><h2 className="font-extrabold text-slate-900">{requestType === 'free' ? 'Muốn nhận món đồ này?' : requestType === 'exchange' ? 'Đề nghị trao đổi' : 'Quan tâm sản phẩm?'}</h2><p className="mt-2 text-sm leading-6 text-slate-500">Không thanh toán trực tuyến. Hai bên tự trao đổi và thống nhất địa điểm giao nhận được nhà trường cho phép.</p>
    {loggedIn ? <>
      {requestType === 'exchange' && (offerProducts.length ? <label className="mt-4 block text-sm font-semibold text-slate-700">Sản phẩm bạn muốn đổi<select value={offerId} onChange={(event) => setOfferId(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500"><option value="">Chọn sản phẩm đã duyệt của bạn</option>{offerProducts.map((product) => <option key={product.id} value={product.id}>{product.title}</option>)}</select></label> : <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Bạn cần có sản phẩm đã được duyệt để đề nghị trao đổi. <Link href="/sell" className="font-bold underline">Đăng sản phẩm</Link></p>)}
      <button type="button" onClick={sendRequest} disabled={busy || sent || (requestType === 'exchange' && !offerProducts.length)} className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 text-sm font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"><Icon size={17} />{sent ? 'Đã gửi yêu cầu' : busy ? 'Đang gửi…' : label}</button>
    </> : <Link href={`/login?next=${encodeURIComponent(`/products/${productId}`)}`} className="mt-4 flex h-12 w-full items-center justify-center rounded-xl bg-blue-700 px-4 text-sm font-bold text-white transition hover:bg-blue-800">Đăng nhập để gửi yêu cầu</Link>}
    {message && <p role="status" className="mt-3 rounded-xl bg-blue-50 px-3 py-2.5 text-sm leading-5 text-blue-900">{message}</p>}
    {loggedIn && <details className="mt-5 border-t border-slate-100 pt-4"><summary className="flex cursor-pointer list-none items-center gap-2 text-xs font-bold text-slate-500 hover:text-red-700"><Flag size={14} /> Báo cáo sản phẩm</summary><form onSubmit={reportProduct} className="mt-3 space-y-2"><label className="sr-only" htmlFor="report-reason">Lý do báo cáo</label><textarea id="report-reason" name="reason" required minLength={10} maxLength={1000} rows={3} placeholder="Mô tả lý do báo cáo (10–1.000 ký tự)" className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-500" /><button disabled={busy} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60">Gửi báo cáo</button></form></details>}
  </div>
}
