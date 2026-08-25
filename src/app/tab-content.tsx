import { ChartPane } from '@/tools/chart'
import { ComparePane } from '@/tools/compare'
import { FormatPane } from '@/tools/format'
import { ParsePane } from '@/tools/parse'
import { TablePane } from '@/tools/table'
import type { AnyTab } from '@/types/tabs'

export function TabContent({ tab }: { tab: AnyTab }) {
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
