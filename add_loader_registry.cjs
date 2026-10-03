const fs = require("fs");

let content = fs.readFileSync("src/components/SourceRegistry.jsx", "utf8");

if (!content.includes("PageLoader")) {
  content = content.replace(
    'import { useQuery, useMutation } from "convex/react";',
    'import { useQuery, useMutation } from "convex/react";\nimport { PageLoader } from "./Loader";'
  );
}

const checkLogic = `
  if (dbSources === undefined) {
    return <PageLoader label="Loading Sources..." />;
  }
`;

content = content.replace(
  'const dbSources = useQuery(api.sources.listSources, {}) || [];',
  'const dbSources = useQuery(api.sources.listSources, {});'
);

content = content.replace(
  'const dbSources = useQuery(api.sources.listSources, {});',
  'const dbSources = useQuery(api.sources.listSources, {});\n' + checkLogic
);

fs.writeFileSync("src/components/SourceRegistry.jsx", content);
