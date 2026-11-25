import Link from 'next/link'
import { ArrowUpRight, BookOpen, Search, ShoppingBag, UserRound } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { SignOutButton } from './sign-out-button'

export async function Header() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0]

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-5 px-5 sm:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="SchoolMall – Trang chủ">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-700 text-white shadow-md shadow-blue-200"><BookOpen size={21} /></span>
          <span className="text-[19px] font-extrabold tracking-tight text-slate-900">School<span className="text-blue-700">Mall</span></span>
        </Link>
        <nav aria-label="Điều hướng chính" className="hidden items-center gap-7 lg:flex">
          <Link className="text-sm font-semibold text-slate-700 transition hover:text-blue-700" href="/">Trang chủ</Link>
          <Link className="text-sm font-semibold text-slate-700 transition hover:text-blue-700" href="/products">Mua sắm</Link>
          <Link className="text-sm font-semibold text-slate-700 transition hover:text-blue-700" href="/products?type=exchange">Trao đổi</Link>
          <Link className="text-sm font-semibold text-slate-700 transition hover:text-blue-700" href="/products?type=free">Cho tặng</Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/products" aria-label="Tìm sản phẩm" className="flex h-10 w-10 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 lg:hidden"><Search size={19} /></Link>
          <Link href={user ? '/sell' : '/login?next=%2Fsell'} className="hidden items-center gap-2 rounded-full bg-orange-400 px-4 py-2.5 text-sm font-bold text-slate-950 shadow-sm transition hover:bg-orange-300 sm:flex">
            <ShoppingBag size={16} /> Đăng sản phẩm <ArrowUpRight size={15} />
          </Link>
          {user ? (
            <div className="flex items-center gap-2">
              <span className="hidden max-w-28 truncate text-sm font-semibold text-slate-700 md:block">{displayName}</span>
              <Link href="/account" aria-label="Tài khoản của tôi" className="inline-flex h-10 items-center gap-2 rounded-full px-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100"><UserRound size={17} /><span className="hidden sm:inline">Tài khoản</span></Link>
              <SignOutButton />
            </div>
          ) : (
            <Link href="/login" className="rounded-full px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100">Đăng nhập</Link>
          )}
        </div>
      </div>
    </header>
  )
}
