import { createServiceClient } from '@/lib/supabase/service'

export type PaymentSettings = {
  gcashNumber: string
  gcashAccountName: string
  bpiAccount: string
  bpiName: string
  bdoAccount: string
  bdoName: string
}

const EMPTY: PaymentSettings = {
  gcashNumber: '',
  gcashAccountName: '',
  bpiAccount: '',
  bpiName: '',
  bdoAccount: '',
  bdoName: '',
}

export async function getPaymentSettings(): Promise<PaymentSettings> {
  const supabase = createServiceClient()

  const { data } = await supabase
    .from('payment_settings')
    .select('gcash_number, gcash_account_name, bpi_account, bpi_name, bdo_account, bdo_name')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!data) return EMPTY

  return {
    gcashNumber: data.gcash_number ?? '',
    gcashAccountName: data.gcash_account_name ?? '',
    bpiAccount: data.bpi_account ?? '',
    bpiName: data.bpi_name ?? '',
    bdoAccount: data.bdo_account ?? '',
    bdoName: data.bdo_name ?? '',
  }
}
