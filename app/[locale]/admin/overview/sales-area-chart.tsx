'use client'

import ProductPrice from '@/components/shared/product/product-price'
import { Card, CardContent } from '@/components/ui/card'
import useColorStore from '@/hooks/use-color-store'
import { formatDateTime } from '@/lib/utils'
import { useTheme } from 'next-themes'
import React from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  TooltipProps,
  XAxis,
  YAxis,
} from 'recharts'

// Define types for chart data
interface SalesData {
  date: string
  totalSales: number
}

interface CustomTooltipProps extends TooltipProps<number, string> {
  active?: boolean
  payload?: { value: number }[]
  label?: string
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  label,
}) => {
  if (active && payload && payload.length) {
    return (
      <Card className='shadow-lg border-primary/20'>
        <CardContent className='p-3 space-y-1'>
          <p className='text-sm font-medium'>
            {label && formatDateTime(new Date(label)).dateOnly}
          </p>
          <p className='text-primary text-xl font-bold'>
            <ProductPrice price={payload[0].value} plain />
          </p>
        </CardContent>
      </Card>
    )
  }
  return null
}

export default function SalesAreaChart({ data }: { data: SalesData[] }) {
  const { theme } = useTheme()
  const { cssColors } = useColorStore(theme)

  const gradientId = 'colorGradient'

  // Add empty data points for smoother curves if data has gaps
  const processedData = React.useMemo(() => {
    if (!data || data.length < 2) return data

    // Sort data by date
    const sortedData = [...data].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    return sortedData
  }, [data])

  return (
    <ResponsiveContainer width='100%' height='100%'>
      <AreaChart
        data={processedData}
        margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
      >
        <defs>
          <linearGradient id={gradientId} x1='0' y1='0' x2='0' y2='1'>
            <stop
              offset='5%'
              stopColor={`hsl(${cssColors['--primary']})`}
              stopOpacity={0.6}
            />
            <stop
              offset='95%'
              stopColor={`hsl(${cssColors['--primary']})`}
              stopOpacity={0}
            />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray='3 3'
          vertical={false}
          stroke='currentColor'
          strokeOpacity={0.1}
        />
        <XAxis
          dataKey='date'
          tickMargin={10}
          axisLine={{ stroke: 'currentColor', strokeOpacity: 0.2 }}
          tickLine={{ stroke: 'currentColor', strokeOpacity: 0.2 }}
          tickSize={4}
          tickCount={7}
        />
        <YAxis
          fontSize={12}
          tickFormatter={(value: number) => `$${value}`}
          axisLine={{ stroke: 'currentColor', strokeOpacity: 0.2 }}
          tickLine={{ stroke: 'currentColor', strokeOpacity: 0.2 }}
          stroke='currentColor'
          strokeOpacity={0.4}
        />
        <Tooltip
          content={<CustomTooltip />}
          cursor={{
            stroke: 'currentColor',
            strokeOpacity: 0.2,
            strokeWidth: 1,
          }}
          wrapperStyle={{ outline: 'none' }}
        />
        <Area
          type='monotone'
          dataKey='totalSales'
          stroke={`hsl(${cssColors['--primary']})`}
          strokeWidth={2}
          fillOpacity={1}
          fill={`url(#${gradientId})`}
          animationDuration={1000}
          animationEasing='ease-out'
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
