'use client'

/**
 * Project Updates Manager
 * صفحة Admin لإرسال تحديثات المشاريع للعملاء
 */

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SendProjectUpdateForm } from './send-project-update-form'
import { Search, Users, FileText, CheckCircle2, Filter, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface Contract {
  id: string
  contract_number: string
  client_id: string
  client_name: string
  service_type: string
  status: string
  workflow_status: string
  created_at: string
}

interface ProjectUpdatesManagerProps {
  contracts: Contract[]
}

export function ProjectUpdatesManager({ contracts }: ProjectUpdatesManagerProps) {
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Filter contracts
  const filteredContracts = contracts.filter((contract) => {
    const matchesSearch =
      contract.contract_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contract.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contract.service_type.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && contract.status === 'active') ||
      (statusFilter === 'completed' && contract.workflow_status === 'completed')

    return matchesSearch && matchesStatus
  })

  // Group by client
  const clientGroups = filteredContracts.reduce((acc, contract) => {
    if (!acc[contract.client_id]) {
      acc[contract.client_id] = {
        client_name: contract.client_name,
        client_id: contract.client_id,
        contracts: [],
      }
    }
    acc[contract.client_id].contracts.push(contract)
    return acc
  }, {} as Record<string, { client_name: string; client_id: string; contracts: Contract[] }>)

  const clients = Object.values(clientGroups)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Clients List */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            العملاء ({clients.length})
          </CardTitle>
          <CardDescription>اختر عميل لإرسال تحديث</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث عن عميل أو عقد..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>

          {/* Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  جميع العقود
                </div>
              </SelectItem>
              <SelectItem value="active">العقود النشطة</SelectItem>
              <SelectItem value="completed">العقود المكتملة</SelectItem>
            </SelectContent>
          </Select>

          {/* Clients List */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {clients.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                لا توجد عقود
              </div>
            ) : (
              clients.map((client) => (
                <Card
                  key={client.client_id}
                  className={cn(
                    'cursor-pointer transition-all hover:shadow-md',
                    'border-2',
                    selectedContract?.client_id === client.client_id
                      ? 'border-primary bg-primary/5'
                      : 'border-transparent'
                  )}
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm mb-1">{client.client_name}</h4>
                          <p className="text-xs text-muted-foreground">
                            {client.contracts.length} {client.contracts.length === 1 ? 'عقد' : 'عقود'}
                          </p>
                        </div>
                      </div>

                      {/* Contracts */}
                      <div className="space-y-1">
                        {client.contracts.map((contract) => (
                          <div key={contract.id} className="flex items-center gap-1">
                            <button
                              onClick={() => setSelectedContract(contract)}
                              className={cn(
                                'flex-1 text-right p-2 rounded-md transition-colors',
                                'hover:bg-accent',
                                selectedContract?.id === contract.id
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              )}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium truncate">
                                    {contract.contract_number}
                                  </p>
                                  <p className="text-xs opacity-80 truncate">{contract.service_type}</p>
                                </div>
                                {contract.workflow_status === 'completed' ? (
                                  <CheckCircle2 className="h-3 w-3 flex-shrink-0" />
                                ) : (
                                  <FileText className="h-3 w-3 flex-shrink-0" />
                                )}
                              </div>
                            </button>
                            <Link href={`/admin/project-updates/${contract.id}`}>
                              <Button variant="ghost" size="sm" className="h-auto p-2">
                                <MessageSquare className="h-4 w-4" />
                              </Button>
                            </Link>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Send Update Form */}
      <div className="lg:col-span-2">
        {selectedContract ? (
          <SendProjectUpdateForm
            contractId={selectedContract.id}
            clientId={selectedContract.client_id}
            contractNumber={selectedContract.contract_number}
            clientName={selectedContract.client_name}
            onSuccess={() => {
              // Optionally reset selection or show success message
            }}
          />
        ) : (
          <Card>
            <CardContent className="flex items-center justify-center py-20">
              <div className="text-center text-muted-foreground">
                <Users className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium mb-2">اختر عقد</p>
                <p className="text-sm">اختر عقد من القائمة لإرسال تحديث للعميل</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
