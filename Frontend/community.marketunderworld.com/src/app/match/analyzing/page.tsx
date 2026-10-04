import { redirect } from "next/navigation"

// There is no analysis step: results are a direct filter of approved teachers by the quiz answers.
export default function MatchAnalyzingRedirect() {
  redirect("/match/results")
}
