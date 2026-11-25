'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function SignOutButton() {
  const router = useRouter()
  return (
    <button
      type="button"
      onClick={async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.refresh()
      }}
      className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
      aria-label="Đăng xuất"
      title="Đăng xuất"
    >
      <LogOut size={18} />
    </button>
  )
}
