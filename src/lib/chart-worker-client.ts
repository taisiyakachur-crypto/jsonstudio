import * as Comlink from 'comlink'
import type { ChartWorkerApi } from '@/types/chart-worker'

let worker: Worker | undefined
let api: Comlink.Remote<ChartWorkerApi> | undefined

/** Lazily creates a single shared chart worker instance for the lifetime of the page. */
export function getChartWorkerApi(): Comlink.Remote<ChartWorkerApi> {
  if (!api) {
    worker = new Worker(new URL('../workers/chart.worker.ts', import.meta.url), { type: 'module' })
    api = Comlink.wrap<ChartWorkerApi>(worker)
  }
  return api
}
