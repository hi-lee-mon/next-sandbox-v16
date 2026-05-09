import { onCLS, onINP, onLCP } from 'web-vitals/attribution'
import { onFCP, onTTFB } from 'web-vitals'
import type {
  CLSMetricWithAttribution,
  INPMetricWithAttribution,
  LCPMetricWithAttribution,
} from 'web-vitals/attribution'
import type { FCPMetric, TTFBMetric } from 'web-vitals'

type CoreMetric = CLSMetricWithAttribution | INPMetricWithAttribution | LCPMetricWithAttribution
type DiagnosticMetric = FCPMetric | TTFBMetric

function buildPayload(metric: CoreMetric | DiagnosticMetric) {
  const base = {
    id: metric.id,
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    navigationType: metric.navigationType,
  }

  if (!('attribution' in metric)) return base

  switch (metric.name) {
    case 'LCP': {
      const a = metric.attribution
      return { ...base, attribution: { target: a.target, url: a.url, timeToFirstByte: a.timeToFirstByte, resourceLoadDelay: a.resourceLoadDelay, resourceLoadDuration: a.resourceLoadDuration, elementRenderDelay: a.elementRenderDelay } }
    }
    case 'CLS': {
      const a = metric.attribution
      return { ...base, attribution: { largestShiftTarget: a.largestShiftTarget, largestShiftValue: a.largestShiftValue, largestShiftTime: a.largestShiftTime, loadState: a.loadState } }
    }
    case 'INP': {
      const a = metric.attribution
      return { ...base, attribution: { interactionTarget: a.interactionTarget, interactionType: a.interactionType, inputDelay: a.inputDelay, processingDuration: a.processingDuration, presentationDelay: a.presentationDelay, loadState: a.loadState } }
    }
  }
}

function report(metric: CoreMetric | DiagnosticMetric) {
  const payload = buildPayload(metric)

  if (process.env.NODE_ENV === 'development') {
    const style = metric.rating === 'good' ? 'color:green' : metric.rating === 'needs-improvement' ? 'color:orange' : 'color:red'
    console.groupCollapsed(`%c[WebVitals] ${metric.name}: ${metric.value.toFixed(1)} (${metric.rating})`, style)
    if (payload && 'attribution' in payload && payload.attribution) {
      console.table(payload.attribution)
    }
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

onLCP(report)
onCLS(report)
onINP(report)
onFCP(report)
onTTFB(report)
