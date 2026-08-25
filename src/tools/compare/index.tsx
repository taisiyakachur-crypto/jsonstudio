import { GitCompare } from 'lucide-react'
import { ToolStub } from '@/tools/tool-stub'
import type { Tab } from '@/types/tabs'

export function ComparePane({ tab: _tab }: { tab: Tab<'compare'> }) {
  return (
    <ToolStub
      icon={GitCompare}
      nameKey="tool.compare.name"
      descriptionKey="tool.compare.description"
    />
  )
}
