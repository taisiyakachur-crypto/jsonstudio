import type { DiffNode, DiffOptions } from '@/lib/diff'

export type DiffPhase = 'parsing-left' | 'parsing-right' | 'diffing' | 'done'

export interface DiffProgress {
  phase: DiffPhase
}

export const DIFF_CANCELLED_ERROR_NAME = 'DiffCancelledError'

/**
 * The contract implemented by `workers/diff.worker.ts`. Both documents are parsed and diffed
 * worker-side so the main thread never touches either document's full contents; only the
 * (typically much smaller) resulting diff tree comes back.
 */
export interface DiffWorkerApi {
  computeDiff(
    id: string,
    leftText: string,
    rightText: string,
    options: DiffOptions,
    onProgress: (progress: DiffProgress) => void,
  ): Promise<DiffNode>
  cancel(id: string): void
}
