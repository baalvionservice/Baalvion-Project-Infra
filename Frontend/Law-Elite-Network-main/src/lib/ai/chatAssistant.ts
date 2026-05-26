/**
 * @fileOverview ChatAssistantEngine
 * Rule-based intelligence for guiding members to the right practitioners.
 */

export interface AIResponse {
  reply: string;
  suggestion?: string;
  quickQuestions?: string[];
}

export const getAIResponse = (message: string): AIResponse => {
  const msg = message.toLowerCase();

  // Domain Specific Rules
  if (msg.includes("divorce") || msg.includes("family") || msg.includes("marriage")) {
    return {
      reply: "Matters of the heart and home require delicate, specialized counsel. I recommend consulting our distinguished Family Law practitioners. Shall I show you the top-ranked specialists?",
      suggestion: "Family Law",
      quickQuestions: ["View Divorce Lawyers", "Consultation Fees", "Process Overview"]
    };
  }

  if (msg.includes("corporate") || msg.includes("business") || msg.includes("startup") || msg.includes("contract")) {
    return {
      reply: "Strategic corporate advocacy is essential for enterprise security. Our network features elite counsel specializing in international arbitration and corporate venture. Would you like to review their dossiers?",
      suggestion: "Corporate Law",
      quickQuestions: ["Top Corporate Counsel", "Contract Review", "M&A Specialists"]
    };
  }

  if (msg.includes("criminal") || msg.includes("defense") || msg.includes("police")) {
    return {
      reply: "High-stakes litigation and criminal defense demand absolute expertise. I can direct you to our most successful defense practitioners immediately.",
      suggestion: "Criminal Defense",
      quickQuestions: ["Elite Defense Counsel", "Immediate Consultation", "Legal Rights"]
    };
  }

  if (msg.includes("fee") || msg.includes("cost") || msg.includes("price") || msg.includes("pay")) {
    return {
      reply: "Transparency is a cornerstone of the Law Elite Network. Consultation fees are set by practitioners based on demand and expertise, typically starting from ₹3,500 per session. You can view specific fees on each practitioner's dossier.",
      quickQuestions: ["Pricing Insights", "Secure Payments", "Escrow Policy"]
    };
  }

  // General Guidance
  if (msg.includes("help") || msg.includes("how") || msg.includes("start")) {
    return {
      reply: "Welcome to the network. I can help you identify specialized counsel, explain our secure consultation protocols, or assist with your executive dashboard. What is the nature of your inquiry?",
      quickQuestions: ["Find a Lawyer", "Scheduling a Session", "Network Security"]
    };
  }

  return {
    reply: "I am your Network Intelligence Assistant. Describe your legal requirements, and I will guide you to the world's most distinguished practitioners.",
    quickQuestions: ["Corporate Law", "Family Law", "Criminal Defense", "Platform Help"]
  };
};
