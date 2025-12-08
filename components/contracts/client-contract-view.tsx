'use client'

import { useEffect, useState } from 'react'
import { useContractWorkflowStore } from '@/lib/stores/contract-workflow-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Loader2, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { IDUploadClient } from './steps/step-4-id-upload-client'
import { OTPVerification } from './steps/step-5-otp-verification'
import { PaymentProof } from './steps/step-6-payment-proof'

interface ClientContractViewProps {
  initialContract: any
  userId: string
}

export function ClientContractView({ initialContract, userId }: ClientContractViewProps) {
  const {
    currentContract,
    currentStep,
    isLoading,
    error,
    setCurrentContract,
    fetchContract,
    subscribeToContract,
    unsubscribeFromContract
  } = useContractWorkflowStore()

  const [contract, setContract] = useState(initialContract)

  // Initialize store
  useEffect(() => {
    setCurrentContract(initialContract)
    subscribeToContract(initialContract.id)

    return () => {
      unsubscribeFromContract()
    }
  }, [initialContract.id])

  // Sync with store updates
  useEffect(() => {
    if (currentContract) {
      setContract(currentContract)
    }
  }, [currentContract])

  const progress = ((contract.current_step || 1) / 8) * 100

  // Step status helper
  const getStepStatus = (step: number) => {
    if (contract.current_step > step) return 'completed'
    if (contract.current_step === step) return 'current'
    return 'upcoming'
  }

  const steps = [
    { number: 1, name: 'بيانات العقد', icon: '📄' },
    { number: 2, name: 'مراجعة البيانات', icon: '👁️' },
    { number: 3, name: 'التوقيعات', icon: '✍️' },
    { number: 4, name: 'بطاقات الهوية', icon: '🪪' },
    { number: 5, name: 'التحقق OTP', icon: '🔐' },
    { number: 6, name: 'إثبات الدفع', icon: '💳' },
    { number: 7, name: 'المراجعة النهائية', icon: '✅' },
    { number: 8, name: 'إتمام العقد', icon: '🎉' }
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Contract Header */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                {contract.contract_number}
                <Badge variant={contract.status === 'active' ? 'default' : 'secondary'}>
                  {contract.status === 'active' ? 'نشط' : contract.workflow_status}
                </Badge>
              </CardTitle>
              <CardDescription className="text-lg mt-1">
                {contract.service_type}
              </CardDescription>
            </div>
            <div className="text-left">
              <p className="text-2xl font-bold text-primary">
                {Number(contract.total_amount).toLocaleString('ar-EG')} ج.م
              </p>
              <p className="text-sm text-muted-foreground">المبلغ الإجمالي</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">التقدم الكلي</span>
              <span className="font-semibold">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground">
              الخطوة {contract.current_step} من 8
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Steps Progress */}
      <Card>
        <CardHeader>
          <CardTitle>خطوات إتمام العقد</CardTitle>
          <CardDescription>تابع تقدمك في إكمال العقد</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {steps.map((step) => {
              const status = getStepStatus(step.number)
              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: step.number * 0.05 }}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${status === 'completed'
                    ? 'bg-green-50 border border-green-200'
                    : status === 'current'
                      ? 'bg-primary/10 border border-primary/30'
                      : 'bg-gray-50 border border-gray-200'
                    }`}
                >
                  <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-background dark:bg-card border">
                    {status === 'completed' ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : status === 'current' ? (
                      <Clock className="h-5 w-5 text-primary" />
                    ) : (
                      <span className="text-gray-400 text-sm">{step.number}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${status === 'current' ? 'text-primary' : ''
                      }`}>
                      {step.icon} {step.name}
                    </p>
                  </div>
                  {status === 'completed' && (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      مكتمل
                    </Badge>
                  )}
                  {status === 'current' && (
                    <Badge variant="default">
                      الخطوة الحالية
                    </Badge>
                  )}
                </motion.div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Current Step Content */}
      {contract.current_step >= 4 && contract.current_step <= 6 && (
        <div className="space-y-6">
          {contract.current_step === 4 && (
            <IDUploadClient
              contractId={contract.id}
              currentIdCard={contract.client_id_card}
            />
          )}

          {contract.current_step === 5 && (
            <OTPVerification
              contractId={contract.id}
              clientEmail={contract.client_email}
              isVerified={contract.step_5_completed}
            />
          )}

          {contract.current_step === 6 && (
            <PaymentProof
              contractId={contract.id}
              accountId={contract.account_id}
              contractNumber={contract.contract_number}
              depositAmount={Number(contract.deposit_amount)}
              paymentMethod={contract.payment_method}
              currentProof={contract.payment_proof_id ? {
                id: contract.payment_proof_id,
                proof_image_url: contract.payment_proof?.proof_image_url,
                review_status: contract.payment_proof?.review_status,
                rejection_reason: contract.payment_proof?.rejection_reason,
                amount: contract.payment_proof?.amount,
                transaction_reference: contract.payment_proof?.transaction_reference
              } : undefined}
            />
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
