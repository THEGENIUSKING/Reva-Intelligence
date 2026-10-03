const fs = require("fs");

let content = fs.readFileSync("src/components/GlobalBenchmark.jsx", "utf8");

if (!content.includes("PageLoader")) {
  content = content.replace(
    'import React, { useState, useRef, useMemo } from "react";',
    'import React, { useState, useRef, useMemo } from "react";\nimport { PageLoader } from "./Loader";'
  );
}

const checkLogic = `
  if (benchmarks === undefined) {
    return <PageLoader label="Loading Benchmarks..." />;
  }
`;

content = content.replace(
  'export function GlobalBenchmark({ benchmarks = [], onExtractBrief, onRunBenchmark, onUploadDocument }) {',
  'export function GlobalBenchmark({ benchmarks, onExtractBrief, onRunBenchmark, onUploadDocument }) {'
);

content = content.replace(
  'const [selectedId, setSelectedId] = useState(null);',
  'const [selectedId, setSelectedId] = useState(null);\n' + checkLogic
);

fs.writeFileSync("src/components/GlobalBenchmark.jsx", content);
