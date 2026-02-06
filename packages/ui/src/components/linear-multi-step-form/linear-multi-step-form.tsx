"use client";

import * as React from "react";
import type { FieldValues } from "react-hook-form";
import { Form } from "../form";
import { ProgressBar } from "./progress-bar";
import { ProgressStepper } from "./progress-stepper";
import type { LinearMultiStepFormConfig, NavigationArgs } from "./types";
import { useLinearMultiStepForm } from "./use-linear-multi-step-form";

export { FormNavigation } from "./form-navigation";
export { ProgressBar } from "./progress-bar";
export { ProgressStepper } from "./progress-stepper";
export { StepContent } from "./step-content";
export { StepInput } from "./step-input";
export { StepError } from "./step-error";

export function LinearMultiStepForm<TValues extends FieldValues>(props: {
  config: LinearMultiStepFormConfig<TValues>;
  initialValues?: Partial<TValues>;
  navigationPosition?: "header" | "footer";
  NavigationComponent?: React.ComponentType<
    NavigationArgs & { allValues: TValues }
  >;
  progressType?: "stepper" | "bar" | "none";
  ProgressStepperComponent?: React.ComponentType<
    NavigationArgs & { allValues: TValues; steps: typeof props.config.steps }
  >;
  ProgressBarComponent?: React.ComponentType<
    NavigationArgs & { allValues: TValues }
  >;
  showProgressStepper?: boolean;
}) {
  const msf = useLinearMultiStepForm<TValues>({
    config: props.config,
    initialValues: props.initialValues,
  });

  const StepComponent = msf.currentStep.Component;

  const navigationArgs: NavigationArgs & { allValues: TValues } = {
    next: msf.next,
    prev: msf.prev,
    currentStepIndex: msf.currentStepIndex,
    totalSteps: msf.totalSteps,
    isFirstStep: msf.isFirstStep,
    isLastStep: msf.isLastStep,
    isCurrentStepChanged: msf.isCurrentStepChanged,
    allValues: msf.allValues,
    isLoading: msf.isLoading,
    isSubmitting: msf.isSubmitting,
    isLoadingNext: msf.isLoadingNext,
    isLoadingPrev: msf.isLoadingPrev,
    isNextDisabled: msf.isNextDisabled,
    isPrevDisabled: msf.isPrevDisabled,
    progress: msf.progress,
    getStepStatus: msf.getStepStatus,
    getStepError: msf.getStepError,
    isStepRequired: msf.isStepRequired,
    isStepAccessible: msf.isStepAccessible,
    goToStep: msf.goToStep,
  };

  const NavigationElement = props.NavigationComponent ? (
    <props.NavigationComponent {...navigationArgs} />
  ) : null;

  const progressType =
    props.progressType ?? (props.showProgressStepper ? "stepper" : "none");

  const ProgressElement =
    progressType === "stepper" ? (
      props.ProgressStepperComponent ? (
        <props.ProgressStepperComponent
          {...navigationArgs}
          steps={props.config.steps}
        />
      ) : (
        <ProgressStepper
          steps={props.config.steps}
          currentStepIndex={msf.currentStepIndex}
          totalSteps={msf.totalSteps}
          getStepStatus={msf.getStepStatus}
          getStepError={msf.getStepError}
          isStepRequired={msf.isStepRequired}
          isStepAccessible={msf.isStepAccessible}
          goToStep={msf.goToStep}
        />
      )
    ) : progressType === "bar" ? (
      props.ProgressBarComponent ? (
        <props.ProgressBarComponent {...navigationArgs} />
      ) : (
        <ProgressBar
          currentStepIndex={msf.currentStepIndex}
          totalSteps={msf.totalSteps}
          progress={msf.progress}
          variant="minimal"
        />
      )
    ) : null;

  // Enter always calls next(). next() runs validateStep() which sets
  // form errors when validation fails, so the user sees WHY they can't proceed.
  // next() will NOT advance if validation fails — it returns false.
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key !== "Enter" || e.shiftKey) return;
      const target = e.target;
      if (target instanceof HTMLTextAreaElement) return;
      e.preventDefault();
      e.stopPropagation();
      if (!msf.isLoading && !msf.isSubmitting) {
        void msf.next();
      }
    },
    [msf],
  );

  const msfRef = React.useRef(msf);
  msfRef.current = msf;
  React.useEffect(() => {
    const doc = document;
    const handleDocKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || e.shiftKey) return;
      const target = e.target as Node | null;
      if (target instanceof HTMLTextAreaElement) return;
      e.preventDefault();
      e.stopPropagation();
      const current = msfRef.current;
      if (!current.isLoading && !current.isSubmitting) {
        void current.next();
      }
    };
    doc.addEventListener("keydown", handleDocKeyDown, true);
    return () => doc.removeEventListener("keydown", handleDocKeyDown, true);
  }, []);

  return (
    <Form {...(msf.form as any)}>
      <div
        className="relative flex h-full min-h-[inherit] flex-col"
        onKeyDown={handleKeyDown}
        role="presentation"
      >
        {/* Progress bar pinned at top */}
        {progressType !== "none" && ProgressElement && (
          <div className="sticky top-0 z-10 w-full shrink-0">
            {ProgressElement}
          </div>
        )}

        {props.navigationPosition === "header" && NavigationElement && (
          <div className="shrink-0 px-4 py-4">{NavigationElement}</div>
        )}

        {/* Scrollable content area - vertically centers the step */}
        <div className="flex flex-1 flex-col overflow-y-auto">
          <div className="flex flex-1 items-center justify-center px-4 py-12 pb-28 sm:px-6">
            <StepComponent
              formId={msf.formId}
              stepId={msf.currentStep.id}
              stepIndex={msf.currentStepIndex}
              totalSteps={msf.totalSteps}
              isFirstStep={msf.isFirstStep}
              isLastStep={msf.isLastStep}
            />
          </div>
        </div>

        {/* Navigation: fixed bottom-right */}
        {(props.navigationPosition === "footer" ||
          props.navigationPosition === undefined) &&
          NavigationElement && (
            <div className="fixed bottom-6 right-6 z-20 sm:bottom-8 sm:right-8">
              {NavigationElement}
            </div>
          )}
      </div>
    </Form>
  );
}
