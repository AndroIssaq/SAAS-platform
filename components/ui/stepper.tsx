"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export interface Step {
  id: string
  title: string
  description?: string
}

interface StepperProps {
  steps: Step[]
  currentStep: number
  className?: string
}

export function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const stepNumber = index + 1
          const isCompleted = stepNumber < currentStep
          const isCurrent = stepNumber === currentStep
          const isUpcoming = stepNumber > currentStep

          return (
            <div key={step.id} className="flex items-center flex-1">
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200",
                    {
                      "bg-primary border-primary text-primary-foreground": isCompleted,
                      "bg-primary border-primary text-primary-foreground ring-4 ring-primary/20": isCurrent,
                      "bg-background border-muted-foreground/30 text-muted-foreground": isUpcoming,
                    }
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-semibold">{stepNumber}</span>
                  )}
                </div>

                {/* Step Label */}
                <div className="mt-2 text-center">
                  <p
                    className={cn("text-sm font-medium", {
                      "text-primary": isCurrent,
                      "text-foreground": isCompleted,
                      "text-muted-foreground": isUpcoming,
                    })}
                  >
                    {step.title}
                  </p>
                  {step.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 max-w-[120px]">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-2 transition-all duration-200",
                    {
                      "bg-primary": stepNumber < currentStep,
                      "bg-muted-foreground/30": stepNumber >= currentStep,
                    }
                  )}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Mobile-friendly vertical stepper
export function VerticalStepper({ steps, currentStep, className }: StepperProps) {
  return (
    <div className={cn("w-full space-y-4", className)}>
      {steps.map((step, index) => {
        const stepNumber = index + 1
        const isCompleted = stepNumber < currentStep
        const isCurrent = stepNumber === currentStep
        const isUpcoming = stepNumber > currentStep

        return (
          <div key={step.id} className="flex gap-4">
            {/* Step Circle and Line */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200 shrink-0",
                  {
                    "bg-primary border-primary text-primary-foreground": isCompleted,
                    "bg-primary border-primary text-primary-foreground ring-4 ring-primary/20": isCurrent,
                    "bg-background border-muted-foreground/30 text-muted-foreground": isUpcoming,
                  }
                )}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-semibold">{stepNumber}</span>
                )}
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "w-0.5 flex-1 min-h-[40px] transition-all duration-200",
                    {
                      "bg-primary": stepNumber < currentStep,
                      "bg-muted-foreground/30": stepNumber >= currentStep,
                    }
                  )}
                />
              )}
            </div>

            {/* Step Content */}
            <div className="flex-1 pb-8">
              <h3
                className={cn("text-base font-semibold", {
                  "text-primary": isCurrent,
                  "text-foreground": isCompleted,
                  "text-muted-foreground": isUpcoming,
                })}
              >
                {step.title}
              </h3>
              {step.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {step.description}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
