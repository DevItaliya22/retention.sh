import { create } from "zustand";

type StepState = {
  committedSnapshot?: string;
  visitedCount: number;
};

type FormState = {
  currentStepIndex: number;
  values: Record<string, any>;
  steps: Record<string, StepState>;
};

type StoreState = {
  forms: Record<string, FormState>;
  initForm: (args: { formId: string; initialValues?: Record<string, any> }) => void;
  setCurrentStepIndex: (args: { formId: string; stepIndex: number }) => void;
  setValues: (args: { formId: string; values: Record<string, any> }) => void;
  mergeValues: (args: { formId: string; values: Record<string, any> }) => void;
  visitStep: (args: { formId: string; stepId: string }) => void;
  commitStep: (args: { formId: string; stepId: string; snapshot: string }) => void;
  resetForm: (args: { formId: string }) => void;
};

export const useLinearMultiStepFormStore = create<StoreState>()(
  (set, get) => ({
    forms: {},
    initForm: ({ formId, initialValues }) => {
      const existing = get().forms[formId];
      if (existing) return;
      set((s) => ({
        forms: {
          ...s.forms,
          [formId]: {
            currentStepIndex: 0,
            values: initialValues ?? {},
            steps: {},
          },
        },
      }));
    },
    setCurrentStepIndex: ({ formId, stepIndex }) => {
      set((s) => {
        const f = s.forms[formId];
        if (!f) return s;
        return {
          forms: {
            ...s.forms,
            [formId]: { ...f, currentStepIndex: stepIndex },
          },
        };
      });
    },
    setValues: ({ formId, values }) => {
      set((s) => {
        const f = s.forms[formId];
        if (!f) return s;
        return {
          forms: {
            ...s.forms,
            [formId]: { ...f, values },
          },
        };
      });
    },
    mergeValues: ({ formId, values }) => {
      set((s) => {
        const f = s.forms[formId];
        if (!f) return s;
        return {
          forms: {
            ...s.forms,
            [formId]: { ...f, values: { ...f.values, ...values } },
          },
        };
      });
    },
    visitStep: ({ formId, stepId }) => {
      set((s) => {
        const f = s.forms[formId];
        if (!f) return s;
        const prev = f.steps[stepId];
        const next: StepState = {
          committedSnapshot: prev?.committedSnapshot,
          visitedCount: (prev?.visitedCount ?? 0) + 1,
        };
        return {
          forms: {
            ...s.forms,
            [formId]: { ...f, steps: { ...f.steps, [stepId]: next } },
          },
        };
      });
    },
    commitStep: ({ formId, stepId, snapshot }) => {
      set((s) => {
        const f = s.forms[formId];
        if (!f) return s;
        const prev = f.steps[stepId];
        const next: StepState = {
          committedSnapshot: snapshot,
          visitedCount: prev?.visitedCount ?? 0,
        };
        return {
          forms: {
            ...s.forms,
            [formId]: { ...f, steps: { ...f.steps, [stepId]: next } },
          },
        };
      });
    },
    resetForm: ({ formId }) => {
      set((s) => {
        const next = { ...s.forms };
        delete next[formId];
        return { forms: next };
      });
    },
  }),
);
