import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Veritabanı seed işlemi başlatılıyor...')
  
  // Test işleri oluştur
  const testJobs = [
    {
      prompt: 'A beautiful sunset over mountains with vibrant colors',
      negativePrompt: 'ugly, blurry, distorted',
      inputImageUrl: 'https://picsum.photos/seed/1/512',
      paramsJson: JSON.stringify({
        steps: 20,
        cfg: 7,
        sampler: 'euler'
      })
    },
    {
      prompt: 'A futuristic city with flying cars and neon lights',
      negativePrompt: 'low quality, bad anatomy',
      inputImageUrl: 'https://picsum.photos/seed/2/512',
      paramsJson: JSON.stringify({
        steps: 25,
        cfg: 8,
        sampler: 'dpmpp_2m'
      })
    },
    {
      prompt: 'A serene forest with a crystal clear lake',
      negativePrompt: 'dark, gloomy, foggy',
      inputImageUrl: 'https://picsum.photos/seed/3/512',
      paramsJson: JSON.stringify({
        steps: 30,
        cfg: 7.5,
        sampler: 'euler_ancestral'
      })
    }
  ]
  
  for (const job of testJobs) {
    const created = await prisma.job.create({
      data: job
    })
    console.log(`✓ İş oluşturuldu: ${created.id}`)
  }
  
  console.log('✅ Seed işlemi tamamlandı!')
}

main()
  .catch((e) => {
    console.error('❌ Seed hatası:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
