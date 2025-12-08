"use client"

/**
 * Enhanced Contract Flow Wizard - Premium Edition
 * World-class UI/UX with smooth animations and professional design
 */

import { useEffect, useState } from "react"
import { useContractFlowStore } from "@/lib/stores/contract-flow-store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  CheckCircle2,
  Circle,
  Clock,
  Loader2,
  Users,
  Activity,
  Zap,
  Eye,
  EyeOff,
  AlertCircle,
  Lock,
  Sparkles,
  ChevronRight,
  PartyPopper,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import type { ContractFlowStep, ParticipantRole } from "@/lib/contract-flow/flow-state-machine"
import { CircularProgress, StepContentSkeleton } from "@/components/ui/loading-states"
import { CelebrationConfetti, FadeInUp, ScaleIn, PageTransition } from "@/components/ui/animations"
import { ContractPreview } from "./creation/contract-preview"

// Import step components
import { ReviewStep } from "./flow-steps/review-step"
import { SignaturesStep } from "./flow-steps/signatures-step"
import { OTPVerificationStep } from "./flow-steps/otp-verification-step"
import { IDCardsStep } from "./flow-steps/id-cards-step"
import { PaymentProofStep } from "./flow-steps/payment-proof-step"
import { PaymentApprovalStep } from "./flow-steps/payment-approval-step"
import { EncryptionExplanationStep } from "./flow-steps/encryption-explanation-step"
import { FinalizationStep } from "./flow-steps/finalization-step"

interface ContractFlowWizardProps {
  contractId: string
  participant: ParticipantRole
  participantName: string
  contractData: any
}

export function ContractFlowWizard({
  contractId,
  participant,
  participantName,
  contractData,
}: ContractFlowWizardProps) {
  const [showActivityStream, setShowActivityStream] = useState(false)
  const [showPreview, setShowPreview] = useState(true)
  const [zoomLevel, setZoomLevel] = useState(0.55) // Default zoom level
  const [showCelebration, setShowCelebration] = useState(false)
  const [lastProgress, setLastProgress] = useState(0)

  const {
    flowState,
    activities,
    isConnected,
    isSyncing,
    otherParticipantsOnline,
    isLoading,
    error,
    initializeFlow,
    unsubscribeFromFlow,
    getProgress,

    getCurrentStepName,
    contractData: liveContractData, // Get live data
  } = useContractFlowStore()

  // Merge initial props with live data
  // CRITICAL: We only want to update signatures and status from live data.
  // We MUST NOT overwrite decrypted text fields (like client_name) with encrypted data from liveContractData.
  const effectiveContractData = {
    ...contractData,
    // Only override specific fields that change during the flow and are safe (not encrypted text)
    admin_signature: liveContractData?.admin_signature || contractData.admin_signature,
    client_signature: liveContractData?.client_signature || contractData.client_signature,
    admin_id_card: liveContractData?.admin_id_card || contractData.admin_id_card,
    client_id_card: liveContractData?.client_id_card || contractData.client_id_card,
    payment_proof: liveContractData?.payment_proof || contractData.payment_proof,
    status: liveContractData?.status || contractData.status,
    // Add other dynamic non-encrypted fields if needed
  }

  // State for signed URLs
  const [signedUrls, setSignedUrls] = useState<{
    admin_signature: string | null
    client_signature: string | null
    admin_id_card: string | null
    client_id_card: string | null
    payment_proof_url: string | null
  }>({
    admin_signature: null,
    client_signature: null,
    admin_id_card: null,
    client_id_card: null,
    payment_proof_url: null
  })

  // Generate signed URLs for images
  useEffect(() => {
    const generateSignedUrls = async () => {
      const supabase = createClient()

      const getSignedUrl = async (publicUrl: string | null | undefined, bucket: string) => {
        if (!publicUrl) return null
        try {
          const pathParts = publicUrl.split(`/storage/v1/object/public/${bucket}/`)
          if (pathParts.length !== 2) return publicUrl

          const path = pathParts[1]
          const { data, error } = await supabase.storage
            .from(bucket)
            .createSignedUrl(path, 3600)

          if (error) {
            console.error(`Failed to create signed URL for ${bucket}/${path}:`, error)
            return publicUrl
          }

          return data.signedUrl
        } catch (error) {
          console.error('Error generating signed URL:', error)
          return publicUrl
        }
      }

      const [admin_sig, client_sig, admin_id, client_id, payment] = await Promise.all([
        getSignedUrl(effectiveContractData.admin_signature, 'signatures'),
        getSignedUrl(effectiveContractData.client_signature, 'signatures'),
        getSignedUrl(effectiveContractData.admin_id_card, 'id-cards'),
        getSignedUrl(effectiveContractData.client_id_card, 'id-cards'),
        getSignedUrl(effectiveContractData.payment_proof?.proof_image_url, 'payment-proofs')
      ])

      setSignedUrls({
        admin_signature: admin_sig,
        client_signature: client_sig,
        admin_id_card: admin_id,
        client_id_card: client_id,
        payment_proof_url: payment
      })
    }

    generateSignedUrls()
  }, [
    effectiveContractData.admin_signature,
    effectiveContractData.client_signature,
    effectiveContractData.admin_id_card,
    effectiveContractData.client_id_card,
    effectiveContractData.payment_proof?.proof_image_url
  ])

  // Initialize flow on mount
  useEffect(() => {
    initializeFlow(contractId, participant, participantName)

    return () => {
      unsubscribeFromFlow()
    }
  }, [contractId, participant, participantName])

  // Celebration trigger on milestones
  const progress = getProgress()
  useEffect(() => {
    if (progress.progressPercentage > lastProgress) {
      // Trigger celebration at 25%, 50%, 75%, 100%
      const milestones = [25, 50, 75, 100]
      const crossedMilestone = milestones.find(
        (m) => lastProgress < m && progress.progressPercentage >= m
      )

      if (crossedMilestone) {
        setShowCelebration(true)
        setTimeout(() => setShowCelebration(false), 3000)
      }

      setLastProgress(progress.progressPercentage)
    }
  }, [progress.progressPercentage, lastProgress])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 className="h-8 w-8 text-primary mx-auto" />
          </motion.div>
          <p className="text-muted-foreground">جاري تحميل العقد...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const currentStepName = getCurrentStepName()

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {showCelebration && <CelebrationConfetti />}

        {/* Hero Progress Section */}
        <FadeInUp>
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background relative overflow-hidden">
            {/* Animated background gradient */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.1),rgba(255,255,255,0))] dark:bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.2),rgba(0,0,0,0))]" />

            <CardHeader className="relative">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <CardTitle className="text-2xl">
                      {participant === "admin" ? "📋 إدارة العقد" : "📝 متابعة العقد"}
                    </CardTitle>

                    {/* Connection Status */}
                    <Badge variant={isConnected ? "default" : "secondary"} className="gap-1">
                      <motion.div
                        className={cn(
                          "w-2 h-2 rounded-full",
                          isConnected ? "bg-green-500" : "bg-gray-400"
                        )}
                        animate={isConnected ? { scale: [1, 1.2, 1] } : {}}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      {isConnected ? "متصل" : "غير متصل"}
                    </Badge>

                    {/* Syncing Indicator */}
                    <AnimatePresence>
                      {isSyncing && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                        >
                          <Badge variant="outline" className="gap-1">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            جاري المزامنة...
                          </Badge>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Other Participants Online */}
                    {Object.entries(otherParticipantsOnline).map(([role, isOnline]) => {
                      if (!isOnline || role === participant) return null

                      const roleNames: Record<string, string> = {
                        admin: "المدير",
                        client: "العميل",
                        affiliate: "الشريك",
                      }

                      return (
                        <motion.div
                          key={role}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                        >
                          <Badge
                            variant="outline"
                            className="gap-1 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                          >
                            <Users className="h-3 w-3 text-green-600 dark:text-green-400" />
                            <span className="text-green-700 dark:text-green-300">
                              {roleNames[role]} متصل
                            </span>
                          </Badge>
                        </motion.div>
                      )
                    })}
                  </div>

                  <CardDescription className="text-base">
                    {contractData.contract_number} - {contractData.service_type}
                  </CardDescription>
                </div>

                {/* Preview Toggle */}
                <Button
                  variant={showPreview ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => {
                    setShowPreview(!showPreview)
                    if (!showPreview) setShowActivityStream(false)
                  }}
                  className="gap-2"
                >
                  {showPreview ? (
                    <>
                      <EyeOff className="h-4 w-4" />
                      إخفاء العقد
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4" />
                      معاينة العقد
                    </>
                  )}
                </Button>

                {/* Activity Stream Toggle */}
                <Button
                  variant={showActivityStream ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => {
                    setShowActivityStream(!showActivityStream)
                    if (!showActivityStream) setShowPreview(false)
                  }}
                  className="gap-2"
                >
                  {showActivityStream ? (
                    <>
                      <Activity className="h-4 w-4" />
                      إخفاء النشاطات
                    </>
                  ) : (
                    <>
                      <Activity className="h-4 w-4" />
                      عرض النشاطات
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>

            <CardContent className="relative">
              {/* Circular Progress Indicator */}
              <div className="flex items-center justify-center gap-8 mb-6">
                <ScaleIn>
                  <CircularProgress
                    progress={progress.progressPercentage}
                    size={140}
                    strokeWidth={10}
                  />
                </ScaleIn>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-yellow-500" />
                    <p className="text-lg font-semibold">{currentStepName}</p>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>
                      الخطوة {progress.currentStepIndex + 1} من {progress.totalSteps}
                    </p>
                    <p className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      {progress.completedSteps} خطوات مكتملة
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </FadeInUp>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Flow Steps - Main Column */}
          <div
            className={cn("space-y-6", (showActivityStream || showPreview) ? "lg:col-span-7" : "lg:col-span-12")}
          >
            {/* Enhanced Steps Navigator */}
            <EnhancedStepsNavigator
              flowState={flowState}
              currentStep={flowState.currentStep}
            />

            {/* Current Step Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={flowState.currentStep}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <PageTransition direction="right">
                  <StepContent
                    step={flowState.currentStep}
                    contractId={contractId}
                    participant={participant}
                    contractData={contractData}
                    flowState={flowState}
                  />
                </PageTransition>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Enhanced Activity Stream / Preview - Sidebar */}
          <AnimatePresence>
            {(showActivityStream || showPreview) && (
              <motion.div
                className="lg:col-span-5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                {showPreview && (
                  <div className="sticky top-6 h-[800px] overflow-hidden rounded-xl border shadow-xl bg-gray-50/50 flex flex-col items-center">
                    <div className="absolute top-2 right-2 z-20">
                      <Badge variant="outline" className="bg-background/80 backdrop-blur">
                        معاينة حية
                      </Badge>
                    </div>
                    {/* Centered Scaled Container */}
                    <div className="w-full h-full overflow-y-auto custom-scrollbar flex flex-col items-center p-4 bg-gray-100/50">
                      <div className="transform scale-[0.55] origin-top transition-transform duration-300">
                        <ContractPreview
                          values={effectiveContractData}
                          signatures={{
                            admin: signedUrls.admin_signature,
                            client: signedUrls.client_signature
                          }}
                          idCards={{
                            admin: signedUrls.admin_id_card,
                            client: signedUrls.client_id_card
                          }}
                          otpVerified={!!flowState.steps.otp_verification?.clientCompleted}
                          paymentProofUrl={signedUrls.payment_proof_url}
                        />
                      </div>
                      {/* Spacer to simulate the height lost by scaling */}
                      <div className="h-[400px]" />
                    </div>
                  </div>
                )}

                {showActivityStream && (
                  <EnhancedActivityStream
                    activities={activities}
                    currentParticipant={participant}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </TooltipProvider>
  )
}

/**
 * Enhanced Steps Navigator with Timeline Design
 */
interface EnhancedStepsNavigatorProps {
  flowState: any
  currentStep: ContractFlowStep
}

function EnhancedStepsNavigator({ flowState, currentStep }: EnhancedStepsNavigatorProps) {
  const steps: Array<{
    key: ContractFlowStep
    label: string
    icon: string
    description: string
  }> = [
      { key: "review", label: "المراجعة والموافقة", icon: "📋", description: "مراجعة تفاصيل العقد والموافقة عليها" },
      { key: "signatures", label: "التوقيعات", icon: "✍️", description: "توقيع العقد إلكترونياً" },
      { key: "otp_verification", label: "التحقق OTP", icon: "🔐", description: "التحقق من الهوية برمز OTP" },
      { key: "id_cards", label: "بطاقات الهوية", icon: "🪪", description: "رفع صور بطاقات الهوية" },
      { key: "payment_proof", label: "إثبات الدفع", icon: "💳", description: "رفع إثبات الدفع" },
      { key: "payment_approval", label: "الموافقة على الدفع", icon: "✅", description: "مراجعة والموافقة على الدفع" },
      { key: "encryption_explanation", label: "شرح التشفير", icon: "🔒", description: "فهم آلية حماية البيانات" },
      { key: "finalization", label: "الإتمام", icon: "🎉", description: "إتمام العقد وتحميل النسخة النهائية" },
    ]

  return (
    <Card className="backdrop-blur-sm bg-background/95 border-2 border-primary/10">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          مسار إتمام العقد
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {steps.map((step, index) => {
            const stepState = flowState.steps[step.key]
            const isComplete = !!stepState.completedAt
            const isCurrent = currentStep === step.key
            const isBlocked = stepState.isBlocked

            return (
              <Tooltip key={step.key}>
                <TooltipTrigger asChild>
                  <motion.div
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-xl transition-all cursor-pointer relative overflow-hidden group",
                      isCurrent && "bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-2 border-primary/30",
                      isComplete && !isCurrent && "bg-gradient-to-r from-green-50 to-transparent dark:from-green-900/10 border border-green-200 dark:border-green-800",
                      isBlocked && !isCurrent && "opacity-50",
                      !isCurrent && !isComplete && !isBlocked && "hover:bg-accent/50"
                    )}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    {/* Background shine effect */}
                    {isCurrent && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent"
                        animate={{
                          x: ["-100%", "100%"],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      />
                    )}

                    {/* Step Icon */}
                    <div
                      className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-lg relative z-10 transition-all",
                        isComplete && "bg-green-600 shadow-lg shadow-green-600/30",
                        isCurrent && "bg-primary shadow-lg shadow-primary/30 ring-4 ring-primary/20",
                        !isComplete && !isCurrent && "bg-muted"
                      )}
                    >
                      {isComplete ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 200 }}
                        >
                          <CheckCircle2 className="h-6 w-6 text-white" />
                        </motion.div>
                      ) : isCurrent ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        >
                          <Clock className="h-6 w-6 text-white" />
                        </motion.div>
                      ) : isBlocked ? (
                        <Lock className="h-6 w-6 text-muted-foreground" />
                      ) : (
                        <Circle className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>

                    {/* Step Info */}
                    <div className="flex-1 min-w-0 relative z-10">
                      <div
                        className={cn(
                          "font-semibold text-sm flex items-center gap-2",
                          isCurrent && "text-primary"
                        )}
                      >
                        {step.icon} {step.label}
                        {isCurrent && (
                          <motion.div
                            animate={{ x: [0, 5, 0] }}
                            transition={{ duration: 1, repeat: Infinity }}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </motion.div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <ParticipantStatus
                          adminCompleted={stepState.adminCompleted}
                          clientCompleted={stepState.clientCompleted}
                          affiliateCompleted={stepState.affiliateCompleted}
                          requiresAffiliate={stepState.requiresAffiliate}
                          isBlocked={isBlocked}
                        />
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="relative z-10">
                      {isComplete && (
                        <Badge className="bg-green-600">مكتمل ✓</Badge>
                      )}
                      {isCurrent && !isComplete && (
                        <Badge className="bg-primary animate-pulse">جاري التنفيذ</Badge>
                      )}
                    </div>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  <p className="font-semibold mb-1">{step.label}</p>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                  {stepState.blockReason && isBlocked && (
                    <p className="text-sm text-orange-600 mt-2">⚠️ {stepState.blockReason}</p>
                  )}
                </TooltipContent>
              </Tooltip>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Participant Status Indicator
 */
function ParticipantStatus({
  adminCompleted,
  clientCompleted,
  affiliateCompleted,
  requiresAffiliate,
  isBlocked,
}: {
  adminCompleted: boolean
  clientCompleted: boolean
  affiliateCompleted: boolean
  requiresAffiliate?: boolean
  isBlocked: boolean
}) {
  if (isBlocked) {
    return <span className="text-xs text-muted-foreground">🔒 محظور</span>
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      <motion.div
        className="flex items-center gap-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {adminCompleted ? (
          <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-500" />
        ) : (
          <Circle className="h-3 w-3 text-gray-300 dark:text-gray-600" />
        )}
        <span className={adminCompleted ? "text-green-700 dark:text-green-400" : "text-muted-foreground"}>
          المدير
        </span>
      </motion.div>
      <motion.div
        className="flex items-center gap-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        {clientCompleted ? (
          <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-500" />
        ) : (
          <Circle className="h-3 w-3 text-gray-300 dark:text-gray-600" />
        )}
        <span className={clientCompleted ? "text-green-700 dark:text-green-400" : "text-muted-foreground"}>
          العميل
        </span>
      </motion.div>
      {requiresAffiliate && (
        <motion.div
          className="flex items-center gap-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {affiliateCompleted ? (
            <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-500" />
          ) : (
            <Circle className="h-3 w-3 text-gray-300 dark:text-gray-600" />
          )}
          <span className={affiliateCompleted ? "text-green-700 dark:text-green-400" : "text-muted-foreground"}>
            الشريك
          </span>
        </motion.div>
      )}
    </div>
  )
}

/**
 * Step Content Router
 */
function StepContent({
  step,
  contractId,
  participant,
  contractData,
  flowState,
}: {
  step: ContractFlowStep
  contractId: string
  participant: ParticipantRole
  contractData: any
  flowState: any
}) {
  const stepProps = {
    contractId,
    participant,
    contractData,
    stepState: flowState.steps[step],
  }

  switch (step) {
    case "review":
      return <ReviewStep {...stepProps} />
    case "signatures":
      return <SignaturesStep {...stepProps} />
    case "otp_verification":
      return <OTPVerificationStep {...stepProps} />
    case "id_cards":
      return <IDCardsStep {...stepProps} />
    case "payment_proof":
      return <PaymentProofStep {...stepProps} />
    case "payment_approval":
      return <PaymentApprovalStep {...stepProps} />
    case "encryption_explanation":
      return (
        <EncryptionExplanationStep
          contractId={contractId}
          participant={participant}
          onContinue={async () => {
            const { performAction, currentParticipant } = useContractFlowStore.getState()
            // Allow admin to perform this action on behalf of client (for testing/demos)
            const metadata = currentParticipant === "admin" ? { onBehalfOf: "client" } : {}

            await performAction("ENCRYPTION_UNDERSTOOD", {
              understoodAt: new Date().toISOString(),
              ...metadata,
            })
          }}
        />
      )
    case "finalization":
      return <FinalizationStep {...stepProps} />
    default:
      return null
  }
}

/**
 * Enhanced Activity Stream Component
 */
function EnhancedActivityStream({
  activities,
  currentParticipant,
}: {
  activities: any[]
  currentParticipant: ParticipantRole
}) {
  const [showScrollTop, setShowScrollTop] = useState(false)

  return (
    <Card className="sticky top-6 backdrop-blur-sm bg-background/95">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          النشاطات الأخيرة
          {activities.length > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {activities.length}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>تحديثات فورية لجميع الإجراءات</CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className="max-h-[600px] overflow-y-auto px-1 space-y-3"
          onScroll={(e) => {
            const target = e.target as HTMLDivElement
            setShowScrollTop(target.scrollTop > 100)
          }}
        >
          <AnimatePresence mode="popLayout">
            {activities.slice(0, 20).map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
                layout
                className={cn(
                  "p-3 rounded-lg border relative overflow-hidden",
                  activity.participant === currentParticipant
                    ? "bg-gradient-to-r from-primary/10 to-transparent border-primary/20"
                    : "bg-gradient-to-r from-muted/50 to-transparent border-muted"
                )}
              >
                <div className="flex items-start gap-2">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold",
                      activity.participant === "admin"
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                        : activity.participant === "client"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                          : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                    )}
                  >
                    {activity.participantName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{activity.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(activity.timestamp).toLocaleString("ar-EG", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {activities.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">لا توجد نشاطات بعد</p>
            </div>
          )}

          {/* Scroll to top button */}
          <AnimatePresence>
            {showScrollTop && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="sticky bottom-2 flex justify-center"
              >
                <Button
                  size="sm"
                  variant="secondary"
                  className="shadow-lg"
                  onClick={() => {
                    const container = document.querySelector(".overflow-y-auto")
                    container?.scrollTo({ top: 0, behavior: "smooth" })
                  }}
                >
                  ↑ العودة للأعلى
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  )
}
