import { Loader2 } from 'lucide-react'
import { lazy, Suspense } from 'react'
import type { AnyTab } from '@/types/tabs'

// Code-split per tool: each one drags in its own heavy dependency (CodeMirror,
// later TanStack Table / Recharts), and only the active tab's tool needs to load.
const ComparePane = lazy(() => import('@/tools/compare').then((m) => ({ default: m.ComparePane })))
const ParsePane = lazy(() => import('@/tools/parse').then((m) => ({ default: m.ParsePane })))
const TablePane = lazy(() => import('@/tools/table').then((m) => ({ default: m.TablePane })))
const ChartPane = lazy(() => import('@/tools/chart').then((m) => ({ default: m.ChartPane })))
const FormatPane = lazy(() => import('@/tools/format').then((m) => ({ default: m.FormatPane })))

function PaneFallback() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
    </div>
  )
}

export function TabContent({ tab }: { tab: AnyTab }) {
  return (
    <Suspense fallback={<PaneFallback />}>
      <TabContentInner tab={tab} />
    </Suspense>
  )
}

function TabContentInner({ tab }: { tab: AnyTab }) {
  switch (tab.type) {
    case 'compare':
      return <ComparePane tab={tab} />
    case 'parse':
      return <ParsePane tab={tab} />
    case 'table':
      return <TablePane tab={tab} />
    case 'chart':
      return <ChartPane tab={tab} />
    case 'format':
      return <FormatPane tab={tab} />
  }
}
