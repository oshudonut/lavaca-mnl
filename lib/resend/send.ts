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
}: SendEmailOptions): Promise<{ success: boolean; error?: string; id?: string }> {
  const from = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'

  async function attempt(): Promise<{ success: boolean; error?: string; id?: string }> {
    try {
      // Resend reports most failures (bad key, unverified sender, invalid
      // recipient) in the returned `error`, not by throwing.
      const { data, error } = await resend.emails.send({ from, to, subject, react })
      if (error) return { success: false, error: `${error.name}: ${error.message}` }
      return { success: true, id: data?.id }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  }

  let result = await attempt()
  if (!result.success) {
    result = await attempt()
  }

  if (!result.success) {
    console.error('[sendEmail] failed', templateId, to, result.error)
  }

  // Record every send so failures are visible (Supabase → notifications).
  if (orderId) {
    try {
      const supabase = createServiceClient()
      await supabase.from('notifications').insert({
        order_id: orderId,
        template_id: templateId ?? 'UNKNOWN',
        recipient: to,
        channel: 'email',
        status: result.success ? 'sent' : 'failed',
        sent_at: result.success ? new Date().toISOString() : null,
        error_message: result.success ? null : (result.error ?? 'Unknown error'),
      })
    } catch {
      console.error('[sendEmail] Failed to log notification for', templateId)
    }
  }

  return result
}
