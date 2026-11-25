'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const router = useRouter()
  const params = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const next = params.get('next')
  const redirectTo = next?.startsWith('/') && !next.startsWith('//') ? next : '/'
  const isSignup = mode === 'signup'

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    const form = new FormData(event.currentTarget)
    const email = String(form.get('email') ?? '').trim().toLowerCase()
    const password = String(form.get('password') ?? '')
    const supabase = createClient()

    if (isSignup) {
      const displayName = String(form.get('displayName') ?? '').trim()
      const grade = String(form.get('grade') ?? '').trim()
      if (displayName.length < 2 || displayName.length > 50) {
        setMessage('Tên hiển thị cần có từ 2 đến 50 ký tự.')
        setLoading(false)
        return
      }
      if (password.length < 8) {
        setMessage('Mật khẩu cần có ít nhất 8 ký tự.')
        setLoading(false)
        return
      }
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? `${window.location.origin}/auth/callback`,
          data: { display_name: displayName, grade: grade.slice(0, 20) },
        },
      })
      if (!error) {
        setMessage('Nếu địa chỉ email hợp lệ, bạn sẽ nhận được thư xác nhận. Hãy mở email để kích hoạt tài khoản trước khi đăng nhập.')
      } else if (error.message.toLowerCase().includes('password')) {
        setMessage('Mật khẩu chưa đáp ứng yêu cầu bảo mật. Hãy chọn mật khẩu dài hơn.')
      } else if (error.status === 429) {
        setMessage('Bạn thao tác quá nhanh. Vui lòng đợi một lúc rồi thử lại.')
      } else if (error.message.toLowerCase().includes('email_address_invalid')) {
        setMessage('Email này không hợp lệ. Hãy dùng một địa chỉ email thực.')
      } else {
        setMessage('Chưa thể tạo tài khoản lúc này. Vui lòng kiểm tra thông tin và thử lại sau.')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (!error) {
        router.replace(redirectTo)
        router.refresh()
      } else if (error.message.toLowerCase().includes('not confirmed')) {
        setMessage('Hãy xác nhận email từ hộp thư trước khi đăng nhập.')
      } else if (error.status === 429) {
        setMessage('Bạn đăng nhập quá nhiều lần. Vui lòng đợi một lúc rồi thử lại.')
      } else {
        setMessage('Email hoặc mật khẩu không chính xác.')
      }
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {isSignup && <>
        <label className="block text-sm font-semibold text-slate-700">Tên hiển thị<input name="displayName" required minLength={2} maxLength={50} autoComplete="name" className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100" placeholder="Tên bạn muốn mọi người gọi" /></label>
        <label className="block text-sm font-semibold text-slate-700">Lớp <span className="font-normal text-slate-400">(không bắt buộc)</span><input name="grade" maxLength={20} className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100" placeholder="Ví dụ: 10A1" /></label>
      </>}
      <label className="block text-sm font-semibold text-slate-700">Email<input name="email" type="email" required autoComplete="email" className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100" placeholder="ban@email.com" /></label>
      <label className="block text-sm font-semibold text-slate-700">Mật khẩu<input name="password" type="password" required minLength={8} autoComplete={isSignup ? 'new-password' : 'current-password'} className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100" placeholder={isSignup ? 'Ít nhất 8 ký tự' : 'Nhập mật khẩu'} /></label>
      {message && <p role="status" className="rounded-xl bg-blue-50 px-4 py-3 text-sm leading-5 text-blue-900">{message}</p>}
      <button disabled={loading} className="flex h-12 w-full items-center justify-center rounded-xl bg-blue-700 text-sm font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60">{loading ? 'Đang xử lý…' : isSignup ? 'Tạo tài khoản' : 'Đăng nhập'}</button>
      <p className="text-center text-sm text-slate-500">{isSignup ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}{' '}<Link href={isSignup ? '/login' : '/sign-up'} className="font-bold text-blue-700 hover:underline">{isSignup ? 'Đăng nhập' : 'Đăng ký'}</Link></p>
    </form>
  )
}
