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
      <div className="bg-[#0D221D] border border-emerald-800/60 rounded-xl p-5 flex flex-col gap-3 text-emerald-200">
        <div className="flex items-center gap-2 text-emerald-400">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="font-semibold text-sm">Payment Staged Successfully in Sandbox</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          The funds of <strong className="text-white">{formatCurrency(amount, currency)}</strong> are staged in PayPal Sandbox for contract <strong className="text-white">{contractCode}</strong>. Payouts will be released upon verified deliverable inspection.
        </p>
        <div className="bg-[#0B1326] p-3 rounded-lg border border-[#222A3D] font-mono text-xs flex flex-col gap-1.5 text-slate-300">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">PayPal Order ID:</span>
            <span className="font-bold text-emerald-400">{capturedOrderId}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Payment Condition:</span>
            <span className="text-blue-300">Milestone Delivery Verification</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#131B2E] rounded-xl border border-[#222A3D] p-5 flex flex-col gap-4 shadow-sm text-white">
      <div className="flex items-center justify-between pb-3 border-b border-[#222A3D]">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-blue-400" />
          <h3 className="text-sm font-bold text-white">PayPal Sandbox Checkout</h3>
        </div>
        <span className="text-xs font-mono bg-blue-950/80 text-blue-400 px-2.5 py-0.5 rounded-full border border-blue-800/60 font-semibold">
          {formatCurrency(amount, currency)}
        </span>
      </div>

      <p className="text-xs text-slate-300 leading-relaxed">
        Stage contract funds into PayPal Sandbox. Funds will be held until the freelancer submits deliverables and acceptance criteria are verified.
      </p>

      {errorMsg && (
        <div className="p-3 bg-blue-950/40 border border-blue-800/50 text-blue-300 text-xs rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Primary PayPal Sandbox Button Component */}
      <div className="flex flex-col gap-2.5 pt-1">
        <PayPalScriptProvider
          options={{
            clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID || 'test',
            currency: import.meta.env.VITE_PAYPAL_CURRENCY || currency,
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
                      description: `TrustBroker AI Payment for ${contractCode}`,
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
                setErrorMsg('Notice: Sandbox client ID is in mock sandbox mode. You can use 1-Click Sandbox Stage below.')
                if (onPaymentError) onPaymentError(err)
              }}
            />
          </div>
        </PayPalScriptProvider>

        {/* 1-Click Sandbox Test Fallback Button */}
        <div className="flex items-center gap-2 pt-2 border-t border-[#222A3D]">
          <button
            type="button"
            onClick={handleSimulatedCheckout}
            disabled={isProcessing}
            className="w-full py-2.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-600/20 cursor-pointer"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Staging Payment in Sandbox...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
                <span>1-Click Sandbox Payment Stage ({formatCurrency(amount, currency)})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

