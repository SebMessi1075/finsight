import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import { fmtINR, fmtINRCompact } from '../utils/fmt'


const C = {
  accent:    '#4A4A8A',
  accentBg:  '#EDEDF5',
  border:    '#E8E8E3',
  text3:     '#9A9A94',
}

function Tip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tip">
      <p className="chart-tip-label">{label}</p>
      <p className="chart-tip-value">{fmtINR(payload[0].value)}</p>
    </div>
  )
}

// monthly_trend: { labels: string[], values: number[] }
export default function MonthlyTrend({ data }) {
  const chartData = data.labels.map((label, i) => ({
    month: label,
    amount: data.values[i],
  }))

  const total = data.values.reduce((a, b) => a + b, 0)

  return (
    <div className="card">
      <div className="card-section-title">
        <span>Monthly Spending</span>
        <span className="card-section-title-secondary">{fmtINR(total)} total</span>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={C.accentBg} stopOpacity={1} />
              <stop offset="100%" stopColor={C.accentBg} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="0"
            horizontal={true}
            vertical={false}
            stroke={C.border}
          />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: C.text3 }}
            axisLine={false}
            tickLine={false}
            dy={6}
          />
          <YAxis
            tickFormatter={fmtINRCompact}
            tick={{ fontSize: 11, fill: C.text3 }}
            axisLine={false}
            tickLine={false}
            width={52}
          />
          <Tooltip content={<Tip />} cursor={{ stroke: C.border, strokeWidth: 1 }} />
          <Area
            dataKey="amount"
            stroke={C.accent}
            strokeWidth={1.5}
            fill="url(#areaGrad)"
            dot={false}
            activeDot={{ r: 3, fill: C.accent, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
