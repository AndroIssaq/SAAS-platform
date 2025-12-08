'use client'

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from 'recharts'

interface ContractsByMonthPoint {
  month: string
  count: number
  revenue: number
}

interface ContractsByStatusPoint {
  status: string
  count: number
}

interface ContractsByMonthChartProps {
  data: ContractsByMonthPoint[]
}

export function ContractsByMonthChart({ data }: ContractsByMonthChartProps) {
  if (!data || data.length === 0) {
    return <p className="text-sm text-muted-foreground">لا توجد بيانات كافية لعرض تقرير شهري.</p>
  }

  return (
    <div className="space-y-4">
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barSize={32}>
            <defs>
              <linearGradient id="contractsCountGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.9} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="month" tickMargin={8} tick={{ fontSize: 11 }} />
            <YAxis tickMargin={8} tick={{ fontSize: 11 }} />
            <RechartsTooltip
              formatter={(value: any, name: any) => {
                if (name === 'count') return [value, 'عدد العقود']
                if (name === 'revenue') return [`${Number(value).toLocaleString('ar-EG')} ج.م`, 'الإيرادات']
                return [value, name]
              }}
              labelFormatter={(label) => `الشهر: ${label}`}
            />
            <Bar
              dataKey="count"
              name="عدد العقود"
              radius={[12, 12, 4, 4]}
              fill="url(#contractsCountGradient)"
              isAnimationActive
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        {data.map((m) => (
          <div key={m.month} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span>{m.month}</span>
            <span className="font-medium text-foreground">
              {m.revenue.toLocaleString('ar-EG')} ج.م
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

const STATUS_COLORS = [
  '#0ea5e9', // sky
  '#22c55e', // green
  '#eab308', // amber
  '#f97316', // orange
  '#ef4444', // red
  '#8b5cf6', // violet
]

interface ContractsByStatusChartProps {
  data: ContractsByStatusPoint[]
  totalContracts: number
}

export function ContractsByStatusChart({ data, totalContracts }: ContractsByStatusChartProps) {
  if (!data || data.length === 0) {
    return <p className="text-sm text-muted-foreground">لا توجد عقود كافية لعرض تقرير.</p>
  }

  const chartData = data.map((item, index) => ({
    ...item,
    color: STATUS_COLORS[index % STATUS_COLORS.length],
  }))

  return (
    <div className="space-y-4">
      <div className="h-64 w-full flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsPieChart>
            <RechartsTooltip
              formatter={(value: any) => [`${value} عقد`, 'عدد العقود']}
              labelFormatter={(label) => `الحالة: ${label}`}
            />
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="status"
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={4}
            >
              {chartData.map((entry) => (
                <Cell key={entry.status} fill={entry.color} />
              ))}
            </Pie>
          </RechartsPieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-2 text-xs">
        {chartData.map((item) => {
          const percentage = totalContracts ? Math.round((item.count / totalContracts) * 100) : 0
          return (
            <div key={item.status} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="font-medium text-foreground">{item.status}</span>
              </div>
              <span className="text-muted-foreground">
                {item.count.toLocaleString('ar-EG')} عقد • {percentage}%
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
