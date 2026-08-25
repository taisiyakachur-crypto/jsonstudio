import * as Comlink from 'comlink'
import { useCallback, useRef, useState } from 'react'
import { getDiffWorkerApi } from '@/lib/diff-worker-client'
import type { DiffNode, DiffOptions } from '@/lib/diff'
import { DIFF_CANCELLED_ERROR_NAME } from '@/types/diff-worker'
import type { DiffPhase } from '@/types/diff-worker'

export type DiffRunStatus = 'idle' | 'running' | 'ready' | 'error' | 'cancelled'

function isCancelledError(err: unknown): boolean {
  return err instanceof Error && err.name === DIFF_CANCELLED_ERROR_NAME
}

export interface UseDiff {
  status: DiffRunStatus
  result: DiffNode | null
  phase: DiffPhase | null
  error: string | null
  run: (leftText: string, rightText: string, options: DiffOptions) => void
  cancel: () => void
}

export function useDiff(): UseDiff {
  const [status, setStatus] = useState<DiffRunStatus>('idle')
  const [result, setResult] = useState<DiffNode | null>(null)
  const [phase, setPhase] = useState<DiffPhase | null>(null)
  const [error, setError] = useState<string | null>(null)
  const runIdRef = useRef<string | null>(null)

  const run = useCallback((leftText: string, rightText: string, options: DiffOptions) => {
    const id = crypto.randomUUID()
    runIdRef.current = id
    setStatus('running')
    setPhase(null)
    setError(null)
    void (async () => {
      try {
        const onProgress = Comlink.proxy((p: { phase: DiffPhase }) => {
          if (runIdRef.current === id) setPhase(p.phase)
        })
        const diff = await getDiffWorkerApi().computeDiff(id, leftText, rightText, options, onProgress)
        if (runIdRef.current !== id) return
        setResult(diff)
        setStatus('ready')
      } catch (err) {
        if (runIdRef.current !== id) return
        if (isCancelledError(err)) {
          setStatus('cancelled')
        } else {
          setStatus('error')
          setError(err instanceof Error ? err.message : String(err))
        }
      }
    })()
  }, [])

  const cancel = useCallback(() => {
    if (runIdRef.current) getDiffWorkerApi().cancel(runIdRef.current)
  }, [])

  return { status, result, phase, error, run, cancel }
}
