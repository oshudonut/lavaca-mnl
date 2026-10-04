import { createServiceClient } from '@/lib/supabase/service'

export type PaymentSettings = {
  gcashNumber: string
  gcashAccountName: string
  gcashQrUrl: string | null
  bpiAccount: string
  bpiName: string
  bdoAccount: string
  bdoName: string
}

const EMPTY: PaymentSettings = {
  gcashNumber: '',
  gcashAccountName: '',
  gcashQrUrl: null,
  bpiAccount: '',
  bpiName: '',
  bdoAccount: '',
  bdoName: '',
}

export async function getPaymentSettings(): Promise<PaymentSettings> {
  const supabase = createServiceClient()

  const { data } = await supabase
    .from('payment_settings')
    .select('gcash_number, gcash_account_name, gcash_qr_url, bpi_account, bpi_name, bdo_account, bdo_name')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!data) return EMPTY

  return {
    gcashNumber: data.gcash_number ?? '',
    gcashAccountName: data.gcash_account_name ?? '',
    gcashQrUrl: data.gcash_qr_url ?? null,
    bpiAccount: data.bpi_account ?? '',
    bpiName: data.bpi_name ?? '',
    bdoAccount: data.bdo_account ?? '',
    bdoName: data.bdo_name ?? '',
  }
}
