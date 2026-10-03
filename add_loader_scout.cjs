const fs = require("fs");

let content = fs.readFileSync("src/components/ContinuousScout.jsx", "utf8");

if (!content.includes("PageLoader")) {
  content = content.replace(
    'import React, { useState, useMemo, useEffect } from "react";',
    'import React, { useState, useMemo, useEffect } from "react";\nimport { PageLoader } from "./Loader";'
  );
}

const checkLogic = `
  if (overview === undefined) {
    return <PageLoader label="Loading Scout Data..." />;
  }
`;

content = content.replace(
  'const latestRun = recentRuns[0];',
  checkLogic + '\n  const latestRun = recentRuns[0];'
);

fs.writeFileSync("src/components/ContinuousScout.jsx", content);
