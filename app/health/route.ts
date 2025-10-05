import { NextRequest } from 'next/server'
import {
  GET as ApiHealthGet,
  HEAD as ApiHealthHead,
  OPTIONS as ApiHealthOptions,
} from '@/app/api/health/route'

export async function GET(request: NextRequest) {
  return ApiHealthGet(request)
}

export async function HEAD(request: NextRequest) {
  return ApiHealthHead(request)
}

export async function OPTIONS(request: NextRequest) {
  return ApiHealthOptions(request)
}
