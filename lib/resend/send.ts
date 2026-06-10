import * as React from 'react'
import { resend } from './client'
import { createServiceClient } from '@/lib/supabase/service'

interface SendEmailOptions {
  to: string
  subject: string
  react: React.ReactElement
  orderId?: string
  templateId?: string
}

export async function sendEmail({
  to,
  subject,
  react,
  orderId,
  templateId,
}: SendEmailOptions): Promise<{ success: boolean; error?: string }> {
  const from = process.env.RESEND_FROM_EMAIL ?? 'orders@lavacamnl.com'

  async function attempt(): Promise<{ success: boolean; error?: string }> {
    try {
      await resend.emails.send({ from, to, subject, react })
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  }

  let result = await attempt()
  if (!result.success) {
    result = await attempt()
  }

  if (!result.success) {
    try {
      const supabase = createServiceClient()
      await supabase.from('notifications').insert({
        order_id: orderId ?? null,
        template_id: templateId ?? null,
        recipient: to,
        channel: 'email',
        status: 'failed',
        error_message: result.error ?? 'Unknown error',
      })
    } catch {
      console.error('[sendEmail] Failed to log notification failure for', templateId, result.error)
    }
  }

  return result
}
