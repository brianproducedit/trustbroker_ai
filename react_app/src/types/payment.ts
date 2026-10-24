export type PaymentStatus = 
  | 'not_started'
  | 'checkout_created'
  | 'staged_in_sandbox'
  | 'release_authorized'
  | 'released'
  | 'cancelled'
  | 'refunded'

export interface PaymentTransaction {
  id: string
  contractId: string
  milestoneId?: string
  orderId?: string
  captureId?: string
  amount: number
  currency: string
  status: PaymentStatus
  clientEmail?: string
  freelancerEmail?: string
  paypalStatus?: string
  createdAt: string
  updatedAt: string
}
