const fs = require("fs");

let content = fs.readFileSync("src/components/Dashboard.jsx", "utf8");

const checkLogicDashboard = `
  if (overview === undefined || initiatives === undefined || recentFindings === undefined) {
    return <PageLoader label="Loading Overview..." />;
  }
`;

content = content.replace(checkLogicDashboard, "");
content = content.replace(
  '  return (\n    <div className="mx-auto',
  checkLogicDashboard + '\n  return (\n    <div className="mx-auto'
);
fs.writeFileSync("src/components/Dashboard.jsx", content);

let content2 = fs.readFileSync("src/components/ContinuousScout.jsx", "utf8");
const checkLogicScout = `
  if (overview === undefined) {
    return <PageLoader label="Loading Scout Data..." />;
  }
`;
content2 = content2.replace(checkLogicScout, "");
content2 = content2.replace(
  '  return (\n    <div className="mx-auto',
  checkLogicScout + '\n  return (\n    <div className="mx-auto'
);
fs.writeFileSync("src/components/ContinuousScout.jsx", content2);

let content3 = fs.readFileSync("src/components/GlobalBenchmark.jsx", "utf8");
const checkLogicBench = `
  if (benchmarks === undefined) {
    return <PageLoader label="Loading Benchmarks..." />;
  }
`;
content3 = content3.replace(checkLogicBench, "");
content3 = content3.replace(
  '  return (\n    <div className="mx-auto',
  checkLogicBench + '\n  return (\n    <div className="mx-auto'
);
fs.writeFileSync("src/components/GlobalBenchmark.jsx", content3);

let content4 = fs.readFileSync("src/components/Automations.jsx", "utf8");
const checkLogicAuto = `
  if (automationsList === undefined) {
    return <PageLoader label="Loading Automations..." />;
  }
`;
content4 = content4.replace(checkLogicAuto, "");
content4 = content4.replace(
  '  return (\n    <div className="mx-auto',
  checkLogicAuto + '\n  return (\n    <div className="mx-auto'
);
fs.writeFileSync("src/components/Automations.jsx", content4);

let content5 = fs.readFileSync("src/components/EmailAuditLogs.jsx", "utf8");
const checkLogicEmail = `
  if (emailLogs === undefined) {
    return <PageLoader label="Loading Logs..." />;
  }
`;
content5 = content5.replace(checkLogicEmail, "");
content5 = content5.replace(
  '  return (\n    <div className="mx-auto',
  checkLogicEmail + '\n  return (\n    <div className="mx-auto'
);
fs.writeFileSync("src/components/EmailAuditLogs.jsx", content5);

let content6 = fs.readFileSync("src/components/SourceRegistry.jsx", "utf8");
const checkLogicRegistry = `
  if (dbSources === undefined) {
    return <PageLoader label="Loading Sources..." />;
  }
`;
content6 = content6.replace(checkLogicRegistry, "");
content6 = content6.replace(
  '  return (\n    <div className="mx-auto',
  checkLogicRegistry + '\n  return (\n    <div className="mx-auto'
);
fs.writeFileSync("src/components/SourceRegistry.jsx", content6);
