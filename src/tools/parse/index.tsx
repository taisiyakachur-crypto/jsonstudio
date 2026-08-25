import { FileJson } from 'lucide-react'
import { ToolStub } from '@/tools/tool-stub'
import type { Tab } from '@/types/tabs'

export function ParsePane({ tab: _tab }: { tab: Tab<'parse'> }) {
  return <ToolStub icon={FileJson} nameKey="tool.parse.name" descriptionKey="tool.parse.description" />
}
