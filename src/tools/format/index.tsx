import { Wand2 } from 'lucide-react'
import { ToolStub } from '@/tools/tool-stub'
import type { Tab } from '@/types/tabs'

export function FormatPane({ tab: _tab }: { tab: Tab<'format'> }) {
  return <ToolStub icon={Wand2} nameKey="tool.format.name" descriptionKey="tool.format.description" />
}
