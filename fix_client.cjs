const fs = require("fs");

let content = fs.readFileSync("src/convexClient.jsx", "utf8");

content = content.replace(
  'benchmarks: benchmarks || [],',
  'benchmarks: benchmarks,'
);
content = content.replace(
  'initiatives: initiatives || [],',
  'initiatives: initiatives,'
);
content = content.replace(
  'emailLogs: emailLogs || [],',
  'emailLogs: emailLogs,'
);
content = content.replace(
  'scoutFindings: scoutFindings || [],',
  'scoutFindings: scoutFindings,'
);

fs.writeFileSync("src/convexClient.jsx", content);
