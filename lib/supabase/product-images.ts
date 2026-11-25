import type { SupabaseClient } from '@supabase/supabase-js'

export async function signProductImages(supabase: SupabaseClient, paths: string[] | null | undefined) {
  if (!paths?.length) return []
  const results = await Promise.all(paths.slice(0, 4).map(async (path) => {
    const { data, error } = await supabase.storage.from('product-images').createSignedUrl(path, 3600)
    return error ? null : data.signedUrl
  }))
  return results.filter((url): url is string => Boolean(url))
}
