'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { ChevronRight, ArrowLeft } from 'lucide-react'
import StepGrid from './StepGrid'
import ResultPanel from './ResultPanel'
import type { WizardOption, WizardStepData, BuilderResult, StepName } from '@/app/api/builder/route'
import { MODEL_DISPLAY_NAMES } from '@/types/database'

// ── Step config ───────────────────────────────────────────────────────────────

interface StepConfig {
  key: StepName
  title: string
  question: string
  cols: 2 | 3
  imageCount: 1 | 2
  isModelStep?: boolean
}

const STEPS: StepConfig[] = [
  { key: 'category',     title: 'Category',      question: 'What are you creating?',  cols: 2, imageCount: 1 },
  { key: 'visual_style', title: 'Visual Style',   question: 'What style?',             cols: 3, imageCount: 2 },
  { key: 'lighting',     title: 'Lighting',       question: 'What lighting?',          cols: 3, imageCount: 2 },
  { key: 'mood',         title: 'Mood',           question: 'What mood?',              cols: 3, imageCount: 2 },
  { key: 'composition',  title: 'Composition',    question: 'What framing?',           cols: 3, imageCount: 2 },
  { key: 'model',        title: 'Model',          question: 'Which model?',            cols: 3, imageCount: 2, isModelStep: true },
]

function displayValue(key: StepName, value: string) {
  if (key === 'model') return MODEL_DISPLAY_NAMES[value] ?? value
  return value
}

// ── Progress bar ──────────────────────────────────────────────────────────────

function ProgressBar({ currentStep, total }: { currentStep: number; total: number }) {
  return (
    <div className="flex items-center gap-1 mb-8">
      {STEPS.map((step, i) => (
        <div key={step.key} className="flex items-center gap-1 flex-1">
          <div className="flex-1">
            <div className="flex items-center gap-1.5 mb-1">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-all duration-300
                ${i < currentStep ? 'bg-violet-600 text-white' : i === currentStep ? 'bg-violet-600 text-white ring-2 ring-violet-400/40' : 'bg-zinc-800 text-zinc-500'}`}>
                {i < currentStep ? '✓' : i + 1}
              </div>
              <span className={`text-[11px] font-medium transition-colors hidden sm:block ${i === currentStep ? 'text-violet-300' : i < currentStep ? 'text-zinc-400' : 'text-zinc-600'}`}>
                {step.title}
              </span>
            </div>
            <div className={`h-0.5 rounded-full transition-all duration-500 ${i < currentStep ? 'bg-violet-600' : i === currentStep ? 'bg-violet-600/50' : 'bg-zinc-800'}`} />
          </div>
          {i < total - 1 && <ChevronRight className="w-3 h-3 text-zinc-700 shrink-0 mb-1" />}
        </div>
      ))}
    </div>
  )
}

// ── Breadcrumb ────────────────────────────────────────────────────────────────

function Breadcrumb({ selections, steps }: { selections: Record<string, string>; steps: typeof STEPS }) {
  const crumbs = steps
    .filter((s) => selections[s.key])
    .map((s) => displayValue(s.key, selections[s.key]))

  if (crumbs.length === 0) return null

  return (
    <div className="flex items-center gap-1 flex-wrap text-xs text-zinc-500 mb-6 bg-zinc-900/60 border border-zinc-800 rounded-lg px-3 py-2">
      {crumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-1">
          <span className={i === crumbs.length - 1 ? 'text-violet-300 font-medium' : 'text-zinc-400'}>{crumb}</span>
          {i < crumbs.length - 1 && <ChevronRight className="w-3 h-3 text-zinc-600 shrink-0" />}
        </span>
      ))}
    </div>
  )
}

// ── Main wizard ───────────────────────────────────────────────────────────────

export default function WizardClient() {
  const [currentStep, setCurrentStep] = useState(0)
  const [selections, setSelections] = useState<Record<string, string>>({})
  const [stepData, setStepData] = useState<WizardOption[]>([])
  const [stepLoading, setStepLoading] = useState(true)
  const [direction, setDirection] = useState<'forward' | 'back'>('forward')
  const [animating, setAnimating] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [results, setResults] = useState<BuilderResult | null>(null)
  const [resultsLoading, setResultsLoading] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  const fetchStep = useCallback(async (stepIdx: number, sels: Record<string, string>) => {
    setStepLoading(true)
    try {
      const res = await fetch('/api/builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'step', step: STEPS[stepIdx].key, selections: sels }),
      })
      const data = (await res.json()) as WizardStepData
      setStepData(data.options ?? [])
    } catch (e) {
      console.error('Failed to load step:', e)
    } finally {
      setStepLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStep(0, {})
  }, [fetchStep])

  const goToStep = useCallback((nextStep: number, newSelections: Record<string, string>, dir: 'forward' | 'back') => {
    if (animating) return
    setDirection(dir)
    setAnimating(true)
    setTimeout(() => {
      setCurrentStep(nextStep)
      setSelections(newSelections)
      fetchStep(nextStep, newSelections)
      setAnimating(false)
      contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 200)
  }, [animating, fetchStep])

  const handleSelect = useCallback((value: string) => {
    const stepKey = STEPS[currentStep].key
    const newSelections = { ...selections, [stepKey]: value }

    if (currentStep < STEPS.length - 1) {
      goToStep(currentStep + 1, newSelections, 'forward')
    } else {
      // Last step — fetch results
      setSelections(newSelections)
      setResultsLoading(true)
      setShowResults(true)
      fetch('/api/builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'results', selections: newSelections }),
      })
        .then((r) => r.json())
        .then((data: BuilderResult) => setResults(data))
        .catch(console.error)
        .finally(() => setResultsLoading(false))
      contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [currentStep, selections, goToStep])

  const handleBack = useCallback(() => {
    if (showResults) {
      setShowResults(false)
      setResults(null)
      // Stay on last step with current selections intact
      fetchStep(STEPS.length - 1, selections)
    } else if (currentStep > 0) {
      const prevSelections = { ...selections }
      delete prevSelections[STEPS[currentStep].key]
      goToStep(currentStep - 1, prevSelections, 'back')
    }
  }, [showResults, currentStep, selections, goToStep, fetchStep])

  const handleReset = useCallback(() => {
    setShowResults(false)
    setResults(null)
    setSelections({})
    setCurrentStep(0)
    setDirection('forward')
    fetchStep(0, {})
    contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [fetchStep])

  const currentConfig = STEPS[currentStep]
  const currentSelection = selections[currentConfig?.key] ?? ''

  // Slide animation classes
  const slideClass = animating
    ? direction === 'forward' ? 'opacity-0 translate-x-4' : 'opacity-0 -translate-x-4'
    : 'opacity-100 translate-x-0'

  return (
    <div ref={contentRef} className="scroll-mt-20">
      {!showResults ? (
        <>
          {/* Progress */}
          <ProgressBar currentStep={currentStep} total={STEPS.length} />

          {/* Breadcrumb */}
          <Breadcrumb selections={selections} steps={STEPS} />

          {/* Step header */}
          <div className={`transition-all duration-200 ${slideClass}`}>
            <div className="flex items-center gap-3 mb-6">
              {currentStep > 0 && (
                <button
                  onClick={handleBack}
                  className="flex items-center gap-1 text-sm text-zinc-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
              )}
              <div>
                <p className="text-xs font-bold text-violet-400 uppercase tracking-widest mb-0.5">
                  Step {currentStep + 1} of {STEPS.length} — {currentConfig.title}
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold text-white">{currentConfig.question}</h2>
              </div>
            </div>

            <StepGrid
              options={stepData}
              selected={currentSelection}
              onSelect={handleSelect}
              loading={stepLoading}
              cols={currentConfig.cols}
              imageCount={currentConfig.imageCount}
              isModelStep={currentConfig.isModelStep}
            />
          </div>
        </>
      ) : (
        <div className="animate-in fade-in duration-300">
          {/* Back button above results */}
          <button
            onClick={handleBack}
            className="flex items-center gap-1 text-sm text-zinc-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Change model
          </button>

          {resultsLoading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4 text-zinc-500">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-2 border-violet-600/20" />
                <div className="absolute inset-0 rounded-full border-2 border-t-violet-500 animate-spin" />
              </div>
              <p className="text-sm">Finding your best matching prompts…</p>
            </div>
          ) : (
            <ResultPanel
              prompts={results?.prompts ?? []}
              relaxedLevel={results?.relaxedLevel ?? 0}
              selections={selections}
              onReset={handleReset}
            />
          )}
        </div>
      )}
    </div>
  )
}
