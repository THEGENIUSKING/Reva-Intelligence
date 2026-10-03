const fs = require("fs");

function fixFile(file, loaderLabel, varsToCheck) {
  let content = fs.readFileSync(file, "utf8");
  
  // Strip out any existing PageLoader return blocks (using regex to ignore whitespace)
  content = content.replace(/if \([\s\S]*?=== undefined[\s\S]*?\{[\s\S]*?return <PageLoader[\s\S]*?\}[\s\S]*?\n/g, "");

  // Build the new block
  const conds = varsToCheck.map(v => v + " === undefined").join(" || ");
  const checkLogic = '\n  if (' + conds + ') {\n    return <PageLoader label="' + loaderLabel + '" />;\n  }\n';

  content = content.replace(/^  return \(/m, checkLogic + '\n  return (');
  
  fs.writeFileSync(file, content);
}

fixFile("src/components/Dashboard.jsx", "Loading Overview...", ["overview", "initiatives", "recentFindings"]);
fixFile("src/components/ContinuousScout.jsx", "Loading Scout Data...", ["overview"]);
fixFile("src/components/GlobalBenchmark.jsx", "Loading Benchmarks...", ["benchmarks"]);
fixFile("src/components/Automations.jsx", "Loading Automations...", ["automationsList"]);
fixFile("src/components/EmailAuditLogs.jsx", "Loading Logs...", ["emailLogs"]);
fixFile("src/components/SourceRegistry.jsx", "Loading Sources...", ["dbSources"]);

console.log("Done");
