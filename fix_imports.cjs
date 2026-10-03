const fs = require("fs");

const files = [
  "src/components/Dashboard.jsx",
  "src/components/ContinuousScout.jsx",
  "src/components/GlobalBenchmark.jsx",
  "src/components/EmailAuditLogs.jsx"
];

files.forEach(file => {
  let content = fs.readFileSync(file, "utf8");
  if (!content.includes('import { PageLoader }')) {
    content = 'import { PageLoader } from "./Loader";\n' + content;
    fs.writeFileSync(file, content);
  }
});
