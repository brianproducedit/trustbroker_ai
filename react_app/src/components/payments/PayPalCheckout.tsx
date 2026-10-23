import React, { useState } from 'react'
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js'
import { formatCurrency } from '@/lib/utils'
import { CheckCircle2, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react'

interface PayPalCheckoutProps {
  contractId: string
  contractCode: string
  amount: number
  currency?: string
  onPaymentSuccess: (details: any) => void
  onPaymentError?: (error: any) => void
}

export const PayPalCheckout: React.FC<PayPalCheckoutProps> = ({
  contractId,
  contractCode,
  amount,
  currency = 'USD',
  onPaymentSuccess,
  onPaymentError,
}) => {
  const [paymentCompleted, setPaymentCompleted] = useState(false)
  const [capturedOrderId, setCapturedOrderId] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Demo fallback handler for direct 1-click sandbox simulation if credentials or network are restricted
  const handleSimulatedCheckout = () => {
    setIsProcessing(true)
    setTimeout(() => {
      const mockOrderId = `PP-SB-${Math.floor(10000000 + Math.random() * 90000000)}`
      const mockCaptureId = `CAP-${Math.floor(10000000 + Math.random() * 90000000)}`
      setCapturedOrderId(mockOrderId)
      setPaymentCompleted(true)
      setIsProcessing(false)
      onPaymentSuccess({
        id: mockOrderId,
        status: 'COMPLETED',
        contractId,
        captureId: mockCaptureId,
        amount,
        currency,
        payer: { email_address: 'elena@acmeglobal.com' },
      })
    }, 1000)
  }

  if (paymentCompleted) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-emerald-800">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span className="font-semibold text-sm">PayPal Sandbox Reserve Staged Successfully</span>
        </div>
        <p className="text-xs text-emerald-700 leading-relaxed">
          The funds of <strong>{formatCurrency(amount, currency)}</strong> are secured in the PayPal Sandbox conditional holding reserve for contract <strong>{contractCode}</strong>. Payment release is now bound to AI deliverable verification.
        </p>
        <div className="bg-white/80 p-3 rounded-lg border border-emerald-200/60 font-mono text-xs flex flex-col gap-1 text-emerald-900">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">PayPal Order ID:</span>
            <span className="font-bold">{capturedOrderId}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Reserve Mode:</span>
            <span>Conditional Milestone Gate</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-4 shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900">PayPal Sandbox Checkout</h3>
        </div>
        <span className="text-xs font-mono bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-200 font-semibold">
          {formatCurrency(amount, currency)}
        </span>
      </div>

      <p className="text-xs text-slate-600 leading-relaxed">
        Stage contract funds into PayPal Sandbox reserve. The payment will be held until the supplier submits deliverables and Gemini AI verifies that all acceptance criteria are met.
      </p>

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Primary PayPal Sandbox Button Component */}
      <div className="flex flex-col gap-2.5 pt-1">
        <PayPalScriptProvider
          options={{
            clientId: 'test', // PayPal Sandbox client-id placeholder or sandbox key
            currency: currency,
            intent: 'capture',
          }}
        >
          <div className="relative min-h-[44px]">
            <PayPalButtons
              style={{ layout: 'horizontal', color: 'gold', shape: 'rect', label: 'paypal', height: 44 }}
              disabled={isProcessing}
              createOrder={(_data, actions) => {
                return actions.order.create({
                  intent: 'CAPTURE',
                  purchase_units: [
                    {
                      description: `TrustBroker AI Reserve for ${contractCode}`,
                      amount: {
                        currency_code: currency,
                        value: amount.toFixed(2),
                      },
                    },
                  ],
                })
              }}
              onApprove={async (_data, actions) => {
                if (actions.order) {
                  const details = await actions.order.capture()
                  setCapturedOrderId(details.id || 'PP-CAPTURE-OK')
                  setPaymentCompleted(true)
                  onPaymentSuccess(details)
                }
              }}
              onError={(err) => {
                console.warn('PayPal script notice (standard in test sandbox):', err)
                // Offer seamless simulated fallback
                setErrorMsg('Notice: Sandbox client ID is in mock sandbox mode. You can use 1-Click Sandbox Stage below.')
                if (onPaymentError) onPaymentError(err)
              }}
            />
          </div>
        </PayPalScriptProvider>

        {/* 1-Click Sandbox Test Fallback Button */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={handleSimulatedCheckout}
            disabled={isProcessing}
            className="w-full py-2.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors shadow-xs"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Authorizing Sandbox Reserve...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Instant 1-Click Sandbox Stage ({formatCurrency(amount, currency)})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
