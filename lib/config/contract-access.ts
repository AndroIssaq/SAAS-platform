/**
 * Contract Access Configuration
 * تكوين الوصول للعقود - من يستطيع إنشاء وتعديل العقود
 */

export type UserRole = 'admin' | 'client' | 'affiliate'
export type ContractAction = 'create' | 'edit' | 'view' | 'sign' | 'verify'

export interface AccessRule {
  role: UserRole
  actions: ContractAction[]
  conditions?: {
    ownContract?: boolean
    step?: number
    status?: string[]
  }
}

export const CONTRACT_ACCESS_RULES: AccessRule[] = [
  // Admin: Full access to everything
  {
    role: 'admin',
    actions: ['create', 'edit', 'view', 'sign', 'verify']
  },
  
  // Client: Can create, view and interact with own contracts
  {
    role: 'client', 
    actions: ['create', 'view', 'sign', 'verify'],
    conditions: {
      ownContract: true
    }
  },
  
  // Affiliate: Can view and create contracts for clients
  {
    role: 'affiliate',
    actions: ['create', 'view']
  }
]

export function canUserPerformAction(
  userRole: UserRole, 
  action: ContractAction, 
  context?: {
    isOwnContract?: boolean
    contractStatus?: string
    currentStep?: number
  }
): boolean {
  const rules = CONTRACT_ACCESS_RULES.filter(rule => rule.role === userRole)
  
  for (const rule of rules) {
    if (!rule.actions.includes(action)) continue
    
    // Check conditions
    if (rule.conditions) {
      if (rule.conditions.ownContract && !context?.isOwnContract) continue
      if (rule.conditions.status && context?.contractStatus && 
          !rule.conditions.status.includes(context.contractStatus)) continue
      if (rule.conditions.step && context?.currentStep && 
          context.currentStep < rule.conditions.step) continue
    }
    
    return true
  }
  
  return false
}

export function getAvailableActions(userRole: UserRole, context?: any): ContractAction[] {
  const actions: ContractAction[] = []
  
  for (const action of ['create', 'edit', 'view', 'sign', 'verify'] as ContractAction[]) {
    if (canUserPerformAction(userRole, action, context)) {
      actions.push(action)
    }
  }
  
  return actions
}

// Navigation paths for different roles
export const ROLE_DASHBOARDS = {
  admin: '/admin/contracts',
  client: '/client/contracts', 
  affiliate: '/affiliate/contracts'
} as const

export function getDashboardPath(role: UserRole): string {
  return ROLE_DASHBOARDS[role] || '/client/contracts'
}

export function getContractCreatePath(role: UserRole): string {
  return `${getDashboardPath(role)}/create`
}

export function getContractViewPath(role: UserRole, contractId: string): string {
  return `${getDashboardPath(role)}/${contractId}`
}
