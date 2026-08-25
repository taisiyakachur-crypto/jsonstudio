import { Table2 } from 'lucide-react'
import { ToolStub } from '@/tools/tool-stub'
import type { Tab } from '@/types/tabs'

export function TablePane({ tab: _tab }: { tab: Tab<'table'> }) {
  return <ToolStub icon={Table2} nameKey="tool.table.name" descriptionKey="tool.table.description" />
}
