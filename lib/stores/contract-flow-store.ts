/**
 * Contract Flow Store - Enterprise Edition
 * Real-time synchronized state management using Zustand + Supabase
 * 
 * Features:
 * - Real-time sync across all participants
 * - Optimistic updates with rollback
 * - Activity streaming
 * - Conflict resolution
 * - Offline support (future)
 */

import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'
import {
  FlowState,
  ActionType,
  ParticipantRole,
  ContractFlowStep,
  initialFlowState,
  createInitialFlowState,
  computeNextState,
  canPerformAction,
  getStepProgress,
  getStepName,
  getActionDescription,
  getParticipantName,
} from '@/lib/contract-flow/flow-state-machine'

/**
 * Activity Log Entry
 */
export interface ActivityEntry {
  id: string
  contractId: string
  action: ActionType
  participant: ParticipantRole
  participantName: string
  timestamp: string
  description: string
  metadata?: Record<string, any>
}

/**
 * Store State Interface
 */
interface ContractFlowStore {
  // Core State
  contractId: string | null
  contractData: any | null // Holds raw contract data for real-time updates
  flowState: FlowState
  activities: ActivityEntry[]

  // Real-time State
  isConnected: boolean
  isSyncing: boolean
  lastSyncAt: string | null

  // Participant Info
  currentParticipant: ParticipantRole | null
  participantName: string | null
  otherParticipantsOnline: {
    admin: boolean
    client: boolean
    affiliate: boolean
  }

  // UI State
  isLoading: boolean
  error: string | null

  // Actions
  initializeFlow: (contractId: string, participant: ParticipantRole, participantName: string) => Promise<void>
  performAction: (action: ActionType, metadata?: Record<string, any>) => Promise<{ success: boolean; error?: string }>
  subscribeToFlow: () => void
  unsubscribeFromFlow: () => void

  // Queries
  canPerformAction: (action: ActionType, onBehalfOf?: ParticipantRole) => { allowed: boolean; reason?: string }
  getProgress: () => ReturnType<typeof getStepProgress>
  getCurrentStepName: () => string

  // Internal
  _channel: RealtimeChannel | null
  _setFlowState: (state: FlowState) => void
  _addActivity: (activity: ActivityEntry) => void
  _setError: (error: string | null) => void
  _setLoading: (loading: boolean) => void
}

/**
 * Create Store
 */
export const useContractFlowStore = create<ContractFlowStore>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // Initial State
      contractId: null,
      contractData: null,
      flowState: initialFlowState,
      activities: [],
      isConnected: false,
      isSyncing: false,
      lastSyncAt: null,
      currentParticipant: null,
      participantName: null,
      otherParticipantsOnline: {
        admin: false,
        client: false,
        affiliate: false,
      },
      isLoading: false,
      error: null,
      _channel: null,

      /**
       * Initialize Flow
       * Loads contract state and sets up real-time sync
       */
      initializeFlow: async (contractId, participant, participantName) => {
        set({ isLoading: true, error: null, contractId, currentParticipant: participant, participantName })

        try {
          const supabase = createClient()

          // Fetch current contract state
          const { data: contract, error } = await supabase
            .from('contracts')
            .select('*')
            .eq('id', contractId)
            .single()

          if (error) throw error

          // Determine if this contract should behave as 3-party (requires affiliate in step 1)
          // القاعدة: نعتبر العقد "3 أطراف" فقط عندما يكون الشريك هو من أنشأ العقد فعلاً
          let hasAffiliate = false

          if (contract.affiliate_id) {
            const { data: affiliate, error: affiliateError } = await supabase
              .from('affiliates')
              .select('user_id')
              .eq('id', contract.affiliate_id)
              .maybeSingle()

            if (!affiliateError && affiliate?.user_id && contract.created_by && affiliate.user_id === contract.created_by) {
              hasAffiliate = true
            }
          }

          // Reconstruct flow state from contract data
          const flowState = reconstructFlowState(contract, hasAffiliate)

          set({ flowState, contractData: contract, isLoading: false })

          // Fetch activities
          const { data: activities } = await supabase
            .from('contract_activities')
            .select('*')
            .eq('contract_id', contractId)
            .order('created_at', { ascending: false })
            .limit(50)

          if (activities) {
            const mappedActivities = activities.map(mapActivityFromDB)
            set({ activities: mappedActivities })
          }

          // Subscribe to real-time updates
          get().subscribeToFlow()

        } catch (error: any) {
          console.error('Failed to initialize flow:', error)
          set({ error: error.message, isLoading: false })
        }
      },

      /**
       * Perform Action
       * Executes action with optimistic update and server sync
       */
      performAction: async (action, metadata = {}) => {
        const { contractId, currentParticipant, participantName, flowState } = get()

        if (!contractId || !currentParticipant) {
          return { success: false, error: 'الجلسة غير صالحة' }
        }

        // Resolve effective participant (allow admin to act on behalf of client/affiliate)
        const onBehalfOf = (metadata as any)?.onBehalfOf as ParticipantRole | undefined
        const effectiveParticipant: ParticipantRole = onBehalfOf && currentParticipant === 'admin'
          ? onBehalfOf
          : currentParticipant

        // Check if action is allowed for the effective participant
        const validation = canPerformAction(flowState, action, effectiveParticipant)
        if (!validation.allowed) {
          return { success: false, error: validation.reason }
        }

        // Optimistic update
        const previousState = flowState
        const newState = computeNextState(flowState, action, effectiveParticipant)
        set({ flowState: newState, isSyncing: true })

        try {
          const supabase = createClient()

          // Prepare update data
          const updateData = mapFlowStateToContract(newState)

          // DEBUG: Log what we're trying to save
          console.log('🔍 DEBUG - Saving to database:', {
            contractId,
            action,
            participant: currentParticipant,
            effectiveParticipant,
            updateData,
            stepState: newState.steps[newState.currentStep]
          })

          // Save to database
          const { error: updateError } = await supabase
            .from('contracts')
            .update(updateData)
            .eq('id', contractId)

          if (updateError) throw updateError

          // Log activity
          const activity: Omit<ActivityEntry, 'id'> = {
            contractId,
            action,
            participant: currentParticipant, // من نفّذ الفعل فعلياً (المدير عند التفويض)
            participantName: participantName || currentParticipant,
            timestamp: new Date().toISOString(),
            description: getActionDescription(action),
            metadata,
          }

          const { data: savedActivity, error: activityError } = await supabase
            .from('contract_activities')
            .insert({
              contract_id: contractId,
              activity_type: action,
              description: activity.description,
              metadata: {
                participant: currentParticipant,
                participantName,
                onBehalfOf: onBehalfOf,
                ...metadata,
              },
            })
            .select()
            .single()

          if (!activityError && savedActivity) {
            get()._addActivity({
              ...activity,
              id: savedActivity.id,
            })
          }

          set({ isSyncing: false, lastSyncAt: new Date().toISOString() })

          return { success: true }

        } catch (error: any) {
          console.error('Failed to perform action:', error)

          // Rollback optimistic update
          set({ flowState: previousState, isSyncing: false, error: error.message })

          return { success: false, error: error.message }
        }
      },

      /**
       * Subscribe to Real-time Updates
       */
      subscribeToFlow: () => {
        const { contractId, _channel } = get()
        if (!contractId) return

        // Unsubscribe from previous channel
        if (_channel) {
          _channel.unsubscribe()
        }

        const supabase = createClient()

        const channel = supabase
          .channel(`contract-flow:${contractId}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'contracts',
              filter: `id=eq.${contractId}`,
            },
            (payload) => {
              console.log('📡 Contract updated:', payload)
              // حافظ على نفس منطق 2 أطراف / 3 أطراف كما تم حسابه عند التهيئة
              const currentHasAffiliate = get().flowState.hasAffiliate
              const newFlowState = reconstructFlowState(payload.new, currentHasAffiliate)
              set({
                flowState: newFlowState,
                contractData: payload.new, // Update contract data
                lastSyncAt: new Date().toISOString()
              })
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'contract_activities',
              filter: `contract_id=eq.${contractId}`,
            },
            (payload) => {
              console.log('📡 New activity:', payload)
              const activity = mapActivityFromDB(payload.new)
              get()._addActivity(activity)
            }
          )
          .on('presence', { event: 'sync' }, () => {
            const presenceState = channel.presenceState()
            const onlineParticipants = {
              admin: false,
              client: false,
              affiliate: false,
            }

            Object.values(presenceState).forEach((presence: any) => {
              const participants = Array.isArray(presence) ? presence : [presence]
              participants.forEach((p: any) => {
                if (p.participant) {
                  onlineParticipants[p.participant as ParticipantRole] = true
                }
              })
            })

            set({ otherParticipantsOnline: onlineParticipants })
          })
          .subscribe((status) => {
            console.log('📡 Real-time status:', status)
            set({ isConnected: status === 'SUBSCRIBED' })
          })

        // Track presence
        channel.track({
          participant: get().currentParticipant,
          name: get().participantName,
          online_at: new Date().toISOString(),
        })

        set({ _channel: channel })
      },

      /**
       * Unsubscribe from Real-time
       */
      unsubscribeFromFlow: () => {
        const { _channel } = get()
        if (_channel) {
          _channel.unsubscribe()
          set({ _channel: null, isConnected: false })
        }
      },

      /**
       * Query: Can Perform Action
       */
      canPerformAction: (action, onBehalfOf) => {
        const { flowState, currentParticipant } = get()
        if (!currentParticipant) return { allowed: false, reason: 'الجلسة غير صالحة' }

        // Only admin can act on behalf of another participant
        if (onBehalfOf && currentParticipant !== 'admin') {
          return { allowed: false, reason: 'غير مسموح بتنفيذ الإجراء نيابةً عن طرف آخر' }
        }

        const effectiveParticipant: ParticipantRole = onBehalfOf ?? currentParticipant
        return canPerformAction(flowState, action, effectiveParticipant)
      },

      /**
       * Query: Get Progress
       */
      getProgress: () => {
        return getStepProgress(get().flowState)
      },

      /**
       * Query: Get Current Step Name
       */
      getCurrentStepName: () => {
        return getStepName(get().flowState.currentStep)
      },

      // Internal setters
      _setFlowState: (state) => set({ flowState: state }),
      _addActivity: (activity) => set((state) => ({ activities: [activity, ...state.activities] })),
      _setError: (error) => set({ error }),
      _setLoading: (loading) => set({ isLoading: loading }),
    })),
    { name: 'ContractFlowStore' }
  )
)

/**
 * Helper: Reconstruct Flow State from Contract Data
 */
function reconstructFlowState(contract: any, hasAffiliate: boolean): FlowState {
  // This maps database columns to flow state
  return {
    currentStep: contract.current_step_name || 'review',
    hasAffiliate,
    affiliateId: contract.affiliate_id,
    steps: {
      review: {
        step: 'review',
        adminCompleted: contract.admin_review_approved || false,
        clientCompleted: contract.client_review_approved || false,
        affiliateCompleted: contract.affiliate_review_approved || false,
        isBlocked: false,
        completedAt: contract.review_completed_at,
        requiresAffiliate: hasAffiliate,
      },
      signatures: {
        step: 'signatures',
        adminCompleted: !!contract.admin_signature,
        clientCompleted: !!contract.client_signature,
        affiliateCompleted: false,
        isBlocked: hasAffiliate
          ? !(contract.admin_review_approved && contract.client_review_approved && contract.affiliate_review_approved)
          : !(contract.admin_review_approved && contract.client_review_approved),
        completedAt: contract.signatures_completed_at,
        requiresAffiliate: false,
      },
      otp_verification: {
        step: 'otp_verification',
        adminCompleted: false,
        clientCompleted: contract.otp_verified || false,
        affiliateCompleted: false,
        isBlocked: !(contract.admin_signature && contract.client_signature),
        completedAt: contract.otp_verified_at,
        requiresAffiliate: false,
      },
      id_cards: {
        step: 'id_cards',
        adminCompleted: !!contract.admin_id_card,
        clientCompleted: !!contract.client_id_card,
        affiliateCompleted: false,
        isBlocked: !contract.otp_verified,
        completedAt: contract.id_cards_completed_at,
        requiresAffiliate: false,
      },
      payment_proof: {
        step: 'payment_proof',
        // لا نعتمد على admin_payment_proof_reviewed من الواجهة الأمامية لتفادي مشاكل schema cache
        adminCompleted: false,
        clientCompleted: !!contract.payment_proof_id,
        affiliateCompleted: false,
        isBlocked: !(contract.admin_id_card && contract.client_id_card),
        completedAt: contract.payment_proof_uploaded_at,
        requiresAffiliate: false,
      },
      payment_approval: {
        step: 'payment_approval',
        adminCompleted: contract.payment_approved || false,
        clientCompleted: false,
        affiliateCompleted: false,
        isBlocked: !contract.payment_proof_id,
        completedAt: contract.payment_approved_at,
        requiresAffiliate: false,
      },
      encryption_explanation: {
        step: 'encryption_explanation',
        adminCompleted: false,
        clientCompleted: contract.encryption_understood || false,
        affiliateCompleted: false,
        isBlocked: !contract.payment_approved,
        completedAt: contract.encryption_understood_at,
        requiresAffiliate: false,
      },
      finalization: {
        step: 'finalization',
        adminCompleted: contract.finalized || false,
        clientCompleted: false,
        affiliateCompleted: false,
        isBlocked: !contract.payment_approved,
        completedAt: contract.finalized_at,
        requiresAffiliate: false,
      },
    },
    canProceed: true,
    isComplete: contract.finalized || false,
  }
}

/**
 * Helper: Map Flow State to Contract Update
 */
function mapFlowStateToContract(flowState: FlowState): Record<string, any> {
  // Derive a normalized workflow_status string from the current flow state
  // This keeps the backend/API lists in sync with the tablet signing-first logic
  const s = flowState.steps

  let workflow_status: string = 'pending_review'

  // Finalization
  if (s.finalization.adminCompleted) {
    workflow_status = 'completed'
  }
  // Payment approved/rejected handled by server actions, but reflect locally when present
  else if (s.payment_approval.adminCompleted) {
    workflow_status = 'payment_approved'
  }
  // Encryption understood
  else if (s.encryption_explanation.clientCompleted) {
    workflow_status = 'encryption_understood'
  }
  // After payment proof
  else if (s.payment_proof.clientCompleted) {
    workflow_status = 'payment_pending'
  }
  // IDs uploaded (both sides)
  else if (s.id_cards.adminCompleted && s.id_cards.clientCompleted) {
    workflow_status = 'ids_uploaded'
  }
  // OTP verified
  else if (s.otp_verification.clientCompleted) {
    workflow_status = 'otp_verified'
  }
  // Signatures step granular states
  else if (flowState.currentStep === 'signatures' || s.signatures.completedAt) {
    if (s.signatures.adminCompleted && s.signatures.clientCompleted) {
      workflow_status = 'signed'
    } else if (s.signatures.adminCompleted && !s.signatures.clientCompleted) {
      workflow_status = 'pending_client_signature'
    } else if (!s.signatures.adminCompleted && s.signatures.clientCompleted) {
      workflow_status = 'pending_admin_signature'
    } else {
      // Default preferred order: admin signs first on tablet
      workflow_status = 'pending_admin_signature'
    }
  }
  // Review completion
  else {
    const twoPartyApproved = s.review.adminCompleted && s.review.clientCompleted
    const threePartyApproved = twoPartyApproved && (!flowState.hasAffiliate || s.review.affiliateCompleted)
    if (threePartyApproved) {
      workflow_status = 'approved'
    } else {
      workflow_status = 'pending_review'
    }
  }

  return {
    current_step_name: flowState.currentStep,
    admin_review_approved: flowState.steps.review.adminCompleted,
    client_review_approved: flowState.steps.review.clientCompleted,
    affiliate_review_approved: flowState.steps.review.affiliateCompleted,
    review_completed_at: flowState.steps.review.completedAt,
    signatures_completed_at: flowState.steps.signatures.completedAt,
    otp_verified: flowState.steps.otp_verification.clientCompleted,
    otp_verified_at: flowState.steps.otp_verification.completedAt,
    id_cards_completed_at: flowState.steps.id_cards.completedAt,
    payment_proof_uploaded_at: flowState.steps.payment_proof.completedAt,
    payment_approved: flowState.steps.payment_approval.adminCompleted,
    payment_approved_at: flowState.steps.payment_approval.completedAt,
    encryption_understood: flowState.steps.encryption_explanation.clientCompleted,
    encryption_understood_at: flowState.steps.encryption_explanation.completedAt,
    finalized: flowState.steps.finalization.adminCompleted,
    finalized_at: flowState.steps.finalization.completedAt,
    workflow_status,
    updated_at: new Date().toISOString(),
  }
}

/**
 * Helper: Map Activity from Database
 */
function mapActivityFromDB(dbActivity: any): ActivityEntry {
  return {
    id: dbActivity.id,
    contractId: dbActivity.contract_id,
    action: dbActivity.activity_type,
    participant: dbActivity.metadata?.participant || 'admin',
    participantName: dbActivity.metadata?.participantName || 'Unknown',
    timestamp: dbActivity.created_at,
    description: dbActivity.description,
    metadata: dbActivity.metadata,
  }
}
