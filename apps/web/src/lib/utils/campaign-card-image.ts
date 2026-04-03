import { toPng } from "html-to-image";

const DEFAULT_FILENAME = "campaign-card.png";

async function waitForPreviewAssets(element: HTMLElement): Promise<void> {
  const images = Array.from(element.querySelectorAll("img"));

  await Promise.all(
    images.map(
      (image) =>
        new Promise<void>((resolve) => {
          if (image.complete) {
            resolve();
            return;
          }

          const finish = () => {
            image.removeEventListener("load", finish);
            image.removeEventListener("error", finish);
            resolve();
          };

          image.addEventListener("load", finish, { once: true });
          image.addEventListener("error", finish, { once: true });
        }),
    ),
  );

  if ("fonts" in document) {
    await document.fonts.ready;
  }
}

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

  await waitForPreviewAssets(element);

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
  document.body.appendChild(link);
  link.click();
  link.remove();
}
