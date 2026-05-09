'use client'

import { useReportWebVitals } from 'next/web-vitals'

type ReportWebVitalsCallback = Parameters<typeof useReportWebVitals>[0]
type Metric = Parameters<ReportWebVitalsCallback>[0]

type Attribution = Record<string, unknown>

function getAttributionSummary(metric: Metric): Record<string, unknown> | null {
  const attr = metric.attribution as Attribution | undefined
  if (!attr) return null

  switch (metric.name) {
    case 'LCP':
      return {
        element: attr['element'],
        url: attr['url'],
        timeToFirstByte: attr['timeToFirstByte'],
        resourceLoadDelay: attr['resourceLoadDelay'],
        resourceLoadDuration: attr['resourceLoadDuration'],
        elementRenderDelay: attr['elementRenderDelay'],
      }
    case 'CLS':
      return {
        largestShiftTarget: attr['largestShiftTarget'],
        largestShiftValue: attr['largestShiftValue'],
        largestShiftTime: attr['largestShiftTime'],
      }
    case 'INP':
      return {
        interactionTarget: attr['interactionTarget'],
        interactionType: attr['interactionType'],
        inputDelay: attr['inputDelay'],
        processingDuration: attr['processingDuration'],
        presentationDelay: attr['presentationDelay'],
        loadState: attr['loadState'],
      }
    default:
      return null
  }
}

const handleWebVitals: ReportWebVitalsCallback = (metric) => {
  const attribution = getAttributionSummary(metric)
  const payload = {
    id: metric.id,
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    navigationType: metric.navigationType,
    ...(attribution ? { attribution } : {}),
  }

  if (process.env.NODE_ENV === 'development') {
    const color = metric.rating === 'good' ? 'color:green' : metric.rating === 'needs-improvement' ? 'color:orange' : 'color:red'
    console.groupCollapsed(`%c[WebVitals] ${metric.name}: ${metric.value.toFixed(1)} (${metric.rating})`, color)
    if (attribution) console.table(attribution)
    console.log(payload)
    console.groupEnd()
    return
  }

  const body = JSON.stringify(payload)
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/web-vitals', body)
  } else {
    fetch('/api/web-vitals', { body, method: 'POST', keepalive: true })
  }
}

export function WebVitals() {
  useReportWebVitals(handleWebVitals)
  return null
}
