const fs = require("fs");

let screening = fs.readFileSync("convex/screening.ts", "utf8");
screening = screening.replace(/const delay = response\.status === 429 \? 15000 :/g, "const delay = response.status === 429 ? 60000 :");
fs.writeFileSync("convex/screening.ts", screening);

let scouting = fs.readFileSync("convex/scouting.ts", "utf8");
scouting = scouting.replace(/const delay = response\.status === 429 \? 15000 :/g, "const delay = response.status === 429 ? 60000 :");
fs.writeFileSync("convex/scouting.ts", scouting);
