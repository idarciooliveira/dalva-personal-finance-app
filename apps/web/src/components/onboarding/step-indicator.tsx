import { Check } from "lucide-react";

export function StepIndicator({
  currentStep,
  totalSteps,
}: {
  currentStep: number;
  totalSteps: number;
}) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: totalSteps }, (_, i) => {
        const stepNum = i + 1;
        const isActive = stepNum === currentStep;
        const isCompleted = stepNum < currentStep;
        return (
          <div
            key={stepNum}
            className={`flex size-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
              isActive
                ? "bg-accent text-accent-foreground"
                : isCompleted
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            {isCompleted ? <Check className="size-4" /> : stepNum}
          </div>
        );
      })}
    </div>
  );
}
