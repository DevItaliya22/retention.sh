"use client";

import * as React from "react";
import { useForm, type FieldPath, type FieldValues } from "react-hook-form";
import type { ZodError, z } from "zod";
import { useLinearMultiStepFormStore } from "./store";
import type {
  LinearMultiStepFormConfig,
  LinearMultiStepFormStepConfig,
} from "./types";
import { pickByPaths, stableSerialize } from "./utils";

type AnyValues = Record<string, any>;

function applyZodErrorsToForm<TValues extends FieldValues>(args: {
  error: ZodError;
  setError: (name: any, error: any) => void;
}) {
  for (const issue of args.error.issues) {
    const path = issue.path.filter((p) => typeof p === "string").join(".");
    if (!path) continue;
    args.setError(path as FieldPath<TValues>, {
      type: "zod",
      message: issue.message,
    });
  }
}

function getStepPayload<TValues extends AnyValues>(
  values: TValues,
  step: LinearMultiStepFormStepConfig<TValues>,
) {
  if (step.fields?.length) return pickByPaths(values, step.fields);
  return values;
}

export function useLinearMultiStepForm<TValues extends AnyValues>(args: {
  config: LinearMultiStepFormConfig<TValues>;
  initialValues?: Partial<TValues>;
}) {
  const { config } = args;
  const configRef = React.useRef(config);
  const initialValuesRef = React.useRef(args.initialValues);

  React.useEffect(() => {
    configRef.current = config;
    initialValuesRef.current = args.initialValues;
  }, [config, args.initialValues]);

  const storageKey = config.storageKey ?? "reelo.linearMultiStepForms.v1";

  const [loadingAction, setLoadingAction] = React.useState<
    "next" | "prev" | "submit" | null
  >(null);

  const initForm = useLinearMultiStepFormStore((s) => s.initForm);
  const setCurrentStepIndex = useLinearMultiStepFormStore(
    (s) => s.setCurrentStepIndex,
  );
  const visitStep = useLinearMultiStepFormStore((s) => s.visitStep);
  const commitStep = useLinearMultiStepFormStore((s) => s.commitStep);
  const setValues = useLinearMultiStepFormStore((s) => s.setValues);
  const mergeValues = useLinearMultiStepFormStore((s) => s.mergeValues);

  const formState = useLinearMultiStepFormStore((s) => s.forms[config.id]);

  React.useEffect(() => {
    initForm({
      formId: config.id,
      initialValues: (initialValuesRef.current ?? {}) as Record<string, any>,
    });
  }, [config.id, initForm]);

  const steps = config.steps;
  const totalSteps = steps.length;

  const currentStepIndex = formState?.currentStepIndex ?? 0;
  const currentStep = steps[currentStepIndex]!;

  const form = useForm<TValues>({
    mode: "onChange",
    defaultValues: (formState?.values ?? args.initialValues ?? {}) as any,
  });

  React.useEffect(() => {
    if (!formState) return;
    form.reset(formState.values as any);
  }, [formState?.values]);

  React.useEffect(() => {
    if (!currentStep) return;
    visitStep({ formId: config.id, stepId: currentStep.id });
  }, [config.id, currentStep?.id, visitStep]);

  const values = form.watch() as TValues;

  const stepCommittedSnapshot =
    formState?.steps?.[currentStep.id]?.committedSnapshot;

  const stepPayload = React.useMemo(
    () => getStepPayload(values, currentStep),
    [values, currentStep],
  );

  const stepCurrentSnapshot = React.useMemo(
    () => stableSerialize(stepPayload),
    [stepPayload],
  );

  const initialStepSnapshot = React.useMemo(() => {
    const initialPayload = getStepPayload(
      (formState?.values ?? {}) as TValues,
      currentStep,
    );
    return stableSerialize(initialPayload);
  }, [formState?.values, currentStep]);

  const isCurrentStepChanged = React.useMemo(
    () =>
      stepCommittedSnapshot != null
        ? stepCommittedSnapshot !== stepCurrentSnapshot
        : stepCurrentSnapshot !== initialStepSnapshot,
    [stepCommittedSnapshot, stepCurrentSnapshot, initialStepSnapshot],
  );

  const isStepChanged = React.useCallback(
    (stepId: string) => {
      const step = steps.find((s) => s.id === stepId);
      if (!step) return false;
      const committed = formState?.steps?.[stepId]?.committedSnapshot;
      const payload = getStepPayload(values, step);
      const snap = stableSerialize(payload);
      if (committed == null) {
        const initialPayload = getStepPayload(
          (formState?.values ?? {}) as TValues,
          step,
        );
        return snap !== stableSerialize(initialPayload);
      }
      return committed !== snap;
    },
    [steps, formState?.steps, formState?.values, values],
  );

  const goToStep = React.useCallback(
    (idx: number) => {
      const currentConfig = configRef.current;
      const nextIdx = Math.max(0, Math.min(totalSteps - 1, idx));
      setValues({ formId: currentConfig.id, values: values as any });
      setCurrentStepIndex({ formId: currentConfig.id, stepIndex: nextIdx });
    },
    [setCurrentStepIndex, setValues, totalSteps, values],
  );

  const prev = React.useCallback(async () => {
    if (loadingAction) return;
    setLoadingAction("prev");
    try {
      const currentConfig = configRef.current;
      setValues({ formId: currentConfig.id, values: values as any });
      goToStep(currentStepIndex - 1);
    } finally {
      setLoadingAction(null);
    }
  }, [currentStepIndex, goToStep, setValues, values, loadingAction]);

  const formClearErrorsRef = React.useRef(form.clearErrors);
  const formSetErrorRef = React.useRef(form.setError);
  formClearErrorsRef.current = form.clearErrors;
  formSetErrorRef.current = form.setError;

  const validateStep = React.useCallback(async () => {
    formClearErrorsRef.current();
    const payload = getStepPayload(values, currentStep);
    if (!currentStep.schema) return { ok: true as const, payload };
    const result = (currentStep.schema as z.ZodTypeAny).safeParse(payload);
    if (!result.success) {
      applyZodErrorsToForm<TValues>({
        error: result.error,
        setError: formSetErrorRef.current,
      });
      return { ok: false as const, payload };
    }
    return { ok: true as const, payload };
  }, [currentStep, values]);

  const isCurrentStepSchemaValid = React.useMemo(() => {
    const payload = getStepPayload(values, currentStep);
    if (!currentStep.schema) return true;
    return (currentStep.schema as z.ZodTypeAny).safeParse(payload).success;
  }, [currentStep, values]);

  const isLastStep = currentStepIndex >= totalSteps - 1;

  const next = React.useCallback(async () => {
    if (loadingAction) return false;

    const currentConfig = configRef.current;
    const currentValues = values;
    const currentFormState = formState;

    // Always persist latest values before any navigation
    setValues({ formId: currentConfig.id, values: currentValues as any });

    // If nothing changed on this step, just move on without API/validation
    if (!isCurrentStepChanged) {
      if (isLastStep && currentConfig.onSubmit) {
        setLoadingAction("submit");
        try {
          const finalValues = (currentFormState?.values ??
            currentValues ??
            {}) as TValues;
          await currentConfig.onSubmit({
            formId: currentConfig.id,
            values: finalValues,
          });
        } finally {
          setLoadingAction(null);
        }
        return true;
      }

      if (currentStepIndex < totalSteps - 1) {
        setCurrentStepIndex({
          formId: currentConfig.id,
          stepIndex: currentStepIndex + 1,
        });
      }

      return true;
    }

    // For changed steps, run validation + step API + commit snapshot
    setLoadingAction("next");
    try {
      const { ok, payload } = await validateStep();
      if (!ok) {
        setLoadingAction(null);
        return false;
      }

      if (currentStep.onStepSubmit) {
        await currentStep.onStepSubmit({
          formId: currentConfig.id,
          stepId: currentStep.id,
          stepIndex: currentStepIndex,
          values: currentValues,
          stepPayload: payload,
        });
      }

      commitStep({
        formId: currentConfig.id,
        stepId: currentStep.id,
        snapshot: stableSerialize(payload),
      });

      if (isLastStep && currentConfig.onSubmit) {
        setLoadingAction("submit");
        try {
          const finalValues = (currentFormState?.values ??
            currentValues ??
            {}) as TValues;
          await currentConfig.onSubmit({
            formId: currentConfig.id,
            values: finalValues,
          });
        } finally {
          setLoadingAction(null);
        }
        return true;
      }

      if (currentStepIndex < totalSteps - 1) {
        setCurrentStepIndex({
          formId: currentConfig.id,
          stepIndex: currentStepIndex + 1,
        });
      }
      setLoadingAction(null);
      return true;
    } catch (error) {
      setLoadingAction(null);
      throw error;
    }
  }, [
    commitStep,
    currentStep,
    currentStepIndex,
    formState,
    isCurrentStepChanged,
    isLastStep,
    setCurrentStepIndex,
    setValues,
    totalSteps,
    validateStep,
    values,
    loadingAction,
  ]);

  const updateValues = React.useCallback(
    (partial: Partial<TValues>) => {
      const currentConfig = configRef.current;
      mergeValues({ formId: currentConfig.id, values: partial as any });
    },
    [mergeValues],
  );

  const allValues = React.useMemo(
    () => (formState?.values ?? values ?? {}) as TValues,
    [formState?.values, values],
  );

  const getStepError = React.useCallback(
    (stepIndex: number): string | null => {
      const step = steps[stepIndex];
      if (!step || !step.schema) return null;

      const payload = getStepPayload(allValues, step);
      const result = (step.schema as z.ZodTypeAny).safeParse(payload);

      if (!result.success && result.error.issues.length > 0) {
        const firstError = result.error.issues[0];
        if (!firstError) return null;

        let message = firstError.message || "Validation error";

        if (message.length > 50) {
          message = message.substring(0, 47) + "...";
        }

        return message;
      }

      return null;
    },
    [steps, allValues],
  );

  const getStepStatus = React.useCallback(
    (stepIndex: number): "complete" | "current" | "pending" | "invalid" => {
      const step = steps[stepIndex];
      if (!step) return "pending";
      if (stepIndex === currentStepIndex) return "current";

      const stepState = formState?.steps?.[step.id];
      const hasCommittedSnapshot = stepState?.committedSnapshot != null;

      if (hasCommittedSnapshot) {
        if (step.schema) {
          const payload = getStepPayload(allValues, step);
          const result = (step.schema as z.ZodTypeAny).safeParse(payload);
          return result.success ? "complete" : "invalid";
        }
        return "complete";
      }

      if (step.schema && stepIndex < currentStepIndex) {
        const payload = getStepPayload(allValues, step);
        const result = (step.schema as z.ZodTypeAny).safeParse(payload);
        if (!result.success) return "invalid";
      }

      return stepIndex < currentStepIndex ? "pending" : "pending";
    },
    [steps, currentStepIndex, formState?.steps, allValues],
  );

  const isStepRequired = React.useCallback(
    (stepIndex: number): boolean => {
      const step = steps[stepIndex];
      if (!step || !step.schema) return false;

      try {
        const schema = step.schema as z.ZodTypeAny;
        const shape = (schema as any)._def?.shape?.();
        if (!shape) {
          const typeName = (schema as any)._def?.typeName;
          if (typeName === "ZodObject") {
            return true;
          }
          return false;
        }

        const fields = step.fields || Object.keys(shape);
        return fields.some((fieldName: string) => {
          const fieldSchema = shape[fieldName];
          if (!fieldSchema) return false;

          const def = fieldSchema._def;
          if (!def) return false;

          const typeName = def.typeName;
          if (
            typeName === "ZodOptional" ||
            typeName === "ZodDefault" ||
            typeName === "ZodNullable"
          ) {
            return false;
          }

          if (typeName === "ZodEffects") {
            const innerType = def.schema?._def?.typeName;
            return innerType !== "ZodOptional" && innerType !== "ZodDefault";
          }

          return true;
        });
      } catch {
        return false;
      }
    },
    [steps],
  );

  const isStepAccessible = React.useCallback(
    (stepIndex: number): boolean => {
      if (stepIndex <= currentStepIndex) return true;

      for (let i = 0; i < stepIndex; i++) {
        const status = getStepStatus(i);
        if (
          status === "invalid" ||
          (status === "pending" && i < currentStepIndex)
        ) {
          return false;
        }
      }
      return true;
    },
    [currentStepIndex, getStepStatus],
  );

  const completedStepsCount = React.useMemo(() => {
    if (totalSteps === 0) return 0;
    return Math.min(totalSteps, Math.max(0, currentStepIndex + 1));
  }, [currentStepIndex, totalSteps]);

  const progress = React.useMemo(() => {
    if (totalSteps === 0) return 0;
    return Math.round((completedStepsCount / totalSteps) * 100);
  }, [completedStepsCount, totalSteps]);

  const goToStepWithLock = React.useCallback(
    (idx: number) => {
      if (!isStepAccessible(idx)) return;
      goToStep(idx);
    },
    [isStepAccessible, goToStep],
  );

  const isNextDisabled = React.useMemo(() => {
    const defaultDisable =
      (config.defaultDisableNextWhenInvalid ?? true) &&
      !isCurrentStepSchemaValid;
    if (defaultDisable) return true;
    return (
      config.disableNext?.({
        formId: config.id,
        stepId: currentStep.id,
        stepIndex: currentStepIndex,
        values: values as any,
      }) ?? false
    );
  }, [
    config,
    currentStep.id,
    currentStepIndex,
    isCurrentStepSchemaValid,
    values,
  ]);

  const isPrevDisabled = React.useMemo(() => {
    const defaultDisable =
      (config.defaultDisablePrevWhenInvalid ?? false) &&
      !isCurrentStepSchemaValid;
    if (defaultDisable) return true;
    return (
      config.disablePrev?.({
        formId: config.id,
        stepId: currentStep.id,
        stepIndex: currentStepIndex,
        values: values as any,
      }) ?? false
    );
  }, [
    config,
    currentStep.id,
    currentStepIndex,
    isCurrentStepSchemaValid,
    values,
  ]);

  return {
    storageKey,
    formId: config.id,
    title: config.title,
    steps,
    totalSteps,
    currentStep,
    currentStepIndex,
    isFirstStep: currentStepIndex === 0,
    isLastStep,
    isCurrentStepChanged,
    isStepChanged,
    allValues,
    values,
    form,
    goToStep: goToStepWithLock,
    goToStepUnsafe: goToStep,
    next,
    prev,
    updateValues,
    isLoading: loadingAction === "next" || loadingAction === "prev",
    isSubmitting: loadingAction === "submit",
    isLoadingNext: loadingAction === "next",
    isLoadingPrev: loadingAction === "prev",
    isNextDisabled,
    isPrevDisabled,
    getStepStatus,
    getStepError,
    isStepRequired,
    isStepAccessible,
    progress,
    completedStepsCount,
  };
}
