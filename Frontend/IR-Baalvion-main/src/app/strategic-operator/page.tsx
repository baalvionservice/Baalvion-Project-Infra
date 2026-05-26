"use client";

import { useState } from "react";
import OwnershipPane from "./components/Ownershippane";
import OrgChartPane from "./components/Orgchatpane";
import EquityPane from "./components/Equitypane";
import WealthPane from "./components/Wealthpane";
import VotingPane from "./components/Votingane";
import PerformancePane from "./components/Performancepane";
import PRPane from "./components/Prpane";
import MonthlyPane from "./components/Monthlypane";
import Hero from "./components/Hero";
import Nav from "./components/Nav";

export default function StrategicOperatorPage() {
  const [activeTab, setActiveTab] = useState("ownership");

  const renderPane = () => {
    switch (activeTab) {
      case "ownership":
        return <OwnershipPane />;
      case "org":
        return <OrgChartPane />;
      case "equity":
        return <EquityPane />;
      case "wealth":
        return <WealthPane />;
      case "voting":
        return <VotingPane />;
      case "performance":
        return <PerformancePane />;
      case "pr":
        return <PRPane />;
      case "monthly":
        return <MonthlyPane />;
      default:
        return <OwnershipPane />;
    }
  };

  return (
    <div className="">
      <Hero />
      <Nav activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="p-7 max-w-7xl mx-auto">{renderPane()}</div>
    </div>
  );
}
