export interface EntitySnapshot {
  name: string;
  mentions: number;
  mentionsChangePct: number;
  sentimentPositivePct: number;
  topTopics: string[];
  summary: string;
  relatedEntities: string[];
}

export const entitySnapshots: Record<string, EntitySnapshot> = {
  Tesla: {
    name: "Tesla",
    mentions: 2984,
    mentionsChangePct: 187,
    sentimentPositivePct: 72,
    topTopics: ["Robotaxi rollout", "EV sales growth", "China expansion"],
    summary:
      "Tesla dominated EV headlines today following strong delivery numbers and new robotaxi announcements, though China delivery softness tempered the mood.",
    relatedEntities: ["Elon Musk", "BYD", "Nvidia", "US EV Market"],
  },
  OpenAI: {
    name: "OpenAI",
    mentions: 3512,
    mentionsChangePct: 243,
    sentimentPositivePct: 81,
    topTopics: ["GPT Enterprise", "Toronto research hub", "Agentic workflows"],
    summary:
      "OpenAI led AI coverage after shipping GPT Enterprise and opening a new safety-focused research hub, both received positively by analysts.",
    relatedEntities: ["Microsoft", "Anthropic", "Sam Altman", "AI Regulation"],
  },
  Nvidia: {
    name: "Nvidia",
    mentions: 3106,
    mentionsChangePct: 198,
    sentimentPositivePct: 58,
    topTopics: ["Blackwell supply", "Export controls", "Data-center demand"],
    summary:
      "Nvidia coverage was mixed: easing chip supply lifted sentiment while new export-control uncertainty weighed on the outlook.",
    relatedEntities: ["TSMC", "AMD", "Data Centers", "US-China Trade"],
  },
};
