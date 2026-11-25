'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Action = 'accept' | 'reject' | 'cancel' | 'complete'

export function AccountRequestActions({ requestId, role, status, ownCompleted, otherCompleted }: { requestId: string; role: 'owner' | 'requester'; status: string; ownCompleted: boolean; otherCompleted: boolean }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  async function act(action: Action) {
    setBusy(true)
    setMessage('')
    const supabase = createClient()
    const calls = {
      accept: () => supabase.rpc('respond_schoolmall_request', { p_request_id: requestId, p_response: 'accepted' }),
      reject: () => supabase.rpc('respond_schoolmall_request', { p_request_id: requestId, p_response: 'rejected' }),
      cancel: () => supabase.rpc('cancel_schoolmall_request', { p_request_id: requestId }),
      complete: () => supabase.rpc('confirm_schoolmall_completion', { p_request_id: requestId }),
    }
    const { error } = await calls[action]()
    setBusy(false)
    if (error) {
      setMessage('Thao tác chưa thành công. Có thể trạng thái đã thay đổi; hãy tải lại trang.')
      return
    }
    router.refresh()
  }

  return <div className="mt-3 flex flex-wrap gap-2">{status === 'pending' && role === 'owner' && <><button disabled={busy} onClick={() => act('accept')} className="inline-flex h-9 items-center gap-1 rounded-lg bg-emerald-700 px-3 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-50"><Check size={14} /> Chấp nhận</button><button disabled={busy} onClick={() => act('reject')} className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"><X size={14} /> Từ chối</button></>}{status === 'pending' && role === 'requester' && <button disabled={busy} onClick={() => act('cancel')} className="h-9 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50">Hủy yêu cầu</button>}{status === 'accepted' && !ownCompleted && <button disabled={busy} onClick={() => act('complete')} className="h-9 rounded-lg bg-blue-700 px-3 text-xs font-bold text-white hover:bg-blue-800 disabled:opacity-50">Xác nhận đã hoàn tất</button>}{status === 'accepted' && ownCompleted && <span className="self-center text-xs font-semibold text-emerald-700">Bạn đã xác nhận{otherCompleted ? ' · cả hai bên đã xác nhận' : ' · chờ bên còn lại'}</span>}{message && <p role="status" className="basis-full text-xs text-red-700">{message}</p>}</div>
}

export function DeleteProductButton({ productId, imagePaths }: { productId: string; imagePaths: string[] }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  async function removeProduct() {
    if (!window.confirm('Xóa vĩnh viễn sản phẩm này? Thao tác này không thể hoàn tác.')) return
    setBusy(true)
    setMessage('')
    const supabase = createClient()
    const { data, error } = await supabase.from('products').delete().eq('id', productId).select('id').maybeSingle()
    if (!error && data && imagePaths.length) await supabase.storage.from('product-images').remove(imagePaths)
    setBusy(false)
    if (error || !data) {
      setMessage('Không thể xóa sản phẩm. Chỉ sản phẩm chưa được duyệt hoặc đang ẩn mới có thể xóa.')
      return
    }
    router.refresh()
  }
  return <div className="flex flex-col items-end gap-1"><button onClick={removeProduct} disabled={busy} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:border-red-200 hover:text-red-700 disabled:opacity-50">{busy ? 'Đang xóa…' : 'Xóa'}</button>{message && <p role="status" className="text-xs text-red-700">{message}</p>}</div>
}

export function HideProductButton({ productId }: { productId: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  async function hide() {
    if (!window.confirm('Ẩn sản phẩm này khỏi danh sách?')) return
    setBusy(true)
    const { error } = await createClient().rpc('set_schoolmall_product_status', { p_product_id: productId, p_status: 'hidden', p_reason: null })
    setBusy(false)
    if (!error) router.refresh()
  }
  return <button onClick={hide} disabled={busy} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:border-red-200 hover:text-red-700 disabled:opacity-50">{busy ? 'Đang ẩn…' : 'Ẩn sản phẩm'}</button>
}
