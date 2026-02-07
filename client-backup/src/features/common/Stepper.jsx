import React from "react";
import { Check } from "lucide-react";

/**
 * Reusable Stepper/Wizard component
 * 
 * @param {Object} props
 * @param {Array} props.steps - Array of step objects with { id, label, description?, icon? }
 * @param {number} props.currentStep - Current active step index (0-based)
 * @param {function} props.onStepClick - Optional callback when clicking completed steps
 * @param {boolean} props.allowClickBack - Allow clicking on completed steps to go back
 */
const Stepper = ({ 
  steps = [], 
  currentStep = 0, 
  onStepClick, 
  allowClickBack = true 
}) => {
  const handleStepClick = (index) => {
    if (allowClickBack && index < currentStep && onStepClick) {
      onStepClick(index);
    }
  };

  return (
    <div className="w-full">
      {/* Desktop View - Horizontal */}
      <div className="hidden md:flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isPending = index > currentStep;

          return (
            <React.Fragment key={step.id || index}>
              {/* Step Circle and Label */}
              <div className="flex flex-col items-center flex-1">
                <button
                  type="button"
                  onClick={() => handleStepClick(index)}
                  disabled={!isCompleted || !allowClickBack}
                  className={`
                    relative flex items-center justify-center w-12 h-12 rounded-full 
                    transition-all duration-300 font-semibold text-lg
                    ${isCompleted 
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white cursor-pointer hover:shadow-lg hover:scale-105" 
                      : isCurrent 
                        ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white ring-4 ring-indigo-200 shadow-lg" 
                        : "bg-gray-200 text-gray-500"
                    }
                    ${isCompleted && allowClickBack ? "cursor-pointer" : "cursor-default"}
                  `}
                >
                  {isCompleted ? (
                    <Check className="w-6 h-6" strokeWidth={3} />
                  ) : step.icon ? (
                    <step.icon className="w-6 h-6" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                  
                  {/* Pulse animation for current step */}
                  {isCurrent && (
                    <span className="absolute inset-0 rounded-full animate-ping bg-indigo-400 opacity-30" />
                  )}
                </button>

                {/* Label */}
                <div className="mt-3 text-center">
                  <p className={`
                    text-sm font-medium transition-colors
                    ${isCompleted 
                      ? "text-emerald-600" 
                      : isCurrent 
                        ? "text-indigo-600" 
                        : "text-gray-400"
                    }
                  `}>
                    {step.label}
                  </p>
                  {step.description && (
                    <p className={`
                      text-xs mt-0.5 transition-colors
                      ${isCurrent ? "text-gray-500" : "text-gray-400"}
                    `}>
                      {step.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="flex-1 mx-2 h-1 -mt-8">
                  <div className="h-full rounded-full bg-gray-200 overflow-hidden">
                    <div 
                      className={`
                        h-full rounded-full transition-all duration-500 ease-out
                        ${index < currentStep 
                          ? "w-full bg-gradient-to-r from-emerald-500 to-teal-500" 
                          : "w-0 bg-indigo-500"
                        }
                      `}
                    />
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Mobile View - Compact Horizontal */}
      <div className="md:hidden">
        {/* Progress indicator */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-gray-500">
            Step {currentStep + 1} of {steps.length}
          </span>
          <span className={`
            text-sm font-semibold
            ${currentStep === steps.length - 1 ? "text-emerald-600" : "text-indigo-600"}
          `}>
            {steps[currentStep]?.label}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Step dots for navigation */}
        <div className="flex items-center justify-center gap-2 mt-4">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;

            return (
              <button
                key={step.id || index}
                type="button"
                onClick={() => handleStepClick(index)}
                disabled={!isCompleted || !allowClickBack}
                className={`
                  w-3 h-3 rounded-full transition-all duration-300
                  ${isCompleted 
                    ? "bg-emerald-500 hover:bg-emerald-600" 
                    : isCurrent 
                      ? "bg-indigo-500 w-6" 
                      : "bg-gray-300"
                  }
                  ${isCompleted && allowClickBack ? "cursor-pointer" : "cursor-default"}
                `}
                title={step.label}
              />
            );
          })}
        </div>

        {/* Description */}
        {steps[currentStep]?.description && (
          <p className="text-center text-xs text-gray-500 mt-2">
            {steps[currentStep].description}
          </p>
        )}
      </div>
    </div>
  );
};

/**
 * Stepper Navigation Buttons Component
 */
export const StepperNavigation = ({ 
  currentStep, 
  totalSteps, 
  onPrev, 
  onNext,
  nextLabel = "Lanjut",
  prevLabel = "Kembali",
  submitLabel = "Simpan",
  isNextDisabled = false,
  isSubmitting = false,
  showPrev = true,
}) => {
  const isLastStep = currentStep === totalSteps - 1;

  return (
    <div className="flex items-center justify-between pt-6 border-t border-gray-200">
      <div>
        {showPrev && currentStep > 0 && (
          <button
            type="button"
            onClick={onPrev}
            disabled={isSubmitting}
            className="px-5 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {prevLabel}
          </button>
        )}
      </div>

      <button
        type={isLastStep ? "submit" : "button"}
        onClick={!isLastStep ? onNext : undefined}
        disabled={isNextDisabled || isSubmitting}
        className={`
          px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-all
          ${isLastStep 
            ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-lg" 
            : "bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:shadow-lg"
          }
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        {isSubmitting ? (
          <>
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Menyimpan...
          </>
        ) : (
          <>
            {isLastStep ? submitLabel : nextLabel}
            {!isLastStep && (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </>
        )}
      </button>
    </div>
  );
};

export default Stepper;
