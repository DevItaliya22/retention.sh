/** Same as general settings page: label left (col-span-4), value right (col-span-8) */
export const SETTINGS_ROW_CLASS = "flex flex-col gap-2 md:grid md:grid-cols-12";
export const SETTINGS_LABEL_CLASS = "col-span-4 flex flex-col gap-2";
export const SETTINGS_CONTROL_CLASS = "col-span-8 flex flex-col gap-1";

/** Prevent scroll wheel and step (up/down) from changing number inputs in multi-step/loyalty forms */
export const numericInputHandlers = {
  onWheel: (e: React.WheelEvent<HTMLInputElement>) => e.currentTarget.blur(),
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp" || e.key === "ArrowDown") e.preventDefault();
  },
};
