export const PIPELINE_STAGES = {
  APPLIED: "Application Submitted",
  // jobs-service statuses. These were missing, so every application past `applied`
  // rendered as "Unknown Stage" on the candidate's own dashboard.
  SCREENING: "Screening",
  INTERVIEW: "Interview",
  WITHDRAWN: "Withdrawn",
  // Legacy/finer-grained stages used by the ATS pipeline board.
  SCREENED: "Screening",
  TECHNICAL_ROUND: "Technical Round",
  HR_ROUND: "HR Round",
  FINAL_ROUND: "Final Round",
  OFFER: "Offer Extended",
  HIRED: "Hired",
  REJECTED: "Application Rejected",
} as const;

/**
 * The stages an application actually passes through, in order. `rejected` and
 * `withdrawn` are terminal and sit outside this track.
 */
export const CANDIDATE_JOURNEY = ["APPLIED", "SCREENING", "INTERVIEW", "OFFER", "HIRED"] as const;

export type PipelineStage = keyof typeof PIPELINE_STAGES;

export function getStageLabel(stage: PipelineStage | string) {
  return PIPELINE_STAGES[stage as PipelineStage] || "Unknown Stage";
}

export function getStageColor(stage: PipelineStage | string) {
  switch (stage) {
    case "APPLIED":
    case "SCREENED":
    case "SCREENING":
      return "bg-blue-500";
    case "INTERVIEW":
    case "TECHNICAL_ROUND":
    case "HR_ROUND":
    case "FINAL_ROUND":
      return "bg-yellow-500";
    case "OFFER":
      return "bg-purple-500";
    case "HIRED":
      return "bg-green-500";
    case "REJECTED":
      return "bg-red-500";
    default:
      return "bg-gray-400";
  }
}

export function isApplicationActive(stage: PipelineStage | string): boolean {
  return !["HIRED", "REJECTED", "WITHDRAWN"].includes(stage);
}
