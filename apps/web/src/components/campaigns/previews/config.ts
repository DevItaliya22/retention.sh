import type { ForwardRefExoticComponent, RefAttributes } from "react";
import { Template1 } from "./Template1";
import { Template2 } from "./Template2";
import { Template3 } from "./Template3";
import type { CampaignTemplateProps } from "./types";

export interface PreviewTemplate {
  id: string;
  name: string;
  component: ForwardRefExoticComponent<
    CampaignTemplateProps & RefAttributes<HTMLDivElement>
  >;
}

/**
 * Registry of all available campaign preview templates.
 * Added Classic, Modern Clean, and Elegant Serif.
 */
export const CAMPAIGN_PREVIEW_TEMPLATES: PreviewTemplate[] = [
  { id: "template-1", name: "Classic Reelo", component: Template1 },
  { id: "template-2", name: "Modern Clean", component: Template2 },
  { id: "template-3", name: "Elegant Serif", component: Template3 },
];
