const fs = require("fs");

let content = fs.readFileSync("src/components/ContinuousScout.jsx", "utf8");

content = content.replace(
  '{ id: "articles", label: "Crawled Articles Archive", count: filteredArticles.length, icon: "article" }',
  '{ id: "articles", label: "Crawled Articles Archive", count: overview?.totalArticlesAllTime || 0, icon: "article" }'
);

fs.writeFileSync("src/components/ContinuousScout.jsx", content);
