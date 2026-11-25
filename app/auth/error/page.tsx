import Link from 'next/link'
import { AlertCircle, BookOpen } from 'lucide-react'

export default function AuthErrorPage() {
  return <main className="flex min-h-screen items-center justify-center bg-[#f7f9fc] px-5"><div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-200/50"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700"><AlertCircle size={26} /></span><h1 className="mt-5 text-2xl font-black text-slate-900">Không thể xác nhận email</h1><p className="mt-2 text-sm leading-6 text-slate-500">Liên kết có thể đã hết hạn hoặc đã được sử dụng. Hãy đăng nhập hoặc đăng ký lại để nhận hướng dẫn mới.</p><Link href="/login" className="mt-6 inline-flex items-center gap-2 rounded-full bg-blue-700 px-5 py-3 text-sm font-bold text-white"><BookOpen size={16} /> Đến trang đăng nhập</Link></div></main>
}
