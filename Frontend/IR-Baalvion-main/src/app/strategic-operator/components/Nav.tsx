"use client";

type Tab = {
  id: string;
  label: string;
};

const tabs: Tab[] = [
  { id: "ownership", label: "👑 Ownership" },
  { id: "org", label: "🏛 Org Chart" },
  { id: "equity", label: "📊 Equity & Cap Table" },
  { id: "wealth", label: "💰 Wealth Projection" },
  { id: "voting", label: "🗳 Voting System" },
  { id: "performance", label: "🏆 Performance Growth" },
  { id: "pr", label: "🌐 PR for All 30" },
  { id: "monthly", label: "📅 Monthly Report" },
];

interface NavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function Nav({ activeTab, onTabChange }: NavProps) {
  return (
    <div className="bg-so-s2 border-b border-so-border px-7 flex gap-0.5 overflow-x-auto sticky top-0 z-[100]">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`bg-transparent border-none font-dm-sans text-xs font-medium py-2.5 px-3.5 cursor-pointer border-b-2 border-transparent whitespace-nowrap transition-all duration-200 hover:text-so-text ${
            activeTab === tab.id
              ? "text-so-gold border-b-so-gold"
              : "text-so-muted"
          }`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
