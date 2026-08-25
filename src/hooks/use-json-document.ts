import * as Comlink from 'comlink'
import { useCallback, useEffect, useRef, useState } from 'react'
import { getJsonDocApi } from '@/lib/json-doc-client'
import { DOC_CANCELLED_ERROR_NAME } from '@/types/json-doc'
import type { ChildPage, DocMeta, JsonPathSegment, LoadProgress } from '@/types/json-doc'

export type DocStatus = 'idle' | 'loading' | 'ready' | 'error' | 'cancelled'

function isCancelledError(err: unknown): boolean {
  return err instanceof Error && err.name === DOC_CANCELLED_ERROR_NAME
}

export interface UseJsonDocument {
  status: DocStatus
  meta: DocMeta | null
  progress: LoadProgress | null
  error: string | null
  loadFile: (file: File) => Promise<void>
  loadText: (text: string) => Promise<void>
  cancel: () => void
  reset: () => void
  getChildren: (path: JsonPathSegment[], offset: number, limit: number) => Promise<ChildPage>
}

export function useJsonDocument(): UseJsonDocument {
  const [status, setStatus] = useState<DocStatus>('idle')
  const [meta, setMeta] = useState<DocMeta | null>(null)
  const [progress, setProgress] = useState<LoadProgress | null>(null)
  const [error, setError] = useState<string | null>(null)
  const docIdRef = useRef<string | null>(null)

  const closeCurrent = useCallback(() => {
    if (docIdRef.current) {
      void getJsonDocApi().close(docIdRef.current)
      docIdRef.current = null
    }
  }, [])

  useEffect(() => closeCurrent, [closeCurrent])

  const loadFile = useCallback(
    async (file: File) => {
      closeCurrent()
      const id = crypto.randomUUID()
      docIdRef.current = id
      setStatus('loading')
      setError(null)
      setProgress(null)
      setMeta(null)
      try {
        const onProgress = Comlink.proxy((p: LoadProgress) => setProgress(p))
        const docMeta = await getJsonDocApi().openFile(id, file, onProgress)
        if (docIdRef.current !== id) return // a newer load superseded this one
        setMeta(docMeta)
        setStatus('ready')
      } catch (err) {
        if (docIdRef.current !== id) return
        if (isCancelledError(err)) {
          setStatus('cancelled')
        } else {
          setStatus('error')
          setError(err instanceof Error ? err.message : String(err))
        }
      }
    },
    [closeCurrent],
  )

  const loadText = useCallback(
    async (text: string) => {
      closeCurrent()
      const id = crypto.randomUUID()
      docIdRef.current = id
      setStatus('loading')
      setError(null)
      setProgress(null)
      setMeta(null)
      try {
        const docMeta = await getJsonDocApi().openText(id, text)
        if (docIdRef.current !== id) return
        setMeta(docMeta)
        setStatus('ready')
      } catch (err) {
        if (docIdRef.current !== id) return
        setStatus('error')
        setError(err instanceof Error ? err.message : String(err))
      }
    },
    [closeCurrent],
  )

  const cancel = useCallback(() => {
    if (docIdRef.current) getJsonDocApi().cancel(docIdRef.current)
  }, [])

  const reset = useCallback(() => {
    closeCurrent()
    setStatus('idle')
    setMeta(null)
    setProgress(null)
    setError(null)
  }, [closeCurrent])

  const getChildren = useCallback(
    (path: JsonPathSegment[], offset: number, limit: number): Promise<ChildPage> => {
      const id = docIdRef.current
      if (!id) return Promise.resolve({ items: [], total: 0 })
      return getJsonDocApi().getChildren(id, path, offset, limit)
    },
    [],
  )

  return { status, meta, progress, error, loadFile, loadText, cancel, reset, getChildren }
}
