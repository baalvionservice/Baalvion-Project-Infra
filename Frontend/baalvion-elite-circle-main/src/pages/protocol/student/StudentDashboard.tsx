/**
 * Student Dashboard - Main dashboard for members
 * TODO: Fetch expert profile from API
 * TODO: Implement real-time session status
 * TODO: Connect to payment API for purchases
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Video, Newspaper, ShoppingBag, Crown, Star, Calendar, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ProtocolLayout from "@/components/protocol/ProtocolLayout";
import StatusDot from "@/components/protocol/StatusDot";
import { protocolApi } from "@/lib/protocol-api";

const mockExpert = {
  name: "Master Trader",
  title: "Elite Trading Expert",
  avatar: "MT",
  bio: "15+ years of experience in financial markets. Specializing in technical analysis and risk management strategies.",
  stats: {
    students: "1,284",
    rating: "4.9",
    sessions: "2,450"
  },
  nextSession: "Today, 3:00 PM",
  tier: "Premium"
};

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [expertData, setExpertData] = useState<any>(null);
  useEffect(() => {
    protocolApi.experts.list().then((rows) => {
      const top = rows.find((e: any) => e.status === "active") || rows[0];
      if (top) setExpertData(top);
    });
  }, []);
  const mockExpert = {
    name: expertData?.name || "Your Expert",
    title: expertData?.title || "Elite Expert",
    avatar: expertData?.avatar || "EX",
    bio: "Specialist mentor on the Baalvion Protocol network.",
    stats: { students: String(expertData?.students ?? 0), rating: String(expertData?.rating ?? "—"), sessions: "—" },
    nextSession: "TBA",
    tier: "Premium",
  };

  const actions = [
    {
      id: "calls",
      title: "Join Call",
      description: "Join live video or audio sessions",
      icon: Video,
      color: "green",
      route: "/protocol/student/calls",
      badge: "Live Now"
    },
    {
      id: "feed",
      title: "View Feed",
      description: "Access exclusive content and updates",
      icon: Newspaper,
      color: "amber",
      route: "/protocol/student/feed",
      badge: "3 New"
    },
    {
      id: "store",
      title: "Buy Content",
      description: "Purchase premium materials",
      icon: ShoppingBag,
      color: "purple",
      route: "/protocol/student/store",
      badge: "Sale"
    },
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; border: string; text: string; gradient: string }> = {
      green: { 
        bg: "bg-green-500/10", 
        border: "border-green-500/20 hover:border-green-500/40", 
        text: "text-green-400",
        gradient: "from-green-500/20 to-green-500/5"
      },
      amber: { 
        bg: "bg-amber-500/10", 
        border: "border-amber-500/20 hover:border-amber-500/40", 
        text: "text-amber-400",
        gradient: "from-amber-500/20 to-amber-500/5"
      },
      purple: { 
        bg: "bg-purple-500/10", 
        border: "border-purple-500/20 hover:border-purple-500/40", 
        text: "text-purple-400",
        gradient: "from-purple-500/20 to-purple-500/5"
      },
    };
    return colors[color] || colors.amber;
  };

  return (
    <ProtocolLayout
      role="student"
      breadcrumbs={[
        { label: "Student Dashboard", href: "/protocol/student" }
      ]}
    >
      <div className="space-y-8">
        {/* Expert Profile Header */}
        <Card className="bg-gradient-to-r from-amber-500/10 to-transparent border-amber-500/20 overflow-hidden">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-amber-500/20 flex items-center justify-center text-3xl text-amber-400 font-light border-2 border-amber-500/30">
                  {mockExpert.avatar}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-amber-500 text-black px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1">
                  <Crown className="w-3 h-3" />
                  {mockExpert.tier}
                </div>
              </div>
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-light text-white mb-1">{mockExpert.name}</h1>
                <p className="text-amber-400/80 mb-3">{mockExpert.title}</p>
                <p className="text-white/50 max-w-2xl">{mockExpert.bio}</p>
              </div>
              <div className="flex gap-6">
                <div className="text-center">
                  <p className="text-2xl font-semibold text-white">{mockExpert.stats.students}</p>
                  <p className="text-white/50 text-sm">Students</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                    <p className="text-2xl font-semibold text-white">{mockExpert.stats.rating}</p>
                  </div>
                  <p className="text-white/50 text-sm">Rating</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-semibold text-white">{mockExpert.stats.sessions}</p>
                  <p className="text-white/50 text-sm">Sessions</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Session Alert */}
        <Card className="bg-green-500/10 border-green-500/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                <Calendar className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-white font-medium">Next Live Session</p>
                <p className="text-green-400 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {mockExpert.nextSession}
                </p>
              </div>
            </div>
            <Button 
              onClick={() => navigate("/protocol/student/calls")}
              className="bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30"
            >
              Join Now
            </Button>
          </CardContent>
        </Card>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {actions.map((action) => {
            const colors = getColorClasses(action.color);
            return (
              <Card 
                key={action.id}
                className={`${colors.border} border bg-gradient-to-b ${colors.gradient} hover:scale-105 transition-all duration-300 cursor-pointer group`}
                onClick={() => navigate(action.route)}
              >
                <CardContent className="p-8 text-center">
                  <div className="relative inline-block mb-6">
                    <div className={`w-20 h-20 ${colors.bg} rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform`}>
                      <action.icon className={`w-10 h-10 ${colors.text}`} />
                    </div>
                    {action.badge && (
                      <span className={`absolute -top-2 -right-2 ${colors.bg} ${colors.text} px-2 py-0.5 rounded-full text-xs font-medium`}>
                        {action.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-medium text-white mb-2">{action.title}</h3>
                  <p className="text-white/50">{action.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Recent Activity */}
        <Card className="bg-white/5 border-amber-500/10">
          <CardContent className="p-6">
            <h3 className="text-lg font-medium text-white mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {[
                { action: "Joined live session", time: "2 hours ago", type: "call" },
                { action: "Purchased 'Advanced Strategy Guide'", time: "Yesterday", type: "purchase" },
                { action: "Liked post: 'Market Analysis Update'", time: "2 days ago", type: "engagement" },
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-4 p-3 bg-white/5 rounded-lg">
                  <div className="w-2 h-2 bg-amber-500 rounded-full" />
                  <div className="flex-1">
                    <p className="text-white">{item.action}</p>
                    <p className="text-white/50 text-sm">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtocolLayout>
  );
};

export default StudentDashboard;
