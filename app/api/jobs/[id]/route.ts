import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    await prisma.job.delete({
      where: { id }
    })
    
    return NextResponse.json({ message: 'İş silindi' })
    
  } catch (error) {
    console.error('İş silinirken hata:', error)
    return NextResponse.json(
      { error: 'İş silinirken bir hata oluştu' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const job = await prisma.job.findUnique({
      where: { id }
    })
    
    if (!job) {
      return NextResponse.json(
        { error: 'İş bulunamadı' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(job)
    
  } catch (error) {
    console.error('İş getirilirken hata:', error)
    return NextResponse.json(
      { error: 'İş getirilirken bir hata oluştu' },
      { status: 500 }
    )
  }
}
