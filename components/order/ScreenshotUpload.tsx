'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

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
  const [hovered, setHovered] = useState(false)

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
    <form onSubmit={handleSubmit}>
      <div
        onClick={() => inputRef.current?.click()}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          border: hovered ? '1.5px dashed #A16207' : '1.5px dashed #D6D3D1',
          background: '#FAFAF9',
          padding: '40px 24px',
          cursor: 'pointer',
          transition: 'border-color 0.2s',
        }}
      >
        {file ? (
          <>
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 13,
                fontWeight: 700,
                color: '#1C1917',
                margin: 0,
              }}
            >
              {file.name}
            </p>
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 11,
                color: '#8C7B6B',
                margin: 0,
              }}
            >
              {(file.size / 1024).toFixed(0)} KB · Tap to change
            </p>
          </>
        ) : (
          <>
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 13,
                color: '#8C7B6B',
                margin: 0,
              }}
            >
              Click to select your screenshot
            </p>
            <p
              style={{
                fontFamily: "'Jost', sans-serif",
                fontSize: 9,
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
                color: '#A8A29E',
                margin: 0,
              }}
            >
              JPEG · PNG · PDF · MAX 5 MB
            </p>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,application/pdf"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        aria-label="Payment screenshot"
      />
      {fileError && (
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 11,
            color: '#DC2626',
            marginTop: 8,
            marginBottom: 0,
          }}
        >
          {fileError}
        </p>
      )}

      {uploadError && (
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 12,
            color: '#DC2626',
            textAlign: 'center',
            marginTop: 12,
            marginBottom: 0,
          }}
        >
          {uploadError}
        </p>
      )}

      <button
        type="submit"
        disabled={isUploading || !file}
        style={{
          width: '100%',
          fontFamily: "'Inter', sans-serif",
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          background: isUploading || !file ? '#D6D3D1' : '#A16207',
          color: isUploading || !file ? '#8C7B6B' : '#FFFFFF',
          border: 'none',
          padding: '18px 0',
          cursor: isUploading || !file ? 'not-allowed' : 'pointer',
          transition: 'background 0.2s',
          marginTop: 16,
        }}
      >
        {isUploading ? 'Uploading…' : 'Submit Payment Screenshot'}
      </button>
    </form>
  )
}
