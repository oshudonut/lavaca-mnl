'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'application/pdf']
const MAX_SIZE_BYTES = 5 * 1024 * 1024  // 5 MB

interface Props {
  orderId: string
}

export function ScreenshotUpload({ orderId }: Props) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null)
    setUploadError(null)
    const selected = e.target.files?.[0] ?? null

    if (!selected) {
      setFile(null)
      return
    }

    if (!ACCEPTED_TYPES.includes(selected.type)) {
      setFileError('Only JPEG, PNG, or PDF files are accepted.')
      setFile(null)
      return
    }

    if (selected.size > MAX_SIZE_BYTES) {
      setFileError('File must be 5 MB or smaller.')
      setFile(null)
      return
    }

    setFile(selected)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploadError(null)

    if (!file) {
      setFileError('Please select a file.')
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('screenshot', file)

      const res = await fetch(`/api/orders/${orderId}/payment-screenshot`, {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setUploadError(data.error ?? 'Upload failed. Please try again.')
        return
      }

      router.push(`/order/confirmation?order_id=${orderId}`)
    } catch {
      setUploadError('Network error. Please check your connection and try again.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <div
          className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 px-6 py-8 cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => inputRef.current?.click()}
        >
          {file ? (
            <>
              <p className="text-sm font-medium text-foreground">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {(file.size / 1024).toFixed(0)} KB · Click to change
              </p>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">Click to select your screenshot</p>
              <p className="text-xs text-muted-foreground">JPEG, PNG, or PDF · max 5 MB</p>
            </>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,application/pdf"
          onChange={handleFileChange}
          className="sr-only"
          aria-label="Payment screenshot"
        />
        {fileError && <p className="text-xs text-destructive">{fileError}</p>}
      </div>

      {uploadError && <p className="text-sm text-destructive text-center">{uploadError}</p>}

      <Button type="submit" disabled={isUploading || !file} className="w-full">
        {isUploading ? 'Uploading…' : 'Submit Payment Screenshot'}
      </Button>
    </form>
  )
}
