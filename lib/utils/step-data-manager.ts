/**
 * Simple Step Data Manager
 * Manages step data transfer between wizard steps
 */

// Simple in-memory storage for step data
let stepDataCache: Record<string, any> = {}

export const StepDataManager = {
  // Save step data
  saveStepData: (contractId: string, step: number, data: any) => {
    const key = `${contractId}_step_${step}`
    stepDataCache[key] = {
      ...data,
      timestamp: new Date().toISOString(),
      step
    }
    
    // Also save to localStorage for persistence
    try {
      localStorage.setItem(`contract_step_data_${contractId}`, JSON.stringify(stepDataCache))
    } catch (error) {
      console.warn('Could not save to localStorage:', error)
    }
    
    console.log(`💾 Step ${step} data saved:`, data)
  },

  // Get step data
  getStepData: (contractId: string, step: number) => {
    const key = `${contractId}_step_${step}`
    return stepDataCache[key] || null
  },

  // Get all step data for a contract
  getAllStepData: (contractId: string) => {
    // Try to load from localStorage first
    try {
      const stored = localStorage.getItem(`contract_step_data_${contractId}`)
      if (stored) {
        stepDataCache = { ...stepDataCache, ...JSON.parse(stored) }
      }
    } catch (error) {
      console.warn('Could not load from localStorage:', error)
    }

    const contractData: any = {}
    
    for (let i = 1; i <= 8; i++) {
      const key = `${contractId}_step_${i}`
      if (stepDataCache[key]) {
        contractData[`step_${i}_data`] = stepDataCache[key]
      }
    }
    
    return contractData
  },

  // Clear step data
  clearStepData: (contractId: string) => {
    const keysToDelete = Object.keys(stepDataCache).filter(key => key.startsWith(`${contractId}_`))
    keysToDelete.forEach(key => delete stepDataCache[key])
    
    try {
      localStorage.removeItem(`contract_step_data_${contractId}`)
    } catch (error) {
      console.warn('Could not clear localStorage:', error)
    }
  },

  // Debug: get all cached data
  getDebugInfo: () => {
    return {
      cacheSize: Object.keys(stepDataCache).length,
      cachedKeys: Object.keys(stepDataCache),
      data: stepDataCache
    }
  }
}
