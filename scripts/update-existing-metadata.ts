import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function updateExistingGenerations() {
  console.log('🔄 Starting database update...')
  console.log('')

  try {
    // Tüm completed generation'ları al
    const generations = await prisma.generationRequest.findMany({
      where: {
        status: 'completed'
      },
      include: {
        generatedPhotos: {
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    console.log(`📊 Found ${generations.length} completed generations`)
    console.log('')

    let updatedCount = 0
    let skippedCount = 0

    for (const generation of generations) {
      console.log(`Processing: ${generation.id}`)
      
      // Mevcut brandIdentity'yi parse et
      let brandIdentity: any = {}
      try {
        if (generation.brandIdentity) {
          brandIdentity = JSON.parse(generation.brandIdentity)
        }
      } catch (error) {
        console.log(`  ⚠️ Could not parse brandIdentity, creating new`)
      }

      // Eğer zaten metadata varsa skip et
      if (brandIdentity.metadata?.images && brandIdentity.metadata?.photoCount) {
        console.log(`  ⏭️ Already has metadata, skipping`)
        skippedCount++
        continue
      }

      // Fotoğraf URL'lerini al
      const photoUrls = generation.generatedPhotos.map(photo => photo.photoUrl)

      if (photoUrls.length === 0) {
        console.log(`  ⚠️ No photos found, skipping`)
        skippedCount++
        continue
      }

      // Metadata ekle
      brandIdentity.metadata = {
        images: photoUrls,
        photoCount: photoUrls.length
      }

      // Database'i güncelle
      await prisma.generationRequest.update({
        where: { id: generation.id },
        data: {
          brandIdentity: JSON.stringify(brandIdentity)
        }
      })

      console.log(`  ✅ Updated with ${photoUrls.length} photos`)
      updatedCount++
    }

    console.log('')
    console.log('🎉 Update complete!')
    console.log(`  ✅ Updated: ${updatedCount}`)
    console.log(`  ⏭️ Skipped: ${skippedCount}`)
    console.log(`  📊 Total: ${generations.length}`)

  } catch (error) {
    console.error('❌ Error updating database:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the migration
updateExistingGenerations()
  .then(() => {
    console.log('')
    console.log('✅ Migration successful!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  })
