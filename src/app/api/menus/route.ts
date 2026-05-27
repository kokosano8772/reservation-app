// src/app/api/menus/route.ts
import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('menus')
    .select('*')
    .eq('is_active', true)
    .order('category')
    .order('price')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
