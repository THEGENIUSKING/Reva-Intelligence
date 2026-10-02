const fs = require("fs");
let content = fs.readFileSync("src/components/ContinuousScout.jsx", "utf8");

content = content.replace(
  "if (screenedOpportunities) screenedOpportunities.forEach",
  "if (initiatives) initiatives.forEach"
);

content = content.replace(
  "[recentFindings, screenedOpportunities, recentArticles]",
  "[recentFindings, initiatives, recentArticles]"
);

fs.writeFileSync("src/components/ContinuousScout.jsx", content, "utf8");
