const fs = require("fs");

let content = fs.readFileSync("convex/scouting.ts", "utf8").replace(/\r\n/g, "\n");

// Look for the first export const listRecentArticlesPage and remove it
const regex = /export const listRecentArticlesPage = query\(\{\n  args: \{ paginationOpts: paginationOptsValidator \},[\s\S]*?return \{ \.\.\.page, page: rows\.filter\(\(r\) => r !== null\) \};\n  \},?\n\}\);\n/g;

// Only remove the FIRST occurrence to leave the one at the bottom!
let removed = false;
content = content.replace(regex, (match) => {
  if (!removed) {
    removed = true;
    return "";
  }
  return match;
});

fs.writeFileSync("convex/scouting.ts", content);
