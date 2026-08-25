import { BarChart3 } from 'lucide-react'
import { ToolStub } from '@/tools/tool-stub'
import type { Tab } from '@/types/tabs'

export function ChartPane({ tab: _tab }: { tab: Tab<'chart'> }) {
  return <ToolStub icon={BarChart3} nameKey="tool.chart.name" descriptionKey="tool.chart.description" />
}
