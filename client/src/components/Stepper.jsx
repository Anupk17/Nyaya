import React from 'react';
import { Check, Loader2 } from 'lucide-react';

const STEPS = [
  { label: 'Dispute Filed', number: 1 },
  { label: 'Evidence Gathered', number: 2 },
  { label: 'Agents Argue', number: 3 },
  { label: 'Verdict Issued', number: 4 }
];

function Stepper({ currentStep = 0, isProcessing = false }) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {STEPS.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep && isProcessing;
          const isUpcoming = index > currentStep || (index === currentStep && !isProcessing);

          return (
            <div key={step.number} className="flex items-center flex-1 last:flex-none">
              {/* Step circle + label */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-500 ${
                    isCompleted
                      ? 'bg-[#F97316] text-white'
                      : isCurrent
                        ? 'bg-[#F97316] text-white ring-4 ring-[#F97316]/20'
                        : 'bg-[#F3F4F6] text-[#94A3B8]'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : isCurrent ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    step.number
                  )}
                </div>
                <span
                  className={`mt-2 text-xs font-medium text-center whitespace-nowrap transition-colors duration-300 ${
                    isCompleted
                      ? 'text-[#F97316]'
                      : isCurrent
                        ? 'text-[#F97316] font-semibold'
                        : 'text-[#6B7280]'
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {index < STEPS.length - 1 && (
                <div className="flex-1 mx-3 mt-[-20px]">
                  <div className="h-0.5 w-full bg-[#F3F4F6] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out ${
                        isCompleted ? 'w-full bg-[#F97316]' : 'w-0 bg-[#F97316]'
                      }`}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Stepper;