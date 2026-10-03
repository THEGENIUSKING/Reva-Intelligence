const fs = require("fs");

function removeLoaderCheck(file) {
  let content = fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
  
  const blocksToRemove = [
    '  if (overview === undefined || initiatives === undefined || recentFindings === undefined) {\n    return <PageLoader label="Loading Overview..." />;\n  }\n',
    '  if (overview === undefined) {\n    return <PageLoader label="Loading Scout Data..." />;\n  }\n',
    '  if (benchmarks === undefined) {\n    return <PageLoader label="Loading Benchmarks..." />;\n  }\n',
    '  if (automationsList === undefined) {\n    return <PageLoader label="Loading Automations..." />;\n  }\n',
    '  if (emailLogs === undefined) {\n    return <PageLoader label="Loading Logs..." />;\n  }\n',
    '  if (dbSources === undefined) {\n    return <PageLoader label="Loading Sources..." />;\n  }\n'
  ];

  blocksToRemove.forEach(b => {
    content = content.replace(b, "");
  });
  
  fs.writeFileSync(file, content);
}

["src/components/Dashboard.jsx", "src/components/ContinuousScout.jsx", "src/components/GlobalBenchmark.jsx", "src/components/Automations.jsx", "src/components/EmailAuditLogs.jsx", "src/components/SourceRegistry.jsx"].forEach(removeLoaderCheck);

function insertBefore(file, searchStr, insertStr) {
  let content = fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
  if (!content.includes(insertStr)) {
    content = content.replace(searchStr, insertStr + searchStr);
    fs.writeFileSync(file, content);
  }
}

insertBefore("src/components/Dashboard.jsx", '  return (\n    <div className="mx-auto', '  if (overview === undefined || initiatives === undefined || recentFindings === undefined) {\n    return <PageLoader label="Loading Overview..." />;\n  }\n\n');
insertBefore("src/components/ContinuousScout.jsx", '  return (\n    <div className="mx-auto', '  if (overview === undefined) {\n    return <PageLoader label="Loading Scout Data..." />;\n  }\n\n');
insertBefore("src/components/Automations.jsx", '  return (\n    <div className="mx-auto', '  if (automationsList === undefined) {\n    return <PageLoader label="Loading Automations..." />;\n  }\n\n');
insertBefore("src/components/EmailAuditLogs.jsx", '  return (\n    <div className="mx-auto', '  if (emailLogs === undefined) {\n    return <PageLoader label="Loading Logs..." />;\n  }\n\n');
insertBefore("src/components/SourceRegistry.jsx", '  return (\n    <div className="mx-auto', '  if (dbSources === undefined) {\n    return <PageLoader label="Loading Sources..." />;\n  }\n\n');
insertBefore("src/components/GlobalBenchmark.jsx", '  return (\n    <div className="mx-auto', '  if (benchmarks === undefined) {\n    return <PageLoader label="Loading Benchmarks..." />;\n  }\n\n');

console.log("Hooks fixed safely.");
