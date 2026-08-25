import * as Comlink from 'comlink'
import { useCallback, useRef, useState } from 'react'
import { getDiffWorkerApi } from '@/lib/diff-worker-client'
import type { DiffNode, DiffOptions } from '@/lib/diff'
import { DIFF_CANCELLED_ERROR_NAME } from '@/types/diff-worker'

export type NWayDiffStatus = 'idle' | 'running' | 'ready' | 'error' | 'cancelled'

function isCancelledError(err: unknown): boolean {
  return err instanceof Error && err.name === DIFF_CANCELLED_ERROR_NAME
}

export interface UseNWayDiff {
  status: NWayDiffStatus
  /** `diffValues(texts[0], texts[i])` for each `i` from 1 to N-1, in order. */
  results: DiffNode[] | null
  /** How many of the N-1 pairwise comparisons have finished. */
  completed: number
  total: number
  error: string | null
  run: (texts: string[], options: DiffOptions) => void
  cancel: () => void
}

/** Runs the pairwise diff worker once per non-reference panel, concurrently. */
export function useNWayDiff(): UseNWayDiff {
  const [status, setStatus] = useState<NWayDiffStatus>('idle')
  const [results, setResults] = useState<DiffNode[] | null>(null)
  const [completed, setCompleted] = useState(0)
  const [total, setTotal] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const runIdRef = useRef<string | null>(null)

  const run = useCallback((texts: string[], options: DiffOptions) => {
    const runId = crypto.randomUUID()
    runIdRef.current = runId
    const pairCount = Math.max(0, texts.length - 1)
    setStatus('running')
    setCompleted(0)
    setTotal(pairCount)
    setError(null)

    void (async () => {
      try {
        const api = getDiffWorkerApi()
        const outcomes = await Promise.all(
          Array.from({ length: pairCount }, (_, i) => {
            const callId = `${runId}:${i}`
            const onProgress = Comlink.proxy(() => {})
            return api.computeDiff(callId, texts[0]!, texts[i + 1]!, options, onProgress).then((node) => {
              if (runIdRef.current === runId) setCompleted((c) => c + 1)
              return node
            })
          }),
        )
        if (runIdRef.current !== runId) return
        setResults(outcomes)
        setStatus('ready')
      } catch (err) {
        if (runIdRef.current !== runId) return
        if (isCancelledError(err)) setStatus('cancelled')
        else {
          setStatus('error')
          setError(err instanceof Error ? err.message : String(err))
        }
      }
    })()
  }, [])

  const cancel = useCallback(() => {
    // Cancel ids are derived from the run id; the worker only needs the prefix cleared so any
    // still-inflight computeDiff calls for this run see their own cancel flag flip.
    if (!runIdRef.current) return
    const api = getDiffWorkerApi()
    for (let i = 0; i < total; i++) api.cancel(`${runIdRef.current}:${i}`)
  }, [total])

  return { status, results, completed, total, error, run, cancel }
}
