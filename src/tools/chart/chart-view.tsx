import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useTranslation } from '@/i18n'
import type { ChartKind, ChartPoint } from '@/lib/chart-data'

const CHART_COLOR_COUNT = 6

function colorFor(index: number): string {
  return `hsl(var(--chart-${(index % CHART_COLOR_COUNT) + 1}))`
}

const AXIS_TICK = { fontSize: 12 }

export function ChartView({
  kind,
  data,
  seriesKeys,
}: {
  kind: ChartKind
  data: ChartPoint[]
  seriesKeys: string[]
}) {
  const { t } = useTranslation()

  if (data.length === 0 || seriesKeys.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        {t('chart.noData')}
      </div>
    )
  }

  if (kind === 'pie') {
    const valueKey = seriesKeys[0]
    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip />
          <Legend />
          <Pie data={data} dataKey={valueKey} nameKey="x" outerRadius="75%" label>
            {data.map((_, i) => (
              <Cell key={i} fill={colorFor(i)} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    )
  }

  if (kind === 'scatter') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="x" type="category" tick={AXIS_TICK} allowDuplicatedCategory={false} />
          <YAxis type="number" tick={AXIS_TICK} />
          <Tooltip />
          <Legend />
          {seriesKeys.map((key, i) => (
            <Scatter key={key} name={key} data={data} dataKey={key} fill={colorFor(i)} />
          ))}
        </ScatterChart>
      </ResponsiveContainer>
    )
  }

  if (kind === 'line') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="x" tick={AXIS_TICK} />
          <YAxis tick={AXIS_TICK} />
          <Tooltip />
          <Legend />
          {seriesKeys.map((key, i) => (
            <Line key={key} type="monotone" dataKey={key} stroke={colorFor(i)} dot={false} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    )
  }

  if (kind === 'area') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="x" tick={AXIS_TICK} />
          <YAxis tick={AXIS_TICK} />
          <Tooltip />
          <Legend />
          {seriesKeys.map((key, i) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              stroke={colorFor(i)}
              fill={colorFor(i)}
              fillOpacity={0.25}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="x" tick={AXIS_TICK} />
        <YAxis tick={AXIS_TICK} />
        <Tooltip />
        <Legend />
        {seriesKeys.map((key, i) => (
          <Bar key={key} dataKey={key} fill={colorFor(i)} stackId={kind === 'bar-stacked' ? 'stack' : undefined} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}
