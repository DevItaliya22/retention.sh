"use client";

import { AnimatePresence, motion } from "motion/react";
import * as React from "react";
import type { FieldValues } from "react-hook-form";
import { Form } from "../form";
import { ProgressBar } from "./progress-bar";
import { ProgressStepper } from "./progress-stepper";
import type { LinearMultiStepFormConfig, NavigationArgs } from "./types";
import { useLinearMultiStepForm } from "./use-linear-multi-step-form";

const STEP_SLIDE_PX = 32;
const STEP_TRANSITION_DURATION = 0.25;

export { FormNavigation } from "./form-navigation";
export { ProgressBar } from "./progress-bar";
export { ProgressStepper } from "./progress-stepper";
export { StepContent } from "./step-content";
export { StepError } from "./step-error";
export { StepInput } from "./step-input";

type StepTransitionDirection = "forward" | "backward";

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
  /** Enable slide + fade transition between steps. Default: true */
  animateSteps?: boolean;
}) {
  const msf = useLinearMultiStepForm<TValues>({
    config: props.config,
    initialValues: props.initialValues,
  });

  const StepComponent = msf.currentStep.Component;
  const animateSteps = props.animateSteps !== false;

  const prevStepIndexRef = React.useRef<number | null>(null);
  const directionRef = React.useRef<StepTransitionDirection>("forward");
  if (prevStepIndexRef.current !== msf.currentStepIndex) {
    if (prevStepIndexRef.current !== null) {
      directionRef.current =
        msf.currentStepIndex > prevStepIndexRef.current
          ? "forward"
          : "backward";
    }
    prevStepIndexRef.current = msf.currentStepIndex;
  }
  const stepDirection = directionRef.current;

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

  const isFormControl = (target: EventTarget | null) => {
    if (!target || !(target instanceof HTMLElement)) return false;
    const tagName = target.tagName.toLowerCase();
    const role = target.getAttribute?.("role");
    if (tagName === "textarea" || tagName === "input" || tagName === "select")
      return true;
    if (role === "combobox" || role === "listbox") return true;
    return target.isContentEditable;
  };

  const shouldSkipArrowNav = (target: EventTarget | null) => {
    if (!target || !(target instanceof HTMLElement)) return false;
    if (target.isContentEditable) return true;
    const tagName = target.tagName.toLowerCase();
    if (tagName === "select") return true;
    const role = target.getAttribute?.("role");
    return role === "combobox" || role === "listbox" || role === "spinbutton";
  };

  const msfRef = React.useRef(msf);
  msfRef.current = msf;

  const handleNavKey = React.useCallback(
    (e: {
      key: string;
      shiftKey: boolean;
      target: EventTarget | null;
      preventDefault: () => void;
      stopPropagation: () => void;
    }) => {
      const key = e.key;
      const isNext = (key === "Enter" && !e.shiftKey) || key === "ArrowDown";
      const isPrev = key === "ArrowUp";
      if (!isNext && !isPrev) return;
      if (key === "Enter" && isFormControl(e.target)) return;
      if (
        (key === "ArrowUp" || key === "ArrowDown") &&
        shouldSkipArrowNav(e.target)
      )
        return;
      const current = msfRef.current;
      if (current.isLoading || current.isSubmitting) return;
      if (isPrev) {
        if (!current.isFirstStep) {
          e.preventDefault();
          e.stopPropagation();
          void current.prev();
        }
        return;
      }
      if (isNext) {
        // Arrow Down must not submit the form on last step (avoid accidental submit)
        if (key === "ArrowDown" && current.isLastStep) return;
        e.preventDefault();
        e.stopPropagation();
        void current.next();
      }
    },
    [],
  );

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      handleNavKey(e);
    },
    [handleNavKey],
  );

  React.useEffect(() => {
    const doc = document;
    const handleDocKeyDown = (e: KeyboardEvent) => {
      handleNavKey({
        key: e.key,
        shiftKey: e.shiftKey,
        target: e.target,
        preventDefault: () => e.preventDefault(),
        stopPropagation: () => e.stopPropagation(),
      });
    };
    doc.addEventListener("keydown", handleDocKeyDown, true);
    return () => doc.removeEventListener("keydown", handleDocKeyDown, true);
  }, [handleNavKey]);

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

        <div className="flex flex-1 flex-col overflow-y-auto">
          <div className="relative flex flex-1 justify-center overflow-x-hidden px-4 pt-6 pb-28 sm:px-6 sm:pt-8">
            {animateSteps ? (
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={msf.currentStep.id}
                  initial={{
                    opacity: 0,
                    x:
                      stepDirection === "forward"
                        ? STEP_SLIDE_PX
                        : -STEP_SLIDE_PX,
                  }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{
                    opacity: 0,
                    x:
                      stepDirection === "forward"
                        ? -STEP_SLIDE_PX
                        : STEP_SLIDE_PX,
                  }}
                  transition={{
                    duration: STEP_TRANSITION_DURATION,
                    ease: [0.32, 0.72, 0, 1],
                  }}
                  className="flex w-full max-w-full flex-1 flex-col items-center"
                >
                  <StepComponent
                    formId={msf.formId}
                    stepId={msf.currentStep.id}
                    stepIndex={msf.currentStepIndex}
                    totalSteps={msf.totalSteps}
                    isFirstStep={msf.isFirstStep}
                    isLastStep={msf.isLastStep}
                  />
                </motion.div>
              </AnimatePresence>
            ) : (
              <StepComponent
                formId={msf.formId}
                stepId={msf.currentStep.id}
                stepIndex={msf.currentStepIndex}
                totalSteps={msf.totalSteps}
                isFirstStep={msf.isFirstStep}
                isLastStep={msf.isLastStep}
              />
            )}
          </div>
        </div>

        {/* Navigation: fixed bottom-right */}
        {(props.navigationPosition === "footer" ||
          props.navigationPosition === undefined) &&
          NavigationElement && (
            <div className="fixed right-6 bottom-6 z-20 sm:right-8 sm:bottom-8">
              {NavigationElement}
            </div>
          )}
      </div>
    </Form>
  );
}
