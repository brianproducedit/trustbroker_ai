import React, { useState } from 'react'
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js'
import { formatCurrency } from '@/lib/utils'
import { CheckCircle2, ShieldCheck, AlertCircle, RefreshCw, Info } from 'lucide-react'
import { api } from '@/lib/api'

interface PayPalCheckoutProps {
  contractId: string
  contractCode: string
  milestoneId: string
  amount: number
  currency?: string
  paymentStatus?: string
  onPaymentSuccess: (details: any) => void
  onPaymentError?: (error: any) => void
}

export const PayPalCheckout: React.FC<PayPalCheckoutProps> = ({
  contractId,
  contractCode,
  milestoneId,
  amount,
  currency = 'USD',
  paymentStatus,
  onPaymentSuccess,
  onPaymentError,
}) => {
  const [paymentCompleted, setPaymentCompleted] = useState(false)
  const [capturedOrderId, setCapturedOrderId] = useState<string | null>(null)
  const [captureId, setCaptureId] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [forceNewOrder, setForceNewOrder] = useState(false)
  const [hasInitiatedCheckout, setHasInitiatedCheckout] = useState(false)

  const handleManualCapture = async () => {
    setIsVerifying(true)
    setErrorMsg(null)
    try {
      const captured = await api.payments.captureOrder({
        contract_id: contractId,
        milestone_id: milestoneId,
      })
      if (
        String(captured?.paypal_status || captured?.status || '').toUpperCase() !== 'COMPLETED' &&
        captured?.status !== 'staged_in_sandbox'
      ) {
        throw new Error('PayPal capture was not completed')
      }
      setCapturedOrderId(captured?.paypal_order_id || null)
      setCaptureId(captured?.paypal_capture_id || null)
      setPaymentCompleted(true)
      onPaymentSuccess(captured)
    } catch (err: any) {
      const message =
        err?.detail ||
        err?.message ||
        'PayPal has not confirmed buyer approval yet. If you completed approval in PayPal, please try again in a moment.'
      setErrorMsg(message)
    } finally {
      setIsVerifying(false)
    }
  }

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

  const rawClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID as string | undefined
  const clientId = rawClientId?.trim()

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

      {/* Pending Approval Recovery Banner */}
      {(paymentStatus === 'checkout_created' || hasInitiatedCheckout) && (
        <div className="p-3.5 bg-blue-950/50 border border-blue-700/60 text-blue-200 text-xs rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold text-white">Checkout initiated in PayPal</p>
              <p className="text-[11px] text-slate-300">
                If you approved the payment in the PayPal popup and your browser did not refresh automatically, click verify.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleManualCapture}
            disabled={isVerifying || isProcessing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium text-xs transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
            <span>{isVerifying ? 'Verifying...' : 'Verify & Capture'}</span>
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-amber-950/40 border border-amber-800/50 text-amber-200 text-xs rounded-lg flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-400" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={handleManualCapture}
            disabled={isVerifying}
            className="text-xs text-blue-400 underline hover:text-blue-300 whitespace-nowrap ml-2"
          >
            Check again
          </button>
        </div>
      )}

      {!clientId ? (
        <p className="text-xs text-amber-300">Set VITE_PAYPAL_CLIENT_ID to show PayPal Buttons.</p>
      ) : (
        <PayPalScriptProvider
          options={{
            clientId,
            currency: (import.meta.env.VITE_PAYPAL_CURRENCY || currency).trim(),
            intent: 'capture',
            environment: ((import.meta.env.VITE_PAYPAL_MODE || 'sandbox') as string).trim() as 'sandbox' | 'production',
          }}
        >
          <PayPalButtons
            style={{ layout: 'horizontal', color: 'gold', shape: 'rect', label: 'paypal', tagline: false, height: 44 }}
            disabled={isProcessing || isVerifying}
            createOrder={async () => {
              setErrorMsg(null)
              setHasInitiatedCheckout(true)
              try {
                const res = await api.payments.createOrder({
                  contract_id: contractId,
                  milestone_id: milestoneId,
                  force_new: forceNewOrder,
                })
                setForceNewOrder(false)
                if (!res?.order_id) {
                  throw new Error(res?.detail || 'Server did not return a PayPal order id')
                }
                return res.order_id
              } catch (err: any) {
                const msg = err?.detail || err?.message || 'Could not initiate PayPal checkout order'
                setErrorMsg(msg)
                setForceNewOrder(true)
                throw err
              }
            }}
            onApprove={async (data) => {
              setIsProcessing(true)
              try {
                const captured = await api.payments.captureOrder({
                  contract_id: contractId,
                  milestone_id: milestoneId,
                  paypal_order_id: data.orderID,
                })
                if (
                  String(captured?.paypal_status || captured?.status || '').toUpperCase() !== 'COMPLETED' &&
                  captured?.status !== 'staged_in_sandbox'
                ) {
                  throw new Error('PayPal capture was not completed')
                }
                setCapturedOrderId(data.orderID)
                setCaptureId(captured?.paypal_capture_id || null)
                setPaymentCompleted(true)
                onPaymentSuccess({ id: data.orderID, status: 'COMPLETED', ...captured })
              } catch (err: any) {
                const message = err?.detail || err?.message || 'Capture failed. Milestone is not funded.'
                setErrorMsg(message)
                setForceNewOrder(true)
                if (onPaymentError) onPaymentError(err)
              } finally {
                setIsProcessing(false)
              }
            }}
            onCancel={() => {
              setForceNewOrder(true)
              setErrorMsg('Checkout was closed or cancelled. Click the PayPal button to try again.')
            }}
            onError={(err) => {
              setForceNewOrder(true)
              setErrorMsg('PayPal checkout could not complete. If you already completed approval in PayPal, click "Check again" above.')
              if (onPaymentError) onPaymentError(err)
            }}
          />
          <p className="text-center text-xs text-slate-400">
            Strict browser tracking or guest mode? If popup closes after approval, use &ldquo;Verify &amp; Capture&rdquo;.
          </p>
        </PayPalScriptProvider>
      )}
    </div>
  )
}
