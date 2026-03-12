"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "../button";
import { ButtonGroup, ButtonGroupSeparator } from "../button-group";
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
    <ButtonGroup>
      <Button
        className="hit-area-y-2 hit-area-l-2"
        type="button"
        variant={prevEnabled ? "default" : "outline"}
        size="icon"
        onClick={prev}
        disabled={isFirstStep || isLoading || isPrevDisabled}
        loading={isLoadingPrev}
        aria-label="Previous step"
      >
        <ChevronUp className="size-4" />
      </Button>
      <ButtonGroupSeparator orientation="vertical" className="bg-background" />
      <Button
        className="hit-area-y-2 hit-area-r-2"
        type="button"
        variant={nextEnabled ? "default" : "outline"}
        size="icon"
        onClick={next}
        disabled={isLoading || isNextDisabled}
        loading={isLoadingNext || isSubmitting}
        aria-label={isLastStep ? "Finish" : "Next step"}
      >
        <ChevronDown className="size-4" />
      </Button>
    </ButtonGroup>
  );
}
