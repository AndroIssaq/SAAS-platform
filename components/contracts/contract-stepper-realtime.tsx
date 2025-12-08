"use client"

import { useEffect } from "react"
import { useContractFlowStore } from "@/lib/stores/contract-flow-store"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Circle, Clock, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ContractFlowStep, ParticipantRole } from "@/lib/contract-flow/flow-state-machine"

interface ContractStepperRealtimeProps {
  contractId: string
  participant: ParticipantRole
  participantName: string
}

const STEPS: { key: ContractFlowStep; label: string; icon: string }[] = [
  { key: 'review', label: 'المراجعة والموافقة', icon: '📋' },
  { key: 'signatures', label: 'التوقيعات', icon: '✍️' },
  { key: 'otp_verification', label: 'التحقق OTP', icon: '🔐' },
  { key: 'id_cards', label: 'بطاقات الهوية', icon: '🪪' },
  { key: 'payment_proof', label: 'إثبات الدفع', icon: '💳' },
  { key: 'payment_approval', label: 'الموافقة على الدفع', icon: '✅' },
  { key: 'finalization', label: 'الإتمام', icon: '🎉' },
]

export function ContractStepperRealtime({
  contractId,
  participant,
  participantName,
}: ContractStepperRealtimeProps) {
  const { flowState, initializeFlow, isConnected } = useContractFlowStore()

  useEffect(() => {
    initializeFlow(contractId, participant, participantName)
  }, [contractId, participant, participantName])

  const currentStepIndex = STEPS.findIndex(s => s.key === flowState.currentStep)

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">مراحل العقد</h3>
          <Badge variant={isConnected ? "default" : "secondary"} className="gap-1">
            <div className={cn(
              "w-2 h-2 rounded-full",
              isConnected ? "bg-green-500 animate-pulse" : "bg-gray-400"
            )} />
            {isConnected ? "متصل" : "غير متصل"}
          </Badge>
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {STEPS.map((step, index) => {
            const stepState = flowState.steps[step.key]
            const isCurrent = flowState.currentStep === step.key
            const isComplete = !!stepState.completedAt
            const isPast = index < currentStepIndex
            const isBlocked = stepState.isBlocked

            return (
              <div
                key={step.key}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border-2 transition-all",
                  isCurrent && "border-primary bg-primary/5",
                  isComplete && "border-green-200 bg-green-50/50",
                  isBlocked && !isCurrent && "opacity-50",
                  !isCurrent && !isComplete && !isBlocked && "border-gray-200"
                )}
              >
                {/* Icon */}
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-lg",
                  isComplete && "bg-green-100",
                  isCurrent && "bg-primary/10",
                  !isComplete && !isCurrent && "bg-gray-100"
                )}>
                  {isComplete ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : isCurrent ? (
                    <Clock className="h-5 w-5 text-primary" />
                  ) : isBlocked ? (
                    <AlertCircle className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-400" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{step.icon}</span>
                    <p className={cn(
                      "font-medium text-sm",
                      isCurrent && "text-primary",
                      isComplete && "text-green-700"
                    )}>
                      {step.label}
                    </p>
                  </div>
                  
                  {/* Participant Status */}
                  <div className="flex items-center gap-2 mt-1 text-xs">
                    {stepState.adminCompleted && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        المدير ✓
                      </Badge>
                    )}
                    {stepState.clientCompleted && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        العميل ✓
                      </Badge>
                    )}
                    {stepState.affiliateCompleted && (
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                        الشريك ✓
                      </Badge>
                    )}
                    {isBlocked && stepState.blockReason && (
                      <span className="text-muted-foreground">{stepState.blockReason}</span>
                    )}
                  </div>
                </div>

                {/* Status Badge */}
                {isComplete && (
                  <Badge className="bg-green-600">مكتمل</Badge>
                )}
                {isCurrent && !isComplete && (
                  <Badge variant="secondary">جاري</Badge>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}
