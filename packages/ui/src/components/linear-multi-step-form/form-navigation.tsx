"use client";

import { Button } from "../button";
import { NavigationArgs } from "./types";

export function FormNavigation({
  next,
  prev,
  isFirstStep,
  isLastStep,
  isLoadingNext,
  isLoadingPrev,
  isSubmitting,
}: NavigationArgs) {
  const isLoading = isLoadingNext || isLoadingPrev || isSubmitting;

  return (
    <div className="flex items-center justify-between">
      <Button
        variant="outline"
        onClick={prev}
        disabled={isFirstStep || isLoading}
        loading={isLoadingPrev}
      >
        Prev
      </Button>
      <Button onClick={next} disabled={isLoading} loading={isLoadingNext || isSubmitting}>
        {isLastStep ? "Finish" : "Next"}
      </Button>
    </div>
  );
}
