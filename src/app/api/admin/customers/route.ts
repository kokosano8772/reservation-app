// src/app/api/admin/customers/route.ts
import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') ?? ''
  const limit = parseInt(searchParams.get('limit') ?? '50')

  const supabase = await createAdminClient()

  let query = supabase
    .from('customers')
    .select('id, name, name_kana, phone, email, visit_count, last_visit_at, created_at, notes')
    .order('visit_count', { ascending: false })
    .order('last_visit_at', { ascending: false, nullsFirst: false })
    .limit(limit)

  if (search) {
    query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
