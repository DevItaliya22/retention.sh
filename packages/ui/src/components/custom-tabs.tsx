"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import {
  Children,
  useEffect,
  useEffectEvent,
  useState,
  type KeyboardEvent,
  type PropsWithChildren,
  type RefObject,
} from "react";
import { cn } from "../lib/utils";

export interface TabsProps {
  type?: "pills" | "underlined" | "cards" | "rounded-pills";
  defaultActiveId?: string;
  activeId?: string;
  size?: "xs" | "tiny" | "small" | "medium" | "large" | "xlarge";
  block?: boolean;
  tabBarGutter?: number;
  tabBarStyle?: React.CSSProperties;
  onChange?: (id: string) => void;
  onClick?: (id: string) => void;
  scrollable?: boolean;
  wrappable?: boolean;
  addOnBefore?: React.ReactNode;
  addOnAfter?: React.ReactNode;
  listClassNames?: string;
  baseClassNames?: string;
  refs?: {
    base: RefObject<HTMLDivElement> | ((elem: HTMLDivElement | null) => void);
    list: RefObject<HTMLDivElement> | ((elem: HTMLDivElement | null) => void);
  };
}

interface TabsSubComponents {
  Panel: React.FC<PropsWithChildren<PanelProps>>;
}

interface PanelPropsProps {
  props: PanelProps;
}

interface PanelProps {
  id: string;
  label?: string;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  className?: string;
}

// Custom Tabs component with Panel support
const CustomTabs: React.FC<PropsWithChildren<TabsProps>> &
  TabsSubComponents = ({
  defaultActiveId,
  activeId,
  type = "pills",
  size = "tiny",
  block,
  onChange,
  onClick,
  scrollable,
  wrappable,
  addOnBefore,
  addOnAfter,
  listClassNames,
  baseClassNames,
  refs,
  children: _children,
}) => {
  const children = Children.toArray(_children) as PanelPropsProps[];

  const [activeTab, setActiveTab] = useState(
    activeId ??
      defaultActiveId ??
      // if no defaultActiveId is set use the first panel
      children?.[0]?.props?.id,
  );

  const handleActiveIdChange = useEffectEvent((newActiveId: string) => {
    setActiveTab(newActiveId);
  });

  useEffect(() => {
    if (activeId && activeId !== activeTab) {
      handleActiveIdChange(activeId);
    }
  }, [activeId, activeTab]);

  function onTabClick(id: string) {
    onClick?.(id);
    if (id !== activeTab) {
      onChange?.(id);
      setActiveTab(id);
    }
  }

  // Style classes based on type
  const getListClasses = () => {
    const baseClasses = "flex items-center";
    const typeClasses = {
      pills: "bg-muted p-1 rounded-lg",
      underlined: "border-b",
      cards: "bg-muted p-1 rounded-lg",
      "rounded-pills": "bg-muted p-1 rounded-full",
    };
    const scrollableClasses = scrollable ? "overflow-x-auto" : "";
    const wrappableClasses = wrappable ? "flex-wrap" : "";

    return cn(
      baseClasses,
      typeClasses[type],
      scrollableClasses,
      wrappableClasses,
      listClassNames,
    );
  };

  const getTriggerClasses = (isActive: boolean) => {
    const baseClasses =
      "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

    const sizeClasses = {
      xs: "px-1.5 py-0.5 text-xs h-[22px]",
      tiny: "px-2 py-1 text-xs",
      small: "px-3 py-1.5 text-sm",
      medium: "px-4 py-2 text-sm",
      large: "px-6 py-3 text-base",
      xlarge: "px-8 py-4 text-lg",
    };

    const typeClasses = {
      pills: cn(
        "rounded-md",
        isActive
          ? "bg-background text-foreground shadow-sm"
          : "text-foreground-lighter hover:text-foreground hover:bg-background/50",
      ),
      underlined: cn(
        "border-b-2 border-transparent",
        isActive
          ? "text-foreground border-foreground"
          : "text-foreground-lighter hover:text-foreground",
      ),
      cards: cn(
        "rounded-md border",
        isActive
          ? "bg-background text-foreground border-border shadow-sm"
          : "text-foreground-lighter hover:text-foreground border-transparent hover:border-border",
      ),
      "rounded-pills": cn(
        "rounded-full",
        isActive
          ? "bg-background text-foreground shadow-sm"
          : "text-foreground-lighter hover:text-foreground hover:bg-background/50",
      ),
    };

    const blockClasses = block ? "flex-1" : "";

    return cn(baseClasses, sizeClasses[size], typeClasses[type], blockClasses);
  };

  return (
    <TabsPrimitive.Root
      value={activeTab}
      className={cn("w-full", baseClassNames)}
      ref={refs?.base}
    >
      <TabsPrimitive.List className={getListClasses()} ref={refs?.list}>
        {addOnBefore}
        {children.map((tab) => {
          const isActive = activeTab === tab.props.id;

          return (
            <TabsPrimitive.Trigger
              onKeyDown={(e: KeyboardEvent<HTMLButtonElement>) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onTabClick(tab.props.id);
                }
              }}
              onClick={() => onTabClick(tab.props.id)}
              key={`${tab.props.id}-tab-button`}
              value={tab.props.id}
              className={getTriggerClasses(isActive)}
            >
              {tab.props.icon}
              <span>{tab.props.label}</span>
              {tab.props.iconRight}
            </TabsPrimitive.Trigger>
          );
        })}
        {addOnAfter}
      </TabsPrimitive.List>
      {children as React.ReactNode}
    </TabsPrimitive.Root>
  );
};

// Panel component for custom tabs
export const Panel: React.FC<PropsWithChildren<PanelProps>> = ({
  children,
  id,
  className,
}) => {
  return (
    <TabsPrimitive.Content
      value={id}
      className={cn(
        "ring-offset-background focus-visible:ring-ring mt-4 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
        className,
      )}
    >
      {children}
    </TabsPrimitive.Content>
  );
};

CustomTabs.Panel = Panel;

export { CustomTabs };
export default CustomTabs;
