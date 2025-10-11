/**
 * Post-Process Types API
 * GET /api/post-process/types
 * 
 * Tüm kullanılabilir işlem tiplerini ve parametrelerini listeler
 */

import { NextRequest, NextResponse } from 'next/server'
import { PROCESS_DESCRIPTIONS, PROCESS_CATEGORIES } from '@/lib/post-process/types'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const type = searchParams.get('type')

  // Tek bir işlem tipi sorgulandı
  if (type && type in PROCESS_DESCRIPTIONS) {
    return NextResponse.json({
      success: true,
      type,
      ...PROCESS_DESCRIPTIONS[type as keyof typeof PROCESS_DESCRIPTIONS]
    })
  }

  // Kategori bazlı filtreleme
  if (category && category in PROCESS_CATEGORIES) {
    const categoryTypes = PROCESS_CATEGORIES[category as keyof typeof PROCESS_CATEGORIES]
    const processes = categoryTypes.map(type => ({
      type,
      ...PROCESS_DESCRIPTIONS[type as keyof typeof PROCESS_DESCRIPTIONS]
    }))

    return NextResponse.json({
      success: true,
      category,
      processes,
      count: processes.length
    })
  }

  // Tüm işlemleri ve kategorileri getir
  return NextResponse.json({
    success: true,
    categories: PROCESS_CATEGORIES,
    processes: PROCESS_DESCRIPTIONS,
    totalProcesses: Object.keys(PROCESS_DESCRIPTIONS).length,
    usage: {
      getAllTypes: '/api/post-process/types',
      getByCategory: '/api/post-process/types?category=PORTRAIT',
      getSpecificType: '/api/post-process/types?type=background-color',
      availableCategories: Object.keys(PROCESS_CATEGORIES)
    }
  })
}
