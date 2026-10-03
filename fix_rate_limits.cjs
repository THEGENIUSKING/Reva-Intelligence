const fs = require("fs");

let screening = fs.readFileSync("convex/screening.ts", "utf8");

screening = screening.replace(
  "for (let attempt = 0; attempt < 4; attempt++) {",
  "for (let attempt = 0; attempt < 6; attempt++) {"
);

screening = screening.replace(
  "if (!retryable || attempt === 3) {",
  "if (!retryable || attempt === 5) {"
);

screening = screening.replace(
  /const delay = Number\.isFinite[\s\S]*?10000\);/,
  "const delay = response.status === 429 ? 15000 : Math.min(1000 * (2 ** attempt) + Math.random() * 500, 10000);"
);

// Add delay between loop iterations in processScoutCandidates
screening = screening.replace(
  "const matches = portfolioAvailable ? portfolioMatch(candidate, portfolio) : [];",
  "if (processed > 0) await new Promise(r => setTimeout(r, 3000));\n          const matches = portfolioAvailable ? portfolioMatch(candidate, portfolio) : [];"
);

fs.writeFileSync("convex/screening.ts", screening, "utf8");


let scouting = fs.readFileSync("convex/scouting.ts", "utf8");

// Add delay between batches in scouting.ts
scouting = scouting.replace(
  "const batch = fresh.slice(offset, offset + 20);",
  "if (offset > 0) await new Promise(r => setTimeout(r, 4000));\n        const batch = fresh.slice(offset, offset + 20);"
);

// Add retry logic to classifyScoutedArticles
scouting = scouting.replace(
  /const response = await fetch[\s\S]*?if \(\!response\.ok\) throw new Error\(\`Gemini scout classification returned \$\{response\.status\}\`\);/,
  `let response: Response | null = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
      method: "POST", headers: { "content-type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({ model: env.GEMINI_MODEL || "gemini-3.8-flash", input: prompt,
        response_format: { type: "text", mime_type: "application/json" }, generation_config: { thinking_level: "low", max_output_tokens: 5000 } }),
    });
    if (response.ok) break;
    const retryable = response.status === 408 || response.status === 429 || response.status >= 500;
    if (!retryable || attempt === 4) throw new Error(\`Gemini scout classification returned \${response.status}\`);
    const delay = response.status === 429 ? 15000 : 2000;
    await new Promise(r => setTimeout(r, delay));
  }
  if (!response?.ok) throw new Error("Gemini scout classification failed.");`
);

fs.writeFileSync("convex/scouting.ts", scouting, "utf8");
