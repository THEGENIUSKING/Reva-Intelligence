const fs = require("fs");

let content = fs.readFileSync("src/components/Automations.jsx", "utf8");

if (!content.includes("PageLoader")) {
  content = content.replace(
    'import { useQuery, useMutation } from "convex/react";',
    'import { useQuery, useMutation } from "convex/react";\nimport { PageLoader } from "./Loader";'
  );
}

const checkLogic = `
  if (automationsList === undefined) {
    return <PageLoader label="Loading Automations..." />;
  }
`;

content = content.replace(
  'const automationsList = useQuery(api.automations.listAutomations, canLoad ? {} : "skip") || [];',
  'const automationsList = useQuery(api.automations.listAutomations, canLoad ? {} : "skip");'
);

content = content.replace(
  'const automationsList = useQuery(api.automations.listAutomations, canLoad ? {} : "skip");',
  'const automationsList = useQuery(api.automations.listAutomations, canLoad ? {} : "skip");\n' + checkLogic
);

fs.writeFileSync("src/components/Automations.jsx", content);
