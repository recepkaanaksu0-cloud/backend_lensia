import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Enable verbose query logging only when explicitly requested. Continuous
// `prisma:query` output in terminal is noisy during development when the
// frontend polls endpoints or repeated requests hit the API. Set
// PRISMA_LOG_QUERIES=true to turn `query` logging on.
const enableQueryLog = process.env.PRISMA_LOG_QUERIES === 'true'

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: enableQueryLog ? ['query', 'error', 'warn'] : ['error', 'warn'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
