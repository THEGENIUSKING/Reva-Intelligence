import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Nigeria is UTC+1: these UTC times run at 05:00 and 06:00 WAT respectively.
crons.cron("emerging market tech scout at 05:00 WAT", "0 4 * * *", internal.scouting.runEmergingScheduled, {});
crons.cron("Nigerian policy scout at 06:00 WAT", "0 5 * * *", internal.scouting.runPolicyScheduled, {});

export default crons;
