import { toPng } from "html-to-image";

const DEFAULT_FILENAME = "campaign-card.png";

/**
 * Captures an HTML element as a PNG image and triggers a download.
 * Use this with a ref to the campaign card preview element.
 *
 * @param element - The DOM element to capture (e.g. the campaign preview container)
 * @param filename - Optional download filename (without extension). Default: "campaign-card"
 */
export async function downloadCampaignCardAsImage(
  element: HTMLElement,
  filename: string = DEFAULT_FILENAME.replace(/\.png$/i, ""),
): Promise<void> {
  const name = filename.trim() || "campaign-card";
  const finalFilename = name.endsWith(".png") ? name : `${name}.png`;

  const dataUrl = await toPng(element, {
    cacheBust: true,
    pixelRatio: 2,
    style: {
      transform: "scale(1)",
    },
  });

  const link = document.createElement("a");
  link.download = finalFilename;
  link.href = dataUrl;
  link.click();
}
