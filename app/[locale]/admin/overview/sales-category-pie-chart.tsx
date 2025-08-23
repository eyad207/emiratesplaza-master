'use client'

import { useTheme } from 'next-themes'
import React from 'react'
import {
  PieChart,
  Pie,
  ResponsiveContainer,
  Cell,
  Tooltip,
  Legend,
} from 'recharts'
import { cn } from '@/lib/utils'

// Define types for chart data
interface CategoryData {
  _id: string
  totalSales: number
}

interface ProcessedCategoryData {
  name: string
  value: number
  percentage: number
}

// Function to generate chart colors
const generateColors = (count: number, theme: string | undefined) => {
  const baseHue = theme === 'dark' ? 210 : 47
  return Array(count)
    .fill(0)
    .map((_, i) => {
      const hue = (baseHue + i * 40) % 360
      const saturation = theme === 'dark' ? 70 : 90
      const lightness = theme === 'dark' ? 55 - (i % 3) * 10 : 50 - (i % 3) * 7
      return `hsl(${hue}, ${saturation}%, ${lightness}%)`
    })
}

// Type for tooltip props
interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    name: string
    value: number
    payload: ProcessedCategoryData
  }>
}

// Custom tooltip component
const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className='bg-background border rounded-md p-3 shadow-md text-sm'>
        <p className='font-medium'>{payload[0].name}</p>
        <p className='text-muted-foreground'>{`${payload[0].value} sales (${payload[0].payload.percentage}%)`}</p>
      </div>
    )
  }
  return null
}

// Type for legend props
interface CustomLegendProps {
  payload?: Array<{
    value: string
    color: string
  }>
}

// Custom legend with styled items
const CustomLegend: React.FC<CustomLegendProps> = ({ payload }) => {
  if (!payload) return null

  return (
    <ul className='flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs pt-6'>
      {payload.map((entry, index) => (
        <li key={`legend-${index}`} className='flex items-center gap-1.5'>
          <div
            className='w-3 h-3 rounded-full'
            style={{ backgroundColor: entry.color }}
          />
          <span className='text-foreground'>{entry.value}</span>
        </li>
      ))}
    </ul>
  )
}

export default function SalesCategoryPieChart({
  data,
}: {
  data: CategoryData[]
}) {
  const { theme } = useTheme()
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null)

  // Prepare data with percentages for better visualization
  const processedData = React.useMemo(() => {
    if (!data || !data.length) return []

    const total = data.reduce((sum, item) => sum + item.totalSales, 0)

    return data.map((item) => ({
      name: item._id,
      value: item.totalSales,
      percentage: Math.round((item.totalSales / total) * 100),
    }))
  }, [data])

  const colors = generateColors(processedData.length, theme)

  return (
    <ResponsiveContainer width='100%' height='100%'>
      <PieChart margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
        <Pie
          activeIndex={activeIndex !== null ? activeIndex : undefined}
          data={processedData}
          dataKey='value'
          nameKey='name'
          cx='50%'
          cy='45%'
          innerRadius='40%'
          outerRadius='60%'
          paddingAngle={3}
          onMouseEnter={(_, index) => setActiveIndex(index)}
          onMouseLeave={() => setActiveIndex(null)}
          animationDuration={800}
          animationBegin={300}
        >
          {processedData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={colors[index % colors.length]}
              className={cn(
                'transition-all duration-300',
                activeIndex === index ? 'opacity-100' : 'opacity-80'
              )}
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend content={<CustomLegend />} verticalAlign='bottom' />
      </PieChart>
    </ResponsiveContainer>
  )
}
