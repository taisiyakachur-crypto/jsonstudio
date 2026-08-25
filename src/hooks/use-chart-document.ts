import * as Comlink from 'comlink'
import { useCallback, useRef, useState } from 'react'
import { getChartWorkerApi } from '@/lib/chart-worker-client'
import type { Aggregation, ChartResult } from '@/lib/chart-data'
import type { PathEntry } from '@/lib/json-paths'
import type { JsonPathSegment } from '@/types/json-doc'
import { CHART_CANCELLED_ERROR_NAME } from '@/types/chart-worker'
import type { ChartLoadProgress, ChartMeta } from '@/types/chart-worker'

export type ChartDocStatus = 'idle' | 'loading' | 'ready' | 'error' | 'cancelled'

function isCancelledError(err: unknown): boolean {
  return err instanceof Error && err.name === CHART_CANCELLED_ERROR_NAME
}

export interface UseChartDocument {
  status: ChartDocStatus
  meta: ChartMeta | null
  progress: ChartLoadProgress | null
  error: string | null
  paths: PathEntry[]
  loadFile: (file: File, rootPath: JsonPathSegment[]) => Promise<void>
  loadText: (text: string, rootPath: JsonPathSegment[]) => Promise<void>
  setRoot: (rootPath: JsonPathSegment[]) => Promise<void>
  computeChart: (
    xField: string,
    yFields: string[],
    aggregation: Aggregation,
    groupBy: string,
  ) => Promise<ChartResult>
  cancel: () => void
  reset: () => void
}

export function useChartDocument(): UseChartDocument {
  const [status, setStatus] = useState<ChartDocStatus>('idle')
  const [meta, setMeta] = useState<ChartMeta | null>(null)
  const [progress, setProgress] = useState<ChartLoadProgress | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [paths, setPaths] = useState<PathEntry[]>([])
  const docIdRef = useRef<string | null>(null)

  const closeCurrent = useCallback(() => {
    if (docIdRef.current) {
      void getChartWorkerApi().close(docIdRef.current)
      docIdRef.current = null
    }
  }, [])

  const afterLoaded = useCallback(async (id: string, docMeta: ChartMeta) => {
    if (docIdRef.current !== id) return
    setMeta(docMeta)
    setStatus('ready')
    const fetchedPaths = await getChartWorkerApi().getPaths(id)
    if (docIdRef.current === id) setPaths(fetchedPaths)
  }, [])

  const loadFile = useCallback(
    async (file: File, rootPath: JsonPathSegment[]) => {
      closeCurrent()
      const id = crypto.randomUUID()
      docIdRef.current = id
      setStatus('loading')
      setError(null)
      setProgress(null)
      setMeta(null)
      setPaths([])
      try {
        const onProgress = Comlink.proxy((p: ChartLoadProgress) => setProgress(p))
        const docMeta = await getChartWorkerApi().loadFile(id, file, rootPath, onProgress)
        await afterLoaded(id, docMeta)
      } catch (err) {
        if (docIdRef.current !== id) return
        if (isCancelledError(err)) setStatus('cancelled')
        else {
          setStatus('error')
          setError(err instanceof Error ? err.message : String(err))
        }
      }
    },
    [closeCurrent, afterLoaded],
  )

  const loadText = useCallback(
    async (text: string, rootPath: JsonPathSegment[]) => {
      closeCurrent()
      const id = crypto.randomUUID()
      docIdRef.current = id
      setStatus('loading')
      setError(null)
      setProgress(null)
      setMeta(null)
      setPaths([])
      try {
        const docMeta = await getChartWorkerApi().loadText(id, text, rootPath)
        await afterLoaded(id, docMeta)
      } catch (err) {
        if (docIdRef.current !== id) return
        setStatus('error')
        setError(err instanceof Error ? err.message : String(err))
      }
    },
    [closeCurrent, afterLoaded],
  )

  const setRoot = useCallback(async (rootPath: JsonPathSegment[]) => {
    const id = docIdRef.current
    if (!id) return
    const docMeta = await getChartWorkerApi().setRoot(id, rootPath)
    if (docIdRef.current === id) setMeta(docMeta)
  }, [])

  const computeChart = useCallback(
    (xField: string, yFields: string[], aggregation: Aggregation, groupBy: string): Promise<ChartResult> => {
      const id = docIdRef.current
      if (!id) return Promise.resolve({ data: [], seriesKeys: [] })
      return getChartWorkerApi().computeChart(id, xField, yFields, aggregation, groupBy)
    },
    [],
  )

  const cancel = useCallback(() => {
    if (docIdRef.current) getChartWorkerApi().cancel(docIdRef.current)
  }, [])

  const reset = useCallback(() => {
    closeCurrent()
    setStatus('idle')
    setMeta(null)
    setProgress(null)
    setError(null)
    setPaths([])
  }, [closeCurrent])

  return { status, meta, progress, error, paths, loadFile, loadText, setRoot, computeChart, cancel, reset }
}
