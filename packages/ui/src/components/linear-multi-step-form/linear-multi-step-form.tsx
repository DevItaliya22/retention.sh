"use client";

import * as React from "react";
import { Form } from "../form";
import type { FieldValues } from "react-hook-form";
import { useLinearMultiStepForm } from "./use-linear-multi-step-form";
import type { LinearMultiStepFormConfig, NavigationArgs } from "./types";
import { ProgressStepper } from "./progress-stepper";

export { FormNavigation } from "./form-navigation";
export { ProgressStepper } from "./progress-stepper";


export function LinearMultiStepForm<TValues extends FieldValues>(props: {
  config: LinearMultiStepFormConfig<TValues>;
  initialValues?: Partial<TValues>;
  navigationPosition?: "header" | "footer";
  NavigationComponent?: React.ComponentType<NavigationArgs & { allValues: TValues }>;
  showProgressStepper?: boolean;
  ProgressStepperComponent?: React.ComponentType<NavigationArgs & { allValues: TValues; steps: typeof props.config.steps }>;
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

  const ProgressStepperElement = props.showProgressStepper ? (
    props.ProgressStepperComponent ? (
      <props.ProgressStepperComponent {...navigationArgs} steps={props.config.steps} />
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
  ) : null;

  return (
    <Form {...(msf.form as any)}>
      <div className="grid gap-6">
        {ProgressStepperElement}
        {props.navigationPosition === "header" && NavigationElement}
        <StepComponent
          formId={msf.formId}
          stepId={msf.currentStep.id}
          stepIndex={msf.currentStepIndex}
          isFirstStep={msf.isFirstStep}
          isLastStep={msf.isLastStep}
        />
        {props.navigationPosition === "footer" && NavigationElement}
      </div>
    </Form>
  );
}
