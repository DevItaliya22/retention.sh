import type { z } from "zod";
import type React from "react";

export type LinearMultiStepFormId = string;
export type LinearMultiStepFormStepId = string;

export type LinearMultiStepFormStepConfig<TValues extends Record<string, any>> =
  {
    id: LinearMultiStepFormStepId;
    title?: string;
    description?: string;
    fields?: string[];
    schema?: z.ZodTypeAny;
    onStepSubmit?: (args: {
      formId: LinearMultiStepFormId;
      stepId: LinearMultiStepFormStepId;
      stepIndex: number;
      values: TValues;
      stepPayload: unknown;
    }) => Promise<void> | void;
    Component: React.ComponentType<{
      formId: LinearMultiStepFormId;
      stepId: LinearMultiStepFormStepId;
      stepIndex: number;
      isFirstStep: boolean;
      isLastStep: boolean;
    }>;
  };

export type NavigationArgs = {
  next: () => Promise<boolean>;
  prev: () => Promise<void>;
  currentStepIndex: number;
  totalSteps: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  isCurrentStepChanged: boolean;
  allValues: any;
  isLoading: boolean;
  isSubmitting: boolean;
  isLoadingNext: boolean;
  isLoadingPrev: boolean;
  progress: number;
  getStepStatus: (stepIndex: number) => "complete" | "current" | "pending" | "invalid";
  getStepError: (stepIndex: number) => string | null;
  isStepRequired: (stepIndex: number) => boolean;
  isStepAccessible: (stepIndex: number) => boolean;
  goToStep: (stepIndex: number) => void;
};

export type LinearMultiStepFormConfig<TValues extends Record<string, any>> = {
  id: LinearMultiStepFormId;
  title?: string;
  storageKey?: string;
  steps: LinearMultiStepFormStepConfig<TValues>[];
  onSubmit?: (args: {
    formId: LinearMultiStepFormId;
    values: TValues;
  }) => Promise<void> | void;
};
