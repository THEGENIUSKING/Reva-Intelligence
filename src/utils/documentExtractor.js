import mammoth from "mammoth";
import { strFromU8, unzipSync } from "fflate";

const MAX_TEXT_LENGTH = 100_000;

export async function extractLocalDocumentText(file) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  let text = "";

  if (extension === "txt" || extension === "md") {
    text = await file.text();
  } else if (extension === "docx") {
    const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    text = result.value;
  } else if (extension === "pptx") {
    const archive = unzipSync(new Uint8Array(await file.arrayBuffer()));
    const slidePaths = Object.keys(archive)
      .filter((path) => /^ppt\/slides\/slide\d+\.xml$/i.test(path))
      .sort((a, b) => Number(a.match(/slide(\d+)/i)?.[1]) - Number(b.match(/slide(\d+)/i)?.[1]));
    text = slidePaths.map((path, index) => {
      const xml = new DOMParser().parseFromString(strFromU8(archive[path]), "application/xml");
      const slideText = Array.from(xml.getElementsByTagName("a:t"))
        .map((node) => node.textContent?.trim())
        .filter(Boolean)
        .join(" ");
      return slideText ? `Slide ${index + 1}\n${slideText}` : "";
    }).filter(Boolean).join("\n\n");
  } else {
    throw new Error("Choose a PDF, DOCX, PPTX, TXT, or Markdown file.");
  }

  const normalized = text.replace(/\u0000/g, "").trim();
  if (!normalized) throw new Error("No readable text was found in this file.");
  return normalized.slice(0, MAX_TEXT_LENGTH);
}
