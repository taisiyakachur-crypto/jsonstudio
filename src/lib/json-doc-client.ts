import * as Comlink from 'comlink'
import type { JsonDocWorkerApi } from '@/types/json-doc'

let worker: Worker | undefined
let api: Comlink.Remote<JsonDocWorkerApi> | undefined

/** Lazily creates a single shared worker instance for the lifetime of the page. */
export function getJsonDocApi(): Comlink.Remote<JsonDocWorkerApi> {
  if (!api) {
    worker = new Worker(new URL('../workers/json-doc.worker.ts', import.meta.url), {
      type: 'module',
    })
    api = Comlink.wrap<JsonDocWorkerApi>(worker)
  }
  return api
}
