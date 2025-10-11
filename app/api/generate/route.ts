import { NextRequest, NextResponse } from 'next/server'
import type { GenerationRequest as GenerationRequestModel } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { applyCorsHeaders, handleCorsOptions, corsJsonResponse } from '@/lib/cors'

export async function OPTIONS(request: NextRequest) {
  return handleCorsOptions(request)
}

// Lensia.ai'dan gelen istek tipi
interface LegacyUserResponses {
  sector?: string
  platform?: string
  style?: string
  mood?: string
  colors?: string[]
  additionalDetails?: string
  customTags?: string[]
  additionalNotes?: string
}

interface ProductUserResponses {
  productName?: string
  productDescription?: string
  targetPlatforms?: string[]
  aspectRatios?: string[]
  moods?: string[]
  environments?: string[]
  lightings?: string[]
  angles?: string[]
  hasModel?: boolean
  keepModel?: boolean
  modelPoses?: string[]
  modelGender?: string | null
  modelAge?: string | number | null
  includeProps?: boolean
  showProductOnly?: boolean
  brandColors?: string | string[] | null
  photoCount?: number
}

interface GenerateRequest {
  userId: string
  userResponses: LegacyUserResponses & ProductUserResponses & Record<string, unknown>
  uploadedImageBase64?: string
  aspectRatio?: '1:1' | '4:5' | '16:9' | '9:16'
  negativePrompt?: string
  productImages?: string[]
  referenceImages?: string[]
  generationId?: string
  prompt?: string
  style?: string
  metadata?: Record<string, unknown>
}

interface NormalizedResponses {
  sector: string
  platform: string
  style: string
  mood: string
  colors: string[]
  additionalDetails: string
  customTags: string[]
  additionalNotes?: string
  warnings: string[]
  brandIdentityPayload?: Record<string, unknown>
  primaryAspectRatio: string
  requestedPhotoCount: number
}

const DEFAULTS = {
  sector: 'ecommerce',
  platform: 'general',
  style: 'ecommerce',
  mood: 'neutral',
}

const ALLOWED_PHOTO_COUNTS = new Set([2, 4, 6, 8])
const ALLOWED_ASPECT_RATIOS = new Set(['1:1', '4:5', '16:9', '9:16'])

function safeJsonParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch (error) {
    console.warn('JSON parse warning:', error)
    return fallback
  }
}

function validateImageArrays(body: GenerateRequest): string[] {
  const errors: string[] = []

  if (!Array.isArray(body.productImages) || body.productImages.length === 0) {
    errors.push('productImages alanı en az bir URL içermelidir (1-4 arası).')
  } else {
    if (body.productImages.length > 4) {
      errors.push('productImages en fazla 4 görsel içerebilir.')
    }
    if (!body.productImages.every((url) => typeof url === 'string' && url.trim().length > 0)) {
      errors.push('productImages yalnızca geçerli URL stringleri içermelidir.')
    }
  }

  if (body.referenceImages) {
    if (!Array.isArray(body.referenceImages)) {
      errors.push('referenceImages bir dizi olmalıdır.')
    } else {
      if (body.referenceImages.length > 6) {
        errors.push('referenceImages en fazla 6 görsel içerebilir.')
      }
      if (!body.referenceImages.every((url) => typeof url === 'string' && url.trim().length > 0)) {
        errors.push('referenceImages yalnızca geçerli URL stringleri içermelidir.')
      }
    }
  }

  return errors
}

function normalizeUserResponses(
  request: GenerateRequest
): { normalized: NormalizedResponses; errors: string[] } {
  const errors: string[] = []
  const warnings: string[] = []
  const responses = request.userResponses

  if (!responses || typeof responses !== 'object' || Array.isArray(responses)) {
    errors.push('userResponses geçerli bir JSON objesi olmalıdır.')
    return {
      normalized: {
        sector: DEFAULTS.sector,
        platform: DEFAULTS.platform,
        style: DEFAULTS.style,
        mood: DEFAULTS.mood,
        colors: [],
        additionalDetails: 'Lensia.ai otomatik oluşturulan istek',
        customTags: [],
        additionalNotes: undefined,
        warnings: ['Varsayılan değerler kullanıldı.'],
        brandIdentityPayload: {
          productImages: request.productImages ?? [],
          referenceImages: request.referenceImages ?? [],
          rawUserResponses: request.userResponses ?? null,
        },
        primaryAspectRatio: '1:1',
        requestedPhotoCount: 4,
      },
      errors,
    }
  }

  const legacy = responses as LegacyUserResponses
  const product = responses as ProductUserResponses
  const trimmedString = (value: unknown) => (typeof value === 'string' ? value.trim() : '')

  const productName = trimmedString(product.productName)
  if (!productName) {
    errors.push('userResponses.productName zorunludur.')
  }

  const productDescription = trimmedString(product.productDescription)

  const targetPlatforms = Array.isArray(product.targetPlatforms)
    ? product.targetPlatforms.map(trimmedString).filter((item) => item.length > 0)
    : []
  if (targetPlatforms.length === 0) {
    errors.push('userResponses.targetPlatforms en az bir platform içermelidir.')
  }

  const aspectRatios = Array.isArray(product.aspectRatios)
    ? product.aspectRatios.map(trimmedString).filter((item) => item.length > 0)
    : []
  if (aspectRatios.length === 0) {
    errors.push('userResponses.aspectRatios en az bir değer içermelidir.')
  }

  const moods = Array.isArray(product.moods)
    ? product.moods.map(trimmedString).filter((item) => item.length > 0)
    : []
  if (moods.length === 0) {
    errors.push('userResponses.moods en az bir değer içermelidir.')
  }

  const environments = Array.isArray(product.environments)
    ? product.environments.map(trimmedString).filter((item) => item.length > 0)
    : []
  if (environments.length === 0) {
    errors.push('userResponses.environments en az bir değer içermelidir.')
  }

  const lightings = Array.isArray(product.lightings)
    ? product.lightings.map(trimmedString).filter((item) => item.length > 0)
    : []
  if (lightings.length === 0) {
    errors.push('userResponses.lightings en az bir değer içermelidir.')
  }

  const angles = Array.isArray(product.angles)
    ? product.angles.map(trimmedString).filter((item) => item.length > 0)
    : []
  if (angles.length === 0) {
    errors.push('userResponses.angles en az bir değer içermelidir.')
  }

  if (typeof product.hasModel !== 'boolean') {
    errors.push('userResponses.hasModel alanı boolean olmalıdır.')
  }

  if (typeof product.keepModel !== 'boolean') {
    errors.push('userResponses.keepModel alanı boolean olmalıdır.')
  }

  const modelPoses = Array.isArray(product.modelPoses)
    ? product.modelPoses.map(trimmedString).filter((item) => item.length > 0)
    : []
  if (!Array.isArray(product.modelPoses)) {
    errors.push('userResponses.modelPoses bir dizi olmalıdır (boş olabilir).')
  }

  const modelGenderValid =
    product.modelGender === null ||
    product.modelGender === undefined ||
    typeof product.modelGender === 'string'
  if (!modelGenderValid) {
    errors.push('userResponses.modelGender string veya null olmalıdır.')
  }

  const modelAgeValid =
    product.modelAge === null ||
    product.modelAge === undefined ||
    typeof product.modelAge === 'string' ||
    typeof product.modelAge === 'number'
  if (!modelAgeValid) {
    errors.push('userResponses.modelAge string, number veya null olmalıdır.')
  }

  if (typeof product.includeProps !== 'boolean') {
    errors.push('userResponses.includeProps alanı boolean olmalıdır.')
  }

  if (typeof product.showProductOnly !== 'boolean') {
    errors.push('userResponses.showProductOnly alanı boolean olmalıdır.')
  }

  if (typeof product.photoCount !== 'number') {
    errors.push('userResponses.photoCount sayısal bir değer olmalıdır (2,4,6 veya 8).')
  }

  const requestedPhotoCount = typeof product.photoCount === 'number' ? product.photoCount : 4
  if (!ALLOWED_PHOTO_COUNTS.has(requestedPhotoCount)) {
    errors.push('userResponses.photoCount 2, 4, 6 veya 8 olmalıdır.')
  }

  if (product.hasModel === true) {
    if (!modelGenderValid || product.modelGender === null || trimmedString(product.modelGender) === '') {
      errors.push('userResponses.modelGender, model kullanılırken zorunludur.')
    }
    if (!modelAgeValid || product.modelAge === null || trimmedString(String(product.modelAge)) === '') {
      errors.push('userResponses.modelAge, model kullanılırken zorunludur.')
    }
    if (modelPoses.length === 0) {
      errors.push('userResponses.modelPoses, model kullanılırken en az bir poz içermelidir.')
    }
  }

  const colorsFromLegacy = Array.isArray(legacy.colors) ? legacy.colors : undefined
  const colorsFromBrand =
    typeof product.brandColors === 'string'
      ? product.brandColors.split(',').map((c) => c.trim()).filter(Boolean)
      : Array.isArray(product.brandColors)
      ? product.brandColors
      : undefined

  const colors = colorsFromLegacy || colorsFromBrand || []

  if (!colors.length) {
    warnings.push('brandColors sağlanmadı, renk paleti boş olarak kaydedildi.')
  }

  const platform = legacy.platform || targetPlatforms[0] || DEFAULTS.platform
  if (!legacy.platform && targetPlatforms.length === 0) {
    warnings.push('Platform bilgisi bulunamadı, "general" olarak ayarlandı.')
  }

  const style = legacy.style || request.style || DEFAULTS.style
  if (!legacy.style && !request.style) {
    warnings.push('Stil bilgisi sağlanmadı, "ecommerce" olarak ayarlandı.')
  }

  const mood = legacy.mood || moods[0] || DEFAULTS.mood
  if (!legacy.mood && moods.length === 0) {
    warnings.push('Mood bilgisi bulunamadı, "neutral" olarak ayarlandı.')
  }

  const sector = legacy.sector || DEFAULTS.sector
  if (!legacy.sector) {
    warnings.push('Sektör bilgisi sağlanmadı, "ecommerce" olarak kaydedildi.')
  }

  const additionalDetails =
    legacy.additionalDetails ||
    [productName, productDescription]
      .filter(Boolean)
      .join(' - ') ||
    'Lensia.ai otomatik oluşturulan istek'

  const customTags = Array.isArray(legacy.customTags) ? legacy.customTags.slice(0, 20) : []

  const derivedTags: string[] = []
  ;[
    targetPlatforms,
    aspectRatios,
    environments,
    lightings,
    angles,
    modelPoses,
  ].forEach((list) => {
    if (Array.isArray(list)) {
      derivedTags.push(...list.map((item) => String(item)))
    }
  })

  const uniqueTags = Array.from(new Set([...customTags, ...derivedTags])).filter(Boolean)

  const additionalNotes =
    legacy.additionalNotes ||
    JSON.stringify(
      {
        productName,
        productDescription,
        hasModel: product.hasModel ?? null,
        keepModel: product.keepModel ?? null,
        showProductOnly: product.showProductOnly ?? null,
        includeProps: product.includeProps ?? null,
        modelGender: product.modelGender ?? null,
        modelAge: product.modelAge ?? null,
        requestedPhotoCount,
        targetPlatforms,
        aspectRatios,
        moods,
        environments,
        lightings,
        angles,
      },
      null,
      2
    )

  const brandIdentityPayload: Record<string, unknown> = {
    productName,
    productDescription,
    productImages: request.productImages ?? [],
    referenceImages: request.referenceImages ?? [],
    targetPlatforms,
    aspectRatios,
    moods,
    environments,
    lightings,
    angles,
    hasModel: product.hasModel ?? null,
    keepModel: product.keepModel ?? null,
    modelPoses,
    modelGender: product.modelGender ?? null,
    modelAge: product.modelAge ?? null,
    includeProps: product.includeProps ?? null,
    showProductOnly: product.showProductOnly ?? null,
    brandColors:
      typeof product.brandColors === 'string'
        ? product.brandColors
        : Array.isArray(product.brandColors)
        ? product.brandColors.join(', ')
        : null,
    requestedPhotoCount,
    originalPrompt: request.prompt ?? null,
    generationId: request.generationId ?? null,
    metadata: request.metadata ?? null,
    rawUserResponses: request.userResponses,
  }

  const primaryAspectRatio =
    aspectRatios.find((ratio) => ALLOWED_ASPECT_RATIOS.has(ratio)) || aspectRatios[0] || '1:1'

  return {
    normalized: {
      sector,
      platform,
      style,
      mood,
      colors,
      additionalDetails,
      customTags: uniqueTags,
      additionalNotes,
      warnings,
      brandIdentityPayload,
      primaryAspectRatio,
      requestedPhotoCount,
    },
    errors,
  }
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') ?? ''

    if (!contentType.includes('application/json')) {
      const response = NextResponse.json(
        {
          success: false,
          error: 'Geçersiz içerik türü. Lütfen application/json ile gönderin.',
        },
        { status: 400 }
      )
      return applyCorsHeaders(request, response)
    }

    const rawBody = await request.text()

    if (!rawBody.trim()) {
      const response = NextResponse.json(
        {
          success: false,
          error: 'İstek gövdesi boş olamaz.',
        },
        { status: 400 }
      )
      return applyCorsHeaders(request, response)
    }

    let parsedBody: GenerateRequest

    try {
      parsedBody = JSON.parse(rawBody)
    } catch (parseError) {
      console.error('Generate API parse error:', parseError)
      const response = NextResponse.json(
        {
          success: false,
          error: 'Geçersiz JSON formatı.',
        },
        { status: 400 }
      )
      return applyCorsHeaders(request, response)
    }

    if (!parsedBody?.userId || !parsedBody?.userResponses) {
      const response = NextResponse.json(
        {
          success: false,
          error: 'Zorunlu alanlar eksik.',
          details: {
            errors: ['userId ve userResponses alanları zorunludur.'],
          },
        },
        { status: 400 }
      )
      return applyCorsHeaders(request, response)
    }

    const body: GenerateRequest = parsedBody

    const imageValidationErrors = validateImageArrays(body)
    if (imageValidationErrors.length > 0) {
      const response = NextResponse.json(
        {
          success: false,
          error: 'Görsel doğrulaması başarısız.',
          details: {
            errors: imageValidationErrors,
          },
        },
        { status: 400 }
      )
      return applyCorsHeaders(request, response)
    }

    const { normalized, errors } = normalizeUserResponses(body)

    if (errors.length > 0) {
      const response = NextResponse.json(
        {
          success: false,
          error: 'Validasyon hatası. Gönderilen veriler eksik veya hatalı.',
          details: {
            errors,
          },
        },
        { status: 400 }
      )
      return applyCorsHeaders(request, response)
    }

    // GenerationRequest oluştur
    const generationRequest = await prisma.generationRequest.create({
      data: {
        userId: body.userId,
        sector: normalized.sector,
        platform: normalized.platform,
        style: normalized.style,
        mood: normalized.mood,
        colors: JSON.stringify(normalized.colors ?? []),
        additionalDetails: normalized.additionalDetails,
        customTags: normalized.customTags.length ? JSON.stringify(normalized.customTags) : null,
        additionalNotes: normalized.additionalNotes,
        uploadedImageBase64: body.uploadedImageBase64 || '',
        aspectRatio: body.aspectRatio || normalized.primaryAspectRatio || '1:1',
        negativePrompt: body.negativePrompt,
        brandIdentity: normalized.brandIdentityPayload
          ? JSON.stringify(normalized.brandIdentityPayload)
          : null,
        currentStep: 'step1_prompt_generation',
        status: 'pending',
      },
    })

    // İş akışı adımlarını oluştur
    const workflowSteps = [
      {
        requestId: generationRequest.id,
        step: 'step1_prompt_generation',
        stepName: 'Prompt Oluşturma',
        status: 'pending',
        progress: 0,
      },
      {
        requestId: generationRequest.id,
        step: 'step2_ai_generation',
        stepName: 'AI ile Fotoğraf Üretimi',
        status: 'pending',
        progress: 0,
        requestedPhotoCount: normalized.requestedPhotoCount,
      },
      {
        requestId: generationRequest.id,
        step: 'step3_user_selection',
        stepName: 'Kullanıcı Seçimi',
        status: 'pending',
        progress: 0,
      },
      {
        requestId: generationRequest.id,
        step: 'step4_refinement',
        stepName: 'Rafine İşlemleri',
        status: 'pending',
        progress: 0,
      },
    ]

    await prisma.workflow.createMany({
      data: workflowSteps,
    })

    // İlk adımı başlat (prompt generation) ve tamamlanmasını bekle
    await startPromptGeneration(generationRequest.id)
    
    // AI generation tamamlanana kadar bekle
    await startAIGeneration(generationRequest.id)
    
    // Güncel durumu al
    const updatedRequest = await prisma.generationRequest.findUnique({
      where: { id: generationRequest.id },
    })
    
    // Oluşturulan fotoğrafları al
    const generatedPhotos = await prisma.generatedPhoto.findMany({
      where: { requestId: generationRequest.id },
      orderBy: { createdAt: 'asc' },
    })
    
    const estimatedSeconds = Math.max(normalized.requestedPhotoCount * 20, 60)

    const response = NextResponse.json(
      {
        generationId: generationRequest.id,
        status: updatedRequest?.status || 'pending',
        // Frontend'in beklediği format
        photos: generatedPhotos.map(photo => photo.photoUrl),
        images: generatedPhotos.map(photo => photo.photoUrl),
        results: generatedPhotos.map(photo => ({
          url: photo.photoUrl,
          thumbnailUrl: photo.thumbnailUrl,
          prompt: photo.prompt,
          model: photo.aiModel,
          metadata: safeJsonParse(photo.metadata, {})
        })),
        data: {
          photos: generatedPhotos.map(photo => photo.photoUrl),
          photoCount: generatedPhotos.length
        }
      },
      { status: 200 }
    )
    return applyCorsHeaders(request, response)
  } catch (error) {
    console.error('Generate API error:', error)
    const response = NextResponse.json(
      {
        success: false,
        error: 'İstek işlenirken bir hata oluştu',
        details: {
          message: error instanceof Error ? error.message : 'Bilinmeyen hata',
        },
      },
      { status: 500 }
    )
    return applyCorsHeaders(request, response)
  }
}

// Prompt oluşturma adımını başlat
async function startPromptGeneration(requestId: string) {
  try {
    const request = await prisma.generationRequest.findUnique({
      where: { id: requestId },
    })

    if (!request) return

    // Workflow adımını güncelle
    const workflow = await prisma.workflow.findFirst({
      where: {
        requestId,
        step: 'step1_prompt_generation',
      },
    })

    if (!workflow) return

    await prisma.workflow.update({
      where: { id: workflow.id },
      data: {
        status: 'processing',
        progress: 50,
        startedAt: new Date(),
      },
    })

    // Prompt oluştur
    const prompt = generatePromptFromResponses(request)

    // Workflow adımını tamamla
    await prisma.workflow.update({
      where: { id: workflow.id },
      data: {
        status: 'completed',
        progress: 100,
        generatedPrompt: prompt,
        completedAt: new Date(),
      },
    })

    // Ana isteği güncelle
    await prisma.generationRequest.update({
      where: { id: requestId },
      data: {
        currentStep: 'step2_ai_generation',
        status: 'processing',
      },
    })
  } catch (error) {
    console.error('Prompt generation error:', error)
    throw error
  }
}

// AI ile fotoğraf üretimi
async function startAIGeneration(requestId: string) {
  try {
    const workflow = await prisma.workflow.findFirst({
      where: {
        requestId,
        step: 'step2_ai_generation',
      },
    })

    if (!workflow) return

    await prisma.workflow.update({
      where: { id: workflow.id },
      data: {
        status: 'processing',
        progress: 10,
        startedAt: new Date(),
      },
    })

    // Burada Gemini 2.5 Flash API çağrısı yapılacak
    // Şimdilik mock data oluşturalım
  const photoCount = workflow.requestedPhotoCount
  const safePhotoCount = Math.max(photoCount || 0, 1)

    const promptWorkflow = await prisma.workflow.findFirst({
      where: { requestId, step: 'step1_prompt_generation' },
    })

    const promptForPhotos = promptWorkflow?.generatedPrompt || 'Generated prompt'

    for (let i = 0; i < safePhotoCount; i++) {
      // Mock fotoğraf URL'i
      const mockPhotoUrl = `https://picsum.photos/seed/${requestId}-${i}/1024/1024`

      await prisma.generatedPhoto.create({
        data: {
          requestId,
          photoUrl: mockPhotoUrl,
          thumbnailUrl: `https://picsum.photos/seed/${requestId}-${i}/300/300`,
          prompt: promptForPhotos,
          negativePrompt: 'low quality, blurry',
          generationStep: 'step2_ai_generation',
          aiModel: 'gemini-2.5-flash',
          metadata: JSON.stringify({
            width: 1024,
            height: 1024,
            seed: `${requestId}-${i}`,
          }),
        },
      })

      // İlerlemeyi güncelle
      const progress = Math.round(((i + 1) / safePhotoCount) * 100)
      await prisma.workflow.update({
        where: { id: workflow.id },
        data: {
          progress,
          generatedPhotoCount: i + 1,
        },
      })
    }

    // Workflow adımını tamamla
    await prisma.workflow.update({
      where: { id: workflow.id },
      data: {
        status: 'completed',
        progress: 100,
        completedAt: new Date(),
      },
    })

    // Tüm oluşturulan fotoğrafları al
    const allGeneratedPhotos = await prisma.generatedPhoto.findMany({
      where: { requestId },
      orderBy: { createdAt: 'asc' },
    })

    // Ana isteği güncelle - Fotoğraflar oluşturuldu, metadata'ya kaydet
    await prisma.generationRequest.update({
      where: { id: requestId },
      data: {
        currentStep: 'completed',
        status: 'completed',
        updatedAt: new Date(),
        // brandIdentity field'ına metadata ekle
        brandIdentity: JSON.stringify({
          ...JSON.parse(
            (await prisma.generationRequest.findUnique({ 
              where: { id: requestId } 
            }))?.brandIdentity || '{}'
          ),
          metadata: {
            images: allGeneratedPhotos.map(photo => photo.photoUrl),
            photoCount: allGeneratedPhotos.length
          }
        })
      },
    })
  } catch (error) {
    console.error('AI generation error:', error)
    throw error
  }
}

// Kullanıcı yanıtlarından AI prompt oluştur
function generatePromptFromResponses(request: GenerationRequestModel): string {
  const colors = JSON.parse(request.colors)
  const customTags = request.customTags ? JSON.parse(request.customTags) : []

  let prompt = `Professional ${request.style} photograph for ${request.sector} sector, `
  prompt += `optimized for ${request.platform}, `
  prompt += `${request.mood} atmosphere, `
  prompt += `color palette: ${colors.join(', ')}, `

  if (request.additionalDetails) {
    prompt += `${request.additionalDetails}, `
  }

  if (customTags.length > 0) {
    prompt += `tags: ${customTags.join(', ')}, `
  }

  if (request.additionalNotes) {
    prompt += `${request.additionalNotes}, `
  }

  prompt += 'high quality, professional photography, 8k resolution, detailed'

  return prompt
}

// GET endpoint - Tüm istekleri listele
export async function GET(request: NextRequest) {
  try {
    const requests = await prisma.generationRequest.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
      include: {
        workflows: {
          orderBy: {
            createdAt: 'asc',
          },
        },
        generatedPhotos: {
          orderBy: {
            createdAt: 'asc',
          },
          include: {
            refinements: true,
          },
        },
      },
    })

    const response = NextResponse.json({
      success: true,
      requests: requests.map((req) => {
        const brandIdentity = safeJsonParse<Record<string, unknown> | null>(req.brandIdentity ?? null, null)
        const productImages = Array.isArray(brandIdentity?.productImages)
          ? (brandIdentity!.productImages as string[])
          : []
        const referenceImages = Array.isArray(brandIdentity?.referenceImages)
          ? (brandIdentity!.referenceImages as string[])
          : []
        const requestedPhotoCount =
          typeof brandIdentity?.requestedPhotoCount === 'number'
            ? (brandIdentity!.requestedPhotoCount as number)
            : req.workflows.find((w) => w.step === 'step2_ai_generation')?.requestedPhotoCount ?? null

        return {
          id: req.id,
          userId: req.userId,
          userResponses: {
            sector: req.sector,
            platform: req.platform,
            style: req.style,
            mood: req.mood,
            colors: safeJsonParse<string[]>(req.colors, []),
            additionalDetails: req.additionalDetails,
            customTags: safeJsonParse<string[]>(req.customTags ?? null, []),
            additionalNotes: req.additionalNotes,
            photoCount: requestedPhotoCount,
          },
          uploadedImageBase64: req.uploadedImageBase64,
          aspectRatio: req.aspectRatio,
          negativePrompt: req.negativePrompt,
          productImages,
          referenceImages,
          currentStep: req.currentStep,
          status: req.status,
          workflows: req.workflows,
          generatedPhotos: req.generatedPhotos.map((photo) => ({
            ...photo,
            photoId: photo.id, // PhotoID eklendi
          })),
          brandIdentity,
          createdAt: req.createdAt,
          updatedAt: req.updatedAt,
        }
      }),
    })
    return applyCorsHeaders(request, response)
  } catch (error) {
    console.error('GET Generate API error:', error)
    const response = NextResponse.json(
      {
        success: false,
        error: 'İstekler alınırken bir hata oluştu',
      },
      { status: 500 }
    )
    return applyCorsHeaders(request, response)
  }
}
