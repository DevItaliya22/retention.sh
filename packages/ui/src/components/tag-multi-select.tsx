"use client";

import { Check, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "../lib/utils";
import { Badge } from "./badge";
import { Button } from "./button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./command";
import { Faceted, FacetedContent, FacetedTrigger } from "./faceted";

export interface TagOption {
  id: string;
  name: string;
  color?: string | null;
}

interface TagMultiSelectProps {
  options: TagOption[];
  value?: string[];
  onValueChange: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  onCreateTag?: (name: string) => Promise<TagOption | null>;
  searchPlaceholder?: string;
}

export function TagMultiSelect({
  options,
  value = [],
  onValueChange,
  placeholder = "Select tags...",
  disabled = false,
  onCreateTag,
  searchPlaceholder = "Search or add tags...",
}: TagMultiSelectProps) {
  const [search, setSearch] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const selectedOptions = options.filter((option) => value.includes(option.id));

  // Filter options based on search
  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const searchLower = search.toLowerCase();
    return options.filter((option) =>
      option.name.toLowerCase().includes(searchLower),
    );
  }, [options, search]);

  // Check if search matches any existing tag
  const searchMatchesExisting = useMemo(() => {
    if (!search.trim()) return false;
    const searchLower = search.trim().toLowerCase();
    return options.some((option) => option.name.toLowerCase() === searchLower);
  }, [options, search]);

  // Check if we should show create option
  const shouldShowCreate = useMemo(() => {
    return (
      onCreateTag &&
      search.trim() &&
      !searchMatchesExisting &&
      !value.some((id) => {
        const option = options.find((o) => o.id === id);
        return option?.name.toLowerCase() === search.trim().toLowerCase();
      })
    );
  }, [onCreateTag, search, searchMatchesExisting, value, options]);

  const handleCreateTag = async () => {
    if (!onCreateTag || !search.trim() || isCreating) return;

    setIsCreating(true);
    try {
      const newTag = await onCreateTag(search.trim());
      if (newTag) {
        // Add the new tag to selected values
        onValueChange([...value, newTag.id]);
        setSearch("");
      }
    } catch (error) {
      console.error("Failed to create tag:", error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Faceted
      value={value}
      onValueChange={(newValue) => {
        onValueChange(Array.isArray(newValue) ? newValue : []);
      }}
      multiple
    >
      <FacetedTrigger asChild>
        <Button
          variant="outline"
          className="h-auto min-h-9 w-full justify-start px-2.5 py-1.5 whitespace-normal"
          disabled={disabled}
          textWrapperClassName="w-full"
          text={
            selectedOptions.length === 0 ? (
              <span className="text-foreground-lighter">{placeholder}</span>
            ) : (
              <div className="flex w-full flex-wrap gap-1.5">
                {selectedOptions.map((option) => (
                  <Badge
                    key={option.id}
                    variant="outline"
                    className="border-strong shrink-0 gap-1.5"
                    style={
                      option.color
                        ? {
                            backgroundColor: `${option.color}15`,
                            borderColor: option.color,
                            color: option.color,
                          }
                        : undefined
                    }
                  >
                    {option.color && (
                      <div
                        className="size-2 shrink-0 rounded-full"
                        style={{ backgroundColor: option.color }}
                      />
                    )}
                    <span>{option.name}</span>
                  </Badge>
                ))}
              </div>
            )
          }
        />
      </FacetedTrigger>
      <FacetedContent className="w-full">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {filteredOptions.length === 0 && !shouldShowCreate && (
              <CommandEmpty>No tags found.</CommandEmpty>
            )}
            <CommandGroup>
              {filteredOptions.map((option) => {
                const isSelected = value.includes(option.id);
                return (
                  <CommandItem
                    key={option.id}
                    value={option.id}
                    onSelect={() => {
                      const newValue = isSelected
                        ? value.filter((v) => v !== option.id)
                        : [...value, option.id];
                      onValueChange(newValue);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "border-primary flex size-4 items-center justify-center rounded-sm border",
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "opacity-50 [&_svg]:invisible",
                        )}
                      >
                        {isSelected && <Check className="size-3" />}
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          option.color ? "gap-1.5" : "border-strong gap-1.5"
                        }
                        style={
                          option.color
                            ? {
                                backgroundColor: `${option.color}15`,
                                borderColor: option.color,
                                color: option.color,
                              }
                            : undefined
                        }
                      >
                        {option.color && (
                          <div
                            className="size-2 shrink-0 rounded-full"
                            style={{ backgroundColor: option.color }}
                          />
                        )}
                        <span>{option.name}</span>
                      </Badge>
                    </div>
                  </CommandItem>
                );
              })}
              {shouldShowCreate && (
                <CommandItem
                  value={`create-${search.trim()}`}
                  onSelect={handleCreateTag}
                  disabled={isCreating}
                  className="text-primary"
                >
                  <div className="flex items-center gap-2">
                    <div className="border-primary flex size-4 items-center justify-center rounded-sm border opacity-50">
                      <Plus className="size-3" />
                    </div>
                    <span>
                      {isCreating ? "Creating..." : `Create "${search.trim()}"`}
                    </span>
                  </div>
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </FacetedContent>
    </Faceted>
  );
}
