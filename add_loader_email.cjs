const fs = require("fs");

let content = fs.readFileSync("src/components/EmailAuditLogs.jsx", "utf8");

if (!content.includes("PageLoader")) {
  content = content.replace(
    'import React, { useState } from "react";',
    'import React, { useState } from "react";\nimport { PageLoader } from "./Loader";'
  );
}

const checkLogic = `
  if (emailLogs === undefined) {
    return <PageLoader label="Loading Logs..." />;
  }
`;

content = content.replace(
  'export function EmailAuditLogs({ emailLogs = [] }) {',
  'export function EmailAuditLogs({ emailLogs }) {'
);

content = content.replace(
  'const [searchTerm, setSearchTerm] = useState("");',
  'const [searchTerm, setSearchTerm] = useState("");\n' + checkLogic
);

fs.writeFileSync("src/components/EmailAuditLogs.jsx", content);
