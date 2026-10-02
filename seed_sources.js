const { ConvexHttpClient } = require("convex/browser");
const dotenv = require("dotenv");

dotenv.config({ path: ".env.local" });
const client = new ConvexHttpClient(process.env.CONVEX_URL);

const INITIAL_REGISTRY_SOURCES = [
  { name: "Disrupt Africa", url: "https://disrupt-africa.com", region: "Africa (Pan-African)", category: "Emerging Market Primary", tier: "tier_a_emerging" },
  { name: "WeeTracker", url: "https://weetracker.com", region: "Africa (East & Southern)", category: "Emerging Market Primary", tier: "tier_a_emerging" },
  { name: "Tech in Asia", url: "https://www.techinasia.com", region: "Southeast Asia", category: "Emerging Market Primary", tier: "tier_a_emerging" },
  { name: "DailySocial Indonesia", url: "https://dailysocial.id", region: "Southeast Asia (Indonesia)", category: "Emerging Market Primary", tier: "tier_a_emerging" },
  { name: "Wamda MENA", url: "https://www.wamda.com", region: "MENA", category: "Emerging Market Primary", tier: "tier_a_emerging" },
  { name: "Inc42 India", url: "https://inc42.com", region: "South Asia (India)", category: "Emerging Market Primary", tier: "tier_a_emerging" },
  { name: "Startups Brazil", url: "https://startups.com.br", region: "Latin America (Brazil)", category: "Emerging Market Primary", tier: "tier_a_emerging" },
  { name: "Enterprise News Egypt", url: "https://enterprise.press", region: "MENA (Egypt)", category: "Emerging Market Primary", tier: "tier_a_emerging" },
  { name: "Central Bank of Nigeria (CBN)", url: "https://www.cbn.gov.ng/Documents/circulars.asp", region: "Nigeria", category: "Nigerian Regulatory, Legal and Policy Environment", tier: "nigeria_regulator" },
  { name: "Securities & Exchange Commission (SEC Nigeria)", url: "https://sec.gov.ng/rules-codes-circulars", region: "Nigeria", category: "Nigerian Regulatory, Legal and Policy Environment", tier: "nigeria_regulator" },
  { name: "Nigerian Electricity Regulatory Commission (NERC)", url: "https://nerc.gov.ng/orders", region: "Nigeria", category: "Nigerian Regulatory, Legal and Policy Environment", tier: "nigeria_regulator" },
  { name: "National Info Tech Dev Agency (NITDA)", url: "https://nitda.gov.ng/guidelines", region: "Nigeria", category: "Nigerian Regulatory, Legal and Policy Environment", tier: "nigeria_regulator" },
  { name: "Federal Inland Revenue Service (FIRS)", url: "https://www.firs.gov.ng/tax-resources", region: "Nigeria", category: "Nigerian Regulatory, Legal and Policy Environment", tier: "nigeria_regulator" },
  { name: "Federal Ministry of Communications, Innovation & Digital Economy", url: "https://bmdce.gov.ng", region: "Nigeria", category: "Nigerian Regulatory, Legal and Policy Environment", tier: "nigeria_regulator" },
  { name: "Crunchbase News (Global)", url: "https://news.crunchbase.com", region: "Global", category: "Global Fallback", tier: "tier_b_global" },
  { name: "TechCrunch Emerging", url: "https://techcrunch.com", region: "Global", category: "Global Fallback", tier: "tier_b_global" },
  { name: "Y Combinator Launches", url: "https://www.ycombinator.com/blog", region: "Global", category: "Global Fallback", tier: "tier_b_global" },
];

async function seed() {
  console.log("Seeding initial sources...");
  const res = await client.mutation("sources:importCuratedSources", { sources: INITIAL_REGISTRY_SOURCES });
  console.log(res);
  console.log("Done");
}

seed();
