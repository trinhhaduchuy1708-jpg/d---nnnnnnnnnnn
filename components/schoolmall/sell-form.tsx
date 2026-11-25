'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ImagePlus, Trash2, Upload } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Category = { id: string; name: string }
type Preview = { file?: File; path?: string; url: string }
type InitialProduct = { id: string; category_id: string; title: string; description: string; condition: string; transaction_type: string; price: number | null; exchange_wish: string | null; image_paths: string[]; imageUrls: string[] }

function compressImage(file: File) {
  return new Promise<Blob>((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    const objectUrl = URL.createObjectURL(file)
    image.onload = () => {
      const scale = Math.min(1, 1400 / Math.max(image.naturalWidth, image.naturalHeight))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(image.naturalWidth * scale)
      canvas.height = Math.round(image.naturalHeight * scale)
      const context = canvas.getContext('2d')
      if (!context) {
        URL.revokeObjectURL(objectUrl)
        reject(new Error('Không thể xử lý hình ảnh.'))
        return
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(objectUrl)
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Không thể nén hình ảnh.')), 'image/webp', 0.82)
    }
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Tệp ảnh không đọc được.'))
    }
    image.src = objectUrl
  })
}

export function SellForm({ categories, initial }: { categories: Category[]; initial?: InitialProduct }) {
  const router = useRouter()
  const [type, setType] = useState(initial?.transaction_type ?? 'sale')
  const [previews, setPreviews] = useState<Preview[]>(() => initial?.image_paths.map((path, index) => ({ path, url: initial.imageUrls[index] })).filter((image) => image.url) ?? [])
  const previewRef = useRef(previews)
  previewRef.current = previews
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => () => previewRef.current.forEach(({ file, url }) => { if (file) URL.revokeObjectURL(url) }), [])

  function selectImages(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (files.length + previews.length > 4) {
      setMessage('Mỗi sản phẩm đăng tối đa 4 ảnh.')
      return
    }
    if (files.some((file) => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024)) {
      setMessage('Ảnh phải là JPG, PNG hoặc WebP và không vượt quá 5 MB mỗi ảnh.')
      return
    }
    setMessage('')
    setPreviews((current) => [...current, ...files.map((file) => ({ file, url: URL.createObjectURL(file) }))])
  }

  function removeImage(index: number) {
    setPreviews((current) => {
      const next = [...current]
      URL.revokeObjectURL(next[index].url)
      next.splice(index, 1)
      return next
    })
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!categories.length) {
      setMessage('Chưa có danh mục hoạt động để đăng sản phẩm.')
      return
    }
    if (!previews.length) {
      setMessage('Vui lòng thêm ít nhất một ảnh sản phẩm.')
      return
    }
    setBusy(true)
    setMessage('')
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      setMessage('Phiên đăng nhập đã hết hạn. Đăng nhập lại để tiếp tục.')
      setBusy(false)
      return
    }

    const title = String(form.get('title') ?? '').trim()
    const description = String(form.get('description') ?? '').trim()
    const categoryId = String(form.get('category_id') ?? '')
    const condition = String(form.get('condition') ?? '')
    const exchangeWish = String(form.get('exchange_wish') ?? '').trim()
    const priceValue = String(form.get('price') ?? '').trim()
    const price = type === 'sale' ? Number(priceValue) : null

    if (title.length < 3 || title.length > 100 || description.length < 10 || description.length > 3000) {
      setMessage('Tên cần 3–100 ký tự; mô tả cần 10–3.000 ký tự.')
      setBusy(false)
      return
    }
    if (type === 'sale' && (!Number.isFinite(price) || price! <= 0 || price! > 100000000)) {
      setMessage('Nhập giá bán hợp lệ, lớn hơn 0.')
      setBusy(false)
      return
    }
    if (type === 'exchange' && exchangeWish.length < 3) {
      setMessage('Hãy mô tả món đồ bạn muốn đổi lấy.')
      setBusy(false)
      return
    }

    const uploaded: string[] = []
    const retained = previews.flatMap(({ file, path }) => !file && path ? [path] : [])
    try {
      for (const { file } of previews) {
        if (!file) continue
        const blob = await compressImage(file)
        if (blob.size > 5 * 1024 * 1024) throw new Error('Ảnh sau khi nén vẫn vượt quá 5 MB.')
        const path = `products/${user.id}/${crypto.randomUUID()}.webp`
        const { error } = await supabase.storage.from('product-images').upload(path, blob, { contentType: 'image/webp', cacheControl: '3600', upsert: false })
        if (error) throw new Error('Không thể tải ảnh lên. Vui lòng thử lại.')
        uploaded.push(path)
      }

      const imagePaths = [...retained, ...uploaded]
      const changes = {
        category_id: categoryId,
        title,
        description,
        condition,
        transaction_type: type,
        price,
        exchange_wish: type === 'exchange' ? exchangeWish : null,
        image_paths: imagePaths,
      }
      if (initial) {
        const { data, error } = await supabase.from('products').update({ ...changes, status: 'pending', rejection_reason: null }).eq('id', initial.id).eq('owner_id', user.id).select('id').maybeSingle()
        if (error || !data) throw new Error('Không thể cập nhật sản phẩm. Chỉ sản phẩm đang chờ hoặc chưa được duyệt mới có thể chỉnh sửa.')
        const removed = initial.image_paths.filter((path) => !imagePaths.includes(path))
        if (removed.length) await supabase.storage.from('product-images').remove(removed)
        previews.forEach(({ file, url }) => { if (file) URL.revokeObjectURL(url) })
        router.replace('/account')
        router.refresh()
      } else {
        const { error } = await supabase.from('products').insert({ owner_id: user.id, ...changes })
        if (error) throw new Error(error.message.toLowerCase().includes('restricted') ? 'Tài khoản hiện bị hạn chế đăng sản phẩm.' : 'Không thể gửi sản phẩm. Vui lòng kiểm tra thông tin và thử lại.')
        previews.forEach(({ file, url }) => { if (file) URL.revokeObjectURL(url) })
        setPreviews([])
        formElement.reset()
        setType('sale')
        setMessage('Đã gửi sản phẩm để quản trị viên duyệt. Sản phẩm sẽ hiển thị sau khi được duyệt.')
      }
    } catch (error) {
      if (uploaded.length) await supabase.storage.from('product-images').remove(uploaded)
      setMessage(error instanceof Error ? error.message : 'Đã có lỗi khi gửi sản phẩm.')
    } finally {
      setBusy(false)
    }
  }

  return <form onSubmit={submit} className="space-y-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
    <div className="grid gap-5 sm:grid-cols-2">
      <label className="text-sm font-bold text-slate-700 sm:col-span-2">Tên sản phẩm<input name="title" required minLength={3} maxLength={100} defaultValue={initial?.title ?? ''} placeholder="Ví dụ: Máy tính Casio fx-580VN X" className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 font-normal outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" /></label>
      <label className="text-sm font-bold text-slate-700">Danh mục<select name="category_id" required defaultValue={initial?.category_id ?? ''} className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 font-normal outline-none focus:border-blue-500"><option value="" disabled>Chọn danh mục</option>{categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label>
      <label className="text-sm font-bold text-slate-700">Tình trạng<select name="condition" required defaultValue={initial?.condition ?? 'good'} className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 font-normal outline-none focus:border-blue-500"><option value="new">Mới</option><option value="like_new">Như mới</option><option value="good">Tốt</option><option value="fair">Đã qua sử dụng</option></select></label>
      <label className="text-sm font-bold text-slate-700 sm:col-span-2">Mô tả<textarea name="description" required minLength={10} maxLength={3000} rows={5} defaultValue={initial?.description ?? ''} placeholder="Mô tả tình trạng và thông tin hữu ích về sản phẩm…" className="mt-2 w-full resize-y rounded-xl border border-slate-200 p-4 font-normal leading-6 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" /></label>
    </div>
    <fieldset><legend className="text-sm font-bold text-slate-700">Hình thức giao dịch</legend><div className="mt-3 grid gap-3 sm:grid-cols-3">{[['sale', 'Mua bán'], ['exchange', 'Trao đổi'], ['free', 'Cho tặng']].map(([value, label]) => <label key={value} className={`cursor-pointer rounded-2xl border p-4 transition ${type === value ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-100' : 'border-slate-200 hover:border-slate-300'}`}><input type="radio" name="type-choice" value={value} checked={type === value} onChange={() => setType(value)} className="sr-only" /><span className="text-sm font-extrabold text-slate-800">{label}</span><span className="mt-1 block text-xs text-slate-500">{value === 'sale' ? 'Tự thỏa thuận mức giá' : value === 'exchange' ? 'Đổi lấy món đồ phù hợp' : 'Chia sẻ miễn phí trong trường'}</span></label>)}</div></fieldset>
    {type === 'sale' && <label className="block max-w-xs text-sm font-bold text-slate-700">Giá bán (VNĐ)<input name="price" type="number" min="1" max="100000000" step="1000" required defaultValue={initial?.price ?? ''} className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 font-normal outline-none focus:border-blue-500" placeholder="Ví dụ: 50000" /></label>}
    {type === 'exchange' && <label className="block text-sm font-bold text-slate-700">Bạn muốn đổi lấy<input name="exchange_wish" minLength={3} maxLength={500} required defaultValue={initial?.exchange_wish ?? ''} placeholder="Mô tả món đồ bạn đang tìm" className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 font-normal outline-none focus:border-blue-500" /></label>}
    <div><div className="flex items-end justify-between gap-3"><div><p className="text-sm font-bold text-slate-700">Ảnh sản phẩm</p><p className="mt-1 text-xs text-slate-500">Tối đa 4 ảnh · JPG, PNG hoặc WebP · tối đa 5 MB/ảnh</p></div><span className="text-xs font-bold text-slate-400">{previews.length}/4</span></div><div className="mt-3 flex flex-wrap gap-3">{previews.map(({ url, file, path }, index) => <div key={path ?? `${file?.name ?? 'image'}-${index}`} className="relative h-24 w-24 overflow-hidden rounded-2xl border border-slate-200"><img src={url} alt={`Ảnh xem trước ${index + 1}`} className="h-full w-full object-cover" /><button type="button" onClick={() => removeImage(index)} aria-label={`Xóa ảnh ${index + 1}`} className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900/75 text-white"><Trash2 size={14} /></button></div>)}{previews.length < 4 && <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-slate-500 transition hover:border-blue-400 hover:bg-blue-50"><ImagePlus size={23} /><span className="text-[11px] font-bold">Thêm ảnh</span><input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={selectImages} className="sr-only" /></label>}</div></div>
    {message && <p role="status" className="rounded-2xl bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-900">{message}</p>}
    <div className="rounded-2xl bg-amber-50 p-4 text-xs leading-5 text-amber-900">Mọi sản phẩm được kiểm duyệt trước khi hiển thị. Không đăng thông tin liên hệ riêng tư; giao nhận do hai bên tự thống nhất tại nơi được nhà trường cho phép.</div>
    <button disabled={busy || !categories.length} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 text-sm font-extrabold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60">{busy ? 'Đang lưu sản phẩm…' : <><Upload size={17} /> {initial ? 'Lưu thay đổi và gửi duyệt lại' : 'Gửi sản phẩm để duyệt'}</>}</button>
  </form>
}
