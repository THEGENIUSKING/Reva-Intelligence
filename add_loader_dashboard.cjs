const fs = require("fs");

let content = fs.readFileSync("src/components/Dashboard.jsx", "utf8");

if (!content.includes("PageLoader")) {
  content = content.replace(
    'import React, { useState, useMemo } from "react";',
    'import React, { useState, useMemo } from "react";\nimport { PageLoader } from "./Loader";'
  );
}

const checkLogic = `
  if (overview === undefined) {
    return <PageLoader label="Loading Overview..." />;
  }
`;

content = content.replace(
  'const now = Date.now();',
  checkLogic + '\n  const now = Date.now();'
);

fs.writeFileSync("src/components/Dashboard.jsx", content);
