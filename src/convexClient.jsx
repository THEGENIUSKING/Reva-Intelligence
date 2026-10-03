import { useMemo } from "react";
import { useAction, useMutation, useQuery, useConvexAuth } from "convex/react";
import { api } from "../convex/_generated/api";

export function useRevaData(enabled = true) {
  const { isAuthenticated } = useConvexAuth();
  const canLoadData = isAuthenticated && enabled;
  const now = useMemo(() => Date.now(), []);
  const benchmarks = useQuery(api.benchmarks.listRecent, canLoadData ? {} : "skip");
  const initiatives = useQuery(api.initiatives.listInitiatives, canLoadData ? {} : "skip");
  const emailLogs = useQuery(api.emailLogs.listLogs, canLoadData ? {} : "skip");
  const scoutOverview = useQuery(api.scouting.getOverview, canLoadData ? { now } : "skip");
  const scoutFindings = useQuery(api.scouting.listRecentFindings, canLoadData ? { limit: 100 } : "skip");
  const runBenchmark = useMutation(api.benchmarkJobs.startBenchmark);
  const benchmarkDraft = useQuery(api.benchmarkJobs.getDraft, canLoadData ? {} : "skip");
  const benchmarkJobs = useQuery(api.benchmarkJobs.listMyJobs, canLoadData ? {} : "skip");
  const saveBenchmarkDraft = useMutation(api.benchmarkJobs.saveDraft);
  const extractBrief = useAction(api.benchmarking.extractBrief);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const recordUpload = useMutation(api.files.recordUpload);

  const uploadDocument = async (file) => {
    const url = await generateUploadUrl({});
    const uploadResponse = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": file.type || "application/octet-stream" },
      body: file,
    });
    if (!uploadResponse.ok) throw new Error("Document upload failed.");
    const { storageId } = await uploadResponse.json();
    return await recordUpload({
      storageId,
      name: file.name,
      contentType: file.type || "application/octet-stream",
    });
  };

  return {
    isLiveConvex: true,
    benchmarks: benchmarks,
    benchmarkDraft,
    benchmarkJobs,
    saveBenchmarkDraft,
    initiatives: initiatives,
    emailLogs: emailLogs,
    scoutOverview,
    scoutFindings: scoutFindings,
    runBenchmark,
    extractBrief,
    uploadDocument,
  };
}
