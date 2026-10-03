const fs = require("fs");
let content = fs.readFileSync("src/components/Dashboard.jsx", "utf8");

content = content.replace(
  'if (overview === undefined) {',
  'if (overview === undefined || initiatives === undefined || recentFindings === undefined) {'
);

fs.writeFileSync("src/components/Dashboard.jsx", content);
