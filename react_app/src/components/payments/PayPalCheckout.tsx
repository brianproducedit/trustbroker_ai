import React, { useState } from 'react'
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js'
import { formatCurrency } from '@/lib/utils'
import { CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react'
import { api } from '@/lib/api'

interface PayPalCheckoutProps {
  contractId: string
  contractCode: string
  milestoneId: string
  amount: number
  currency?: string
  onPaymentSuccess: (details: any) => void
  onPaymentError?: (error: any) => void
}

export const PayPalCheckout: React.FC<PayPalCheckoutProps> = ({
  contractId,
  contractCode,
  milestoneId,
  amount,
  currency = 'USD',
  onPaymentSuccess,
  onPaymentError,
}) => {
  const [paymentCompleted, setPaymentCompleted] = useState(false)
  const [capturedOrderId, setCapturedOrderId] = useState<string | null>(null)
  const [captureId, setCaptureId] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  if (paymentCompleted) {
    return (
      <div className="bg-[#0D221D] border border-emerald-800/60 rounded-xl p-5 flex flex-col gap-3 text-emerald-200">
        <div className="flex items-center gap-2 text-emerald-400">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="font-semibold text-sm">Milestone funded with PayPal</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          <strong className="text-white">{formatCurrency(amount, currency)}</strong> is funded for{' '}
          <strong className="text-white">{contractCode}</strong>. The PayPal payout is sent after verification.
        </p>
        <div className="bg-[#0B1326] p-3 rounded-lg border border-[#222A3D] font-mono text-xs flex flex-col gap-1.5 text-slate-300">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">PayPal Order ID</span>
            <span className="font-bold text-emerald-400">{capturedOrderId}</span>
          </div>
          {captureId && (
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Capture ID</span>
              <span className="font-bold text-emerald-400">{captureId}</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID as string | undefined

  return (
    <div className="bg-[#131B2E] rounded-xl border border-[#222A3D] p-5 flex flex-col gap-4 shadow-sm text-white">
      <div className="flex items-center justify-between pb-3 border-b border-[#222A3D]">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-blue-400" />
          <h3 className="text-sm font-bold text-white">Fund milestone with PayPal</h3>
        </div>
        <span className="text-xs font-mono bg-blue-950/80 text-blue-400 px-2.5 py-0.5 rounded-full border border-blue-800/60 font-semibold">
          {formatCurrency(amount, currency)}
        </span>
      </div>

      <p className="text-xs text-slate-300 leading-relaxed">
        PayPal captures this milestone only. Closing or cancelling checkout does not mark the milestone funded.
      </p>

      {errorMsg && (
        <div className="p-3 bg-blue-950/40 border border-blue-800/50 text-blue-300 text-xs rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {!clientId ? (
        <p className="text-xs text-amber-300">Set VITE_PAYPAL_CLIENT_ID to show PayPal Buttons.</p>
      ) : (
        <PayPalScriptProvider
          options={{
            clientId,
            currency: import.meta.env.VITE_PAYPAL_CURRENCY || currency,
            intent: 'capture',
          }}
        >
          <PayPalButtons
            style={{ layout: 'horizontal', color: 'gold', shape: 'rect', label: 'paypal', height: 44 }}
            disabled={isProcessing}
            createOrder={async () => {
              setErrorMsg(null)
              const res = await api.payments.createOrder({
                contract_id: contractId,
                milestone_id: milestoneId,
              })
              if (!res?.order_id) {
                throw new Error('Server did not return a PayPal order id')
              }
              return res.order_id
            }}
            onApprove={async (data) => {
              setIsProcessing(true)
              try {
                const captured = await api.payments.captureOrder({
                  contract_id: contractId,
                  milestone_id: milestoneId,
                  paypal_order_id: data.orderID,
                })
                if (String(captured?.paypal_status || captured?.status || '').toUpperCase() !== 'COMPLETED' &&
                    captured?.status !== 'staged_in_sandbox') {
                  throw new Error('PayPal capture was not completed')
                }
                setCapturedOrderId(data.orderID)
                setCaptureId(captured?.paypal_capture_id || null)
                setPaymentCompleted(true)
                onPaymentSuccess({ id: data.orderID, status: 'COMPLETED', ...captured })
              } catch (err: any) {
                const message = err?.detail || err?.message || 'Capture failed. Milestone is not funded.'
                setErrorMsg(message)
                if (onPaymentError) onPaymentError(err)
              } finally {
                setIsProcessing(false)
              }
            }}
            onCancel={() => {
              setErrorMsg('Checkout cancelled. This milestone is not funded.')
            }}
            onError={(err) => {
              setErrorMsg('PayPal checkout could not complete. The milestone is not funded.')
              if (onPaymentError) onPaymentError(err)
            }}
          />
        </PayPalScriptProvider>
      )}
    </div>
  )
}
