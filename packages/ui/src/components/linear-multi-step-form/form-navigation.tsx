"use client";

import { Button } from "../button";
import { ButtonGroup, ButtonGroupSeparator } from "../button-group";
import { ChevronDown, ChevronUp } from "lucide-react";
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
