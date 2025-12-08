import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

/**
 * Contract Workflow State Interface
 */
export interface ContractWorkflowState {
  // Current contract data
  currentContract: any | null
  currentStep: number
  isLoading: boolean
  error: string | null

  // Realtime subscription
  realtimeChannel: RealtimeChannel | null

  // Actions
  setCurrentContract: (contract: any) => void
  setCurrentStep: (step: number) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  
  // Contract operations
  fetchContract: (contractId: string) => Promise<void>
  updateContractStep: (contractId: string, step: number, data?: any) => Promise<void>
  
  // Realtime subscription
  subscribeToContract: (contractId: string) => void
  unsubscribeFromContract: () => void
  
  // Reset state
  reset: () => void
}

/**
 * Contract Workflow Store
 * Manages contract state with realtime synchronization
 */
export const useContractWorkflowStore = create<ContractWorkflowState>((set, get) => ({
  // Initial state
  currentContract: null,
  currentStep: 1,
  isLoading: false,
  error: null,
  realtimeChannel: null,

  // Setters
  setCurrentContract: (contract) => set({ currentContract: contract }),
  setCurrentStep: (step) => set({ currentStep: step }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  /**
   * Fetch contract from database
   */
  fetchContract: async (contractId: string) => {
    set({ isLoading: true, error: null })
    
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('id', contractId)
        .single()

      if (error) throw error

      set({
        currentContract: data,
        currentStep: data.current_step || 1,
        isLoading: false
      })
    } catch (error: any) {
      console.error('Error fetching contract:', error)
      set({
        error: error.message || 'فشل في جلب بيانات العقد',
        isLoading: false
      })
    }
  },

  /**
   * Update contract step with optimistic update
   */
  updateContractStep: async (contractId: string, step: number, data?: any) => {
    const previousContract = get().currentContract
    const previousStep = get().currentStep

    // Optimistic update
    set({
      currentStep: step,
      currentContract: {
        ...previousContract,
        current_step: step,
        [`step_${step}_completed`]: true,
        [`step_${step}_data`]: data || {}
      }
    })

    try {
      const supabase = createClient()
      const updateData: any = {
        current_step: step,
        [`step_${step}_completed`]: true,
        [`step_${step}_data`]: data || {},
        progress_updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('contracts')
        .update(updateData)
        .eq('id', contractId)

      if (error) throw error

      // Refresh contract data
      await get().fetchContract(contractId)
    } catch (error: any) {
      console.error('Error updating contract step:', error)
      
      // Rollback on failure
      set({
        currentStep: previousStep,
        currentContract: previousContract,
        error: error.message || 'فشل في تحديث الخطوة'
      })
    }
  },

  /**
   * Subscribe to realtime contract updates
   */
  subscribeToContract: (contractId: string) => {
    const supabase = createClient()
    
    // Unsubscribe from previous channel if exists
    get().unsubscribeFromContract()

    console.log('🔔 Subscribing to contract realtime:', contractId)

    const channel = supabase
      .channel(`contract:${contractId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contracts',
          filter: `id=eq.${contractId}`
        },
        (payload) => {
          console.log('🔔 Contract realtime update:', payload)

          if (payload.eventType === 'UPDATE') {
            // Update local state with new data
            set({
              currentContract: payload.new,
              currentStep: payload.new.current_step || 1
            })
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Contract subscription status:', status)
      })

    set({ realtimeChannel: channel })
  },

  /**
   * Unsubscribe from realtime updates
   */
  unsubscribeFromContract: () => {
    const channel = get().realtimeChannel
    if (channel) {
      console.log('🔌 Unsubscribing from contract realtime')
      channel.unsubscribe()
      set({ realtimeChannel: null })
    }
  },

  /**
   * Reset store to initial state
   */
  reset: () => {
    get().unsubscribeFromContract()
    set({
      currentContract: null,
      currentStep: 1,
      isLoading: false,
      error: null,
      realtimeChannel: null
    })
  }
}))
