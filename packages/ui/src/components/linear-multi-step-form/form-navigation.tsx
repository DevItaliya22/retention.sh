"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
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

  const nextEnabled = !isLoading && !isNextDisabled && !isSubmitting;
  const prevEnabled = !isFirstStep && !isLoading && !isPrevDisabled;

  return (
    <div className="flex w-full items-center justify-between gap-3">
      <Button
        type="button"
        variant={prevEnabled ? "default" : "outline"}
        size="default"
        className="gap-2"
        onClick={prev}
        disabled={isFirstStep || isLoading || isPrevDisabled}
        loading={isLoadingPrev}
      >
        <ChevronLeft className="size-4 shrink-0" aria-hidden />
        Prev
      </Button>
      <Button
        type="button"
        variant={nextEnabled ? "default" : "outline"}
        size="default"
        className="gap-2"
        onClick={next}
        disabled={isLoading || isNextDisabled}
        loading={isLoadingNext || isSubmitting}
      >
        {isLastStep ? "Finish" : "Next"}
        <ChevronRight className="size-4 shrink-0" aria-hidden />
      </Button>
    </div>
  );
}
