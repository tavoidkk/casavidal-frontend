interface StepperProps {
  steps: { id: string; name: string }[];
  currentStep: number;
}

export function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <nav aria-label="Progress">
      <ol role="list" className="flex items-center gap-6 text-sm">
        {steps.map((step, stepIdx) => {
          const isCurrent = stepIdx === currentStep;
          const isDone = stepIdx < currentStep;
          return (
            <li key={step.id} className="flex items-center gap-2">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs font-medium ${
                  isDone
                    ? 'border-primary-600 text-primary-600'
                    : isCurrent
                      ? 'border-gray-900 text-gray-900'
                      : 'border-gray-300 text-gray-400'
                }`}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {stepIdx + 1}
              </span>
              <span className={`${isCurrent ? 'text-gray-900' : 'text-gray-500'}`}>{step.name}</span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
