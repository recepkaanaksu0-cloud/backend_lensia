'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Play, Trash2, Eye, RefreshCw } from 'lucide-react'
import Image from 'next/image'

interface Job {
  id: string
  status: string
  prompt: string
  negativePrompt?: string
  inputImageUrl: string
  outputImageUrl?: string
  paramsJson: string
  errorMessage?: string
  createdAt: string
  updatedAt: string
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function JobTable() {
  const { data: jobs, error, mutate, isLoading } = useSWR<Job[]>('/api/jobs', fetcher, {
    refreshInterval: 3000 // Her 3 saniyede bir otomatik yenile
  })
  
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [processingJobs, setProcessingJobs] = useState<Set<string>>(new Set())

  const handleProcess = async (jobId: string) => {
    try {
      setProcessingJobs(prev => new Set(prev).add(jobId))
      
      const response = await fetch(`/api/jobs/${jobId}/process`, {
        method: 'POST'
      })
      
      if (!response.ok) {
        const error = await response.json()
        alert(`Hata: ${error.error}`)
      }
      
      // Listeyi yenile
      mutate()
    } catch (error) {
      console.error('İşlem hatası:', error)
      alert('İşlem başlatılırken bir hata oluştu')
    } finally {
      setProcessingJobs(prev => {
        const next = new Set(prev)
        next.delete(jobId)
        return next
      })
    }
  }

  const handleDelete = async (jobId: string) => {
    if (!confirm('Bu işi silmek istediğinizden emin misiniz?')) {
      return
    }
    
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('Silme başarısız')
      }
      
      mutate()
    } catch (error) {
      console.error('Silme hatası:', error)
      alert('İş silinirken bir hata oluştu')
    }
  }

  const showDetails = (job: Job) => {
    setSelectedJob(job)
    setIsDetailsOpen(true)
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'secondary' | 'default' | 'destructive'; label: string; className?: string }> = {
      pending: { variant: 'secondary' as const, label: 'Beklemede' },
      processing: { variant: 'default' as const, label: 'İşleniyor' },
      completed: { variant: 'default' as const, label: 'Tamamlandı', className: 'bg-green-500' },
      error: { variant: 'destructive' as const, label: 'Hata' }
    }
    
    const config = variants[status] || variants.pending
    
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    )
  }

  if (error) {
    return (
      <div className="p-4 border border-red-300 bg-red-50 rounded-lg">
        <p className="text-red-800">İşler yüklenirken hata oluştu</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="animate-spin h-8 w-8 text-gray-400" />
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">İş Kuyruğu</h2>
          <Button onClick={() => mutate()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Yenile
          </Button>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Görüntü</TableHead>
                <TableHead className="max-w-md">Prompt</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Oluşturulma</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs && jobs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                    Henüz iş bulunmuyor
                  </TableCell>
                </TableRow>
              )}
              {jobs?.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-mono text-xs">
                    {job.id.substring(0, 8)}...
                  </TableCell>
                  <TableCell>
                    <div className="relative w-16 h-16 bg-gray-100 rounded">
                      {job.status === 'completed' && job.outputImageUrl ? (
                        <Image
                          src={job.outputImageUrl}
                          alt="Sonuç"
                          fill
                          className="object-cover rounded"
                          unoptimized
                        />
                      ) : (
                        <Image
                          src={job.inputImageUrl}
                          alt="Giriş"
                          fill
                          className="object-cover rounded opacity-50"
                          unoptimized
                        />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-md">
                    <p className="truncate text-sm">{job.prompt}</p>
                  </TableCell>
                  <TableCell>{getStatusBadge(job.status)}</TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {new Date(job.createdAt).toLocaleString('tr-TR')}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2 justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => showDetails(job)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      {job.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => handleProcess(job.id)}
                          disabled={processingJobs.has(job.id)}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          İşle
                        </Button>
                      )}
                      
                      {job.status === 'processing' && (
                        <Button size="sm" disabled>
                          <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                          İşleniyor
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(job.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Detaylar Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>İş Detayları</DialogTitle>
            <DialogDescription>
              ID: {selectedJob?.id}
            </DialogDescription>
          </DialogHeader>
          
          {selectedJob && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Durum</h3>
                {getStatusBadge(selectedJob.status)}
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Prompt</h3>
                <p className="text-sm bg-gray-50 p-3 rounded">{selectedJob.prompt}</p>
              </div>
              
              {selectedJob.negativePrompt && (
                <div>
                  <h3 className="font-semibold mb-2">Negative Prompt</h3>
                  <p className="text-sm bg-gray-50 p-3 rounded">{selectedJob.negativePrompt}</p>
                </div>
              )}
              
              <div>
                <h3 className="font-semibold mb-2">Giriş Görüntüsü</h3>
                <div className="relative w-full aspect-square bg-gray-100 rounded">
                  <Image
                    src={selectedJob.inputImageUrl}
                    alt="Giriş görüntüsü"
                    fill
                    className="object-contain rounded"
                    unoptimized
                  />
                </div>
              </div>
              
              {selectedJob.outputImageUrl && (
                <div>
                  <h3 className="font-semibold mb-2">Çıkış Görüntüsü</h3>
                  <div className="relative w-full aspect-square bg-gray-100 rounded">
                    <Image
                      src={selectedJob.outputImageUrl}
                      alt="Çıkış görüntüsü"
                      fill
                      className="object-contain rounded"
                      unoptimized
                    />
                  </div>
                </div>
              )}
              
              {selectedJob.errorMessage && (
                <div>
                  <h3 className="font-semibold mb-2 text-red-600">Hata Mesajı</h3>
                  <p className="text-sm bg-red-50 p-3 rounded text-red-800">
                    {selectedJob.errorMessage}
                  </p>
                </div>
              )}
              
              <div>
                <h3 className="font-semibold mb-2">Parametreler</h3>
                <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto">
                  {JSON.stringify(JSON.parse(selectedJob.paramsJson), null, 2)}
                </pre>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-semibold">Oluşturulma:</span>
                  <p>{new Date(selectedJob.createdAt).toLocaleString('tr-TR')}</p>
                </div>
                <div>
                  <span className="font-semibold">Güncellenme:</span>
                  <p>{new Date(selectedJob.updatedAt).toLocaleString('tr-TR')}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
