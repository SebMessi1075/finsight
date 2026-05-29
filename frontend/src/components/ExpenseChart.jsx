import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import { fmtINR, fmtINRCompact } from '../utils/fmt'

const C = {
  accent:  '#4A4A8A',
  border:  '#E8E8E3',
  text3:   '#9A9A94',
}

function Tip({ active, payload }) {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tip">
      <p className="chart-tip-label">{payload[0].payload.name}</p>
      <p className="chart-tip-value">{fmtINR(payload[0].value)}</p>
    </div>
  )
}

// expense_by_category: { labels: string[], values: number[] }
export default function ExpenseChart({ data }) {
  const total = data.values.reduce((a, b) => a + b, 0)
  const chartData = data.labels.map((name, i) => ({
    name,
    amount: data.values[i],
    pct: total > 0 ? ((data.values[i] / total) * 100).toFixed(1) : '0',
  }))

  return (
    <div className="card">
      <div className="card-section-title">
        <span>Spending by Category</span>
        <span className="card-section-title-secondary">{fmtINR(total)} across {chartData.length} categories</span>
      </div>
      <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 36)}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 0, right: 64, left: 0, bottom: 0 }}
          barSize={14}
        >
          <XAxis
            type="number"
            tickFormatter={fmtINRCompact}
            tick={{ fontSize: 11, fill: C.text3 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={128}
            tick={{ fontSize: 12, fill: '#5C5C5C' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<Tip />} cursor={{ fill: '#F5F5F2' }} />
          <Bar dataKey="amount" radius={[0, 3, 3, 0]}>
            {chartData.map((_, i) => (
              <Cell
                key={i}
                fill={C.accent}
                fillOpacity={1 - (i / chartData.length) * 0.45}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
