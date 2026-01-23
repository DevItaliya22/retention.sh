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
        />
      )
    ) : null;

  return (
    <Form {...(msf.form as any)}>
      <div className="grid gap-6">
        {ProgressElement}
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
