/**
 * @fileOverview Mock AI Intelligence Implementation
 * Simulates LLM-driven analysis and strategic recommendations.
 */

import { getAllLawyers } from "@/services/lawyers/lawyerService";

export const mockGenerateCaseInsights = async (caseData: any) => {
  // Simulate heavy-duty intelligence processing
  await new Promise((resolve) => setTimeout(resolve, 1200));

  const category = (caseData.category || "General").toLowerCase();
  
  let summary = "";
  let suggestions = [];

  if (category.includes("corporate")) {
    summary = "This matter involves complex enterprise compliance and strategic corporate governance. Platform intelligence identifies potential risk vectors in existing contract structures.";
    suggestions = [
      "Initialize full compliance audit of Series A documentation.",
      "Engage counsel for multi-jurisdictional tax review.",
      "Establish E2E encrypted data room for due diligence."
    ];
  } else if (category.includes("ip") || category.includes("patent")) {
    summary = "Strategic intellectual property protection matter. Analysis suggests high-velocity filing requirement to secure priority dates in the global marketplace.";
    suggestions = [
      "Conduct prior-art search across US and EU patent ledgers.",
      "Execute non-disclosure protocols with technical leads.",
      "Finalize utility patent specifications for immediate filing."
    ];
  } else {
    summary = `This ${category} matter requires specialized domain expertise. Intelligence suggests a phased approach starting with preliminary discovery and credential auditing.`;
    suggestions = [
      "Consolidate all relevant case records in the Secure Vault.",
      "Initialize discovery session with top-ranked domain counsel.",
      "Audit historical precedents for similar ${category} filings."
    ];
  }

  // Get recommended lawyers based on category
  const allLawyers = await getAllLawyers();
  const recommendedLawyers = allLawyers
    .filter(l => 
      l.specialization.some(s => s.toLowerCase().includes(category)) ||
      l.specialization.some(s => category.includes(s.toLowerCase()))
    )
    .slice(0, 3);

  return {
    summary,
    suggestions,
    recommendedLawyers: recommendedLawyers.length > 0 ? recommendedLawyers : allLawyers.slice(0, 3),
    generatedAt: Date.now()
  };
};

export const mockAnalyzeDocument = async (fileText: string) => {
  // Simulate high-fidelity NLP analysis
  await new Promise((resolve) => setTimeout(resolve, 1500));

  return {
    summary: "This document is a formal legal agreement outlining specific professional obligations and liability frameworks between the signatory parties.",
    keyPoints: [
      "Contract Duration: 12-month fixed term engagement.",
      "Payment Protocol: Net-30 settlement terms specified for all disbursements.",
      "Termination Clause: standard bilateral termination rights included with notice requirements.",
      "Liability Cap: Enterprise-standard indemnity limits defined in section 8."
    ],
    risks: [
      "Ambiguity detected in the multi-jurisdictional dispute resolution clause.",
      "Absence of specific penalty frameworks for delayed milestone delivery.",
      "Potential conflict with existing non-compete covenants in related dossiers."
    ],
    generatedAt: Date.now()
  };
};

export const mockChatWithAI = async (message: string, context?: any) => {
  // Simulate intelligence audit latency
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const msg = message.toLowerCase();
  const caseTitle = context?.title || "your active matter";

  if (msg.includes("do next") || msg.includes("strategy")) {
    return {
      reply: `Based on the parameters of ${caseTitle}, the network intelligence protocol recommends finalizing your document audit in the Secure Vault and scheduling a discovery session with a verified domain expert.`,
      quickQuestions: ["Find a Lawyer", "Audit Documents", "Case Status"]
    };
  }

  if (msg.includes("summarize") || msg.includes("explain my case")) {
    return {
      reply: `Your case, "${caseTitle}", is currently categorized under ${context?.category || 'General'} Law. It appears to be in the ${context?.status || 'Initialization'} phase with a ${context?.priority || 'standard'} strategic priority.`,
      quickQuestions: ["Risk Analysis", "Strategic Steps"]
    };
  }

  if (msg.includes("document")) {
    return {
      reply: "Your dossier contains verified legal records. I can analyze specific contract clauses for risk vectors or summarize key obligations if you select a document from your Secure Vault.",
      quickQuestions: ["View Vault", "Analyze Latest Record"]
    };
  }

  return {
    reply: "I am your Legal Co-Pilot. I can analyze your case briefs, identify risk vectors in your documents, or help you find the most qualified counsel for your requirements. How may I assist your strategy today?",
    quickQuestions: ["What should I do next?", "Summarize my case", "Explain my documents"]
  };
};
