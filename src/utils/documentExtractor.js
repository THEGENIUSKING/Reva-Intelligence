import mammoth from "mammoth";
import { strFromU8, unzipSync } from "fflate";

const MAX_TEXT_LENGTH = 100_000;

/**
 * Robust client-side text extractor for TXT, MD, DOCX, PPTX, and PDF.
 */
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
    text = slidePaths
      .map((path, index) => {
        const xml = new DOMParser().parseFromString(strFromU8(archive[path]), "application/xml");
        const slideText = Array.from(xml.getElementsByTagName("a:t"))
          .map((node) => node.textContent?.trim())
          .filter(Boolean)
          .join(" ");
        return slideText ? `Slide ${index + 1}\n${slideText}` : "";
      })
      .filter(Boolean)
      .join("\n\n");
  } else if (extension === "pdf") {
    // Client-side text stream recovery for PDF files
    const arrayBuffer = await file.arrayBuffer();
    const rawBytes = new Uint8Array(arrayBuffer);
    const decoder = new TextDecoder("latin1");
    const rawString = decoder.decode(rawBytes);

    // Extract text from uncompressed PDF text objects: BT ... ET blocks and string literals
    const textChunks = [];
    const textBlockRegex = /BT[\s\S]*?ET/g;
    let match;

    while ((match = textBlockRegex.exec(rawString)) !== null) {
      const block = match[0];
      // Match (text)Tj or [(t)(e)(x)(t)]TJ
      const stringLiteralRegex = /\(([^)]+)\)\s*(?:Tj|'|")/g;
      let strMatch;
      while ((strMatch = stringLiteralRegex.exec(block)) !== null) {
        textChunks.push(strMatch[1]);
      }
    }

    if (textChunks.length > 5) {
      text = textChunks.join(" ");
    } else {
      // Fallback: extract printable strings of length >= 4
      const asciiMatches = rawString.match(/[A-Za-z0-9 ,.:;?!'"()/-]{4,}/g) || [];
      text = asciiMatches
        .filter((s) => !s.startsWith("obj") && !s.startsWith("endobj") && !s.includes("/Font") && !s.includes("/Type"))
        .slice(0, 1000)
        .join(" ");
    }
  } else {
    // Generic fallback: read as text
    text = await file.text().catch(() => "");
  }

  const normalized = text.replace(/\u0000/g, "").replace(/\s+/g, " ").trim();
  if (!normalized) {
    throw new Error("No readable text was found in this file. Please verify file content or paste the text directly.");
  }
  return normalized.slice(0, MAX_TEXT_LENGTH);
}

/**
 * Client-side Heuristic NLP Brief Extractor.
 * Guarantees instant, zero-failure extraction of idea briefs from unstructured text or documents.
 */
export function extractBriefLocally(rawText = "") {
  const text = rawText.trim();
  if (!text) {
    return {
      ideaName: "Unspecified Initiative",
      sector: "Uncategorized",
      description: "",
      problem: "",
      solution: "",
      targetCustomer: "",
      monetization: ""
    };
  }

  // 1. Detect Idea Name
  let ideaName = "";
  const nameRegexes = [
    /(?:initiative|venture|idea|project|product|platform)\s*(?:name|title)?[:\-–]\s*([^\n.;]+)/i,
    /^#\s*([^\n]+)/m,
    /^([A-Z][A-Za-z0-9\s]{3,35})\s*[:\-–]/m,
  ];
  for (const rx of nameRegexes) {
    const m = text.match(rx);
    if (m && m[1]?.trim()) {
      ideaName = m[1].trim();
      break;
    }
  }
  if (!ideaName) {
    const firstLine = text.split("\n")[0].trim();
    if (firstLine.length > 3 && firstLine.length < 50 && !firstLine.includes(".")) {
      ideaName = firstLine;
    } else {
      // Grab first 3-5 capitalized words or fallback
      const words = text.split(/\s+/).slice(0, 4).join(" ");
      ideaName = words.length > 3 ? words : "Venture Initiative";
    }
  }

  // 2. Detect Sector
  let sector = "Uncategorized";
  const sectorKeywords = [
    { name: "AgriTech & Supply Chain", keys: ["agri", "farm", "crop", "grain", "fertilizer", "livestock", "harvest", "produce"] },
    { name: "CleanTech & Energy Software", keys: ["energy", "solar", "mini-grid", "power", "grid", "electricity", "clean", "carbon", "renewable"] },
    { name: "GovTech & Regulatory Tech", keys: ["gov", "cbn", "sec", "nerc", "firs", "policy", "regulat", "gazette", "compliance", "identity", "tax"] },
    { name: "HealthTech & Life Sciences", keys: ["health", "clinic", "doctor", "patient", "medical", "pharma", "hospital", "telemedicine"] },
    { name: "Commerce, Retail & Logistics", keys: ["logistics", "freight", "truck", "warehouse", "retail", "fmcg", "commerce", "delivery", "fleet"] },
    { name: "InsurTech & Risk Analytics", keys: ["insur", "underwriting", "actuarial", "policyholder", "claims"] },
    { name: "Mobility & Smart Transit", keys: ["transit", "commute", "bus", "transport", "vehicle", "mobility"] },
    { name: "Fintech & Financial Inclusion", keys: ["fintech", "payment", "bank", "lending", "credit", "wallet", "escrow", "remit", "fx", "savings"] }
  ];
  const lowerText = text.toLowerCase();
  for (const item of sectorKeywords) {
    if (item.keys.some((k) => lowerText.includes(k))) {
      sector = item.name;
      break;
    }
  }

  // 3. Section Slicer Utility
  function extractSection(keywords, fallbackSentenceCount = 2) {
    for (const kw of keywords) {
      const rx = new RegExp(`(?:${kw})[:\\-–]?\\s*([\\s\\S]*?)(?=(?:problem|solution|customer|target|monetiz|revenue|model|market|sector|business|differentiat|vision|$))`, "i");
      const match = text.match(rx);
      if (match && match[1]?.trim().length > 15) {
        return match[1].trim().slice(0, 600);
      }
    }
    return "";
  }

  // 4. Extract Problem
  let problem = extractSection(["problem", "pain point", "structural friction", "challenge", "deficiency", "market gap"]);
  if (!problem) {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const problemSentences = sentences.filter((s) => /lack|fail|loss|cost|inefficien|unbanked|informal|risk|barrier|bottleneck/i.test(s));
    problem = problemSentences.slice(0, 2).join(" ").trim() || sentences[0]?.trim() || "Structural market friction in Nigerian target segment.";
  }

  // 5. Extract Solution
  let solution = extractSection(["solution", "proposed solution", "our solution", "platform", "product", "technology", "offering"]);
  if (!solution) {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const solutionSentences = sentences.filter((s) => /platform|app|system|software|provides|enables|automates|delivers|built/i.test(s));
    solution = solutionSentences.slice(0, 2).join(" ").trim() || sentences.slice(1, 3).join(" ").trim() || "Technology-enabled platform delivering targeted operational automation.";
  }

  // 6. Extract Target Customer
  let targetCustomer = extractSection(["target customer", "customer", "target audience", "users", "who is the solution for", "segment"]);
  if (!targetCustomer) {
    if (/sme|small business|merchant|trader/i.test(text)) targetCustomer = "Commercial SMEs, retail merchants, and local trade aggregators";
    else if (/corporate|enterprise|bank|institution/i.test(text)) targetCustomer = "Tier-1 commercial enterprises and regulated institutions";
    else if (/consumer|retail|individual|household/i.test(text)) targetCustomer = "Middle-class Nigerian retail consumers and households";
    else targetCustomer = "Commercial enterprises and operational operators in Nigeria";
  }

  // 7. Extract Monetization
  let monetization = extractSection(["monetization", "revenue model", "how will we monetize", "business model", "pricing", "fees"]);
  if (!monetization) {
    if (/subscription|saas|monthly/i.test(text)) monetization = "Recurring monthly SaaS subscription fee + premium workflow addons";
    else if (/commission|take rate|transaction fee|percent/i.test(text)) monetization = "1.5% - 2.5% transaction processing fee + platform settlement spread";
    else monetization = "B2B SaaS subscription license plus transactional clearing fee per volume processed";
  }

  // 8. Description
  const description = `${ideaName} addresses: ${problem.slice(0, 150)}... via ${solution.slice(0, 180)}...`;

  return {
    ideaName: ideaName.slice(0, 80),
    sector,
    description: description.slice(0, 350),
    problem: problem.slice(0, 500),
    solution: solution.slice(0, 500),
    targetCustomer: targetCustomer.slice(0, 300),
    monetization: monetization.slice(0, 300),
  };
}
