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
  isNextDisabled,
  isPrevDisabled,
}: NavigationArgs) {
  const isLoading = isLoadingNext || isLoadingPrev || isSubmitting;

  return (
    <div className="flex items-center justify-between">
      <Button
        variant="outline"
        onClick={prev}
        disabled={isFirstStep || isLoading || isPrevDisabled}
        loading={isLoadingPrev}
      >
        Prev
      </Button>
      <Button
        onClick={next}
        disabled={isLoading || isNextDisabled}
        loading={isLoadingNext || isSubmitting}
      >
        {isLastStep ? "Finish" : "Next"}
      </Button>
    </div>
  );
}
