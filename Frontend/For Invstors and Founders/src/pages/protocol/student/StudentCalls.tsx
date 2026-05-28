import { useState } from "react";
import { Video, Phone, Calendar, Clock, Users, Play, X, Mic, MicOff, VideoOff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ProtocolLayout from "@/components/protocol/ProtocolLayout";
import { toast } from "sonner";

const mockUpcomingCalls = [
  { 
    id: 1, 
    title: "Weekly Strategy Session", 
    type: "video",
    scheduled: "Today, 3:00 PM", 
    status: "live",
    attendees: 347,
    duration: "1 hour" 
  },
  { 
    id: 2, 
    title: "Q&A with Premium Members", 
    type: "video",
    scheduled: "Tomorrow, 5:00 PM", 
    status: "upcoming",
    attendees: 156,
    duration: "2 hours" 
  },
  { 
    id: 3, 
    title: "Quick Check-in", 
    type: "audio",
    scheduled: "Jan 15, 1:00 PM", 
    status: "upcoming",
    attendees: 45,
    duration: "30 min" 
  },
];

const StudentCalls = () => {
  const [showCallModal, setShowCallModal] = useState(false);
  const [currentCall, setCurrentCall] = useState<typeof mockUpcomingCalls[0] | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const handleJoinCall = (call: typeof mockUpcomingCalls[0]) => {
    setCurrentCall(call);
    setShowCallModal(true);
    toast.success(`Joining ${call.title}`);
  };

  const handleLeaveCall = () => {
    setShowCallModal(false);
    setCurrentCall(null);
    setIsMuted(false);
    setIsVideoOff(false);
    toast.success("Left the call");
  };

  return (
    <ProtocolLayout
      role="student"
      breadcrumbs={[
        { label: "Student Dashboard", href: "/protocol/student" },
        { label: "Calls", href: "/protocol/student/calls" }
      ]}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-light tracking-wide text-white mb-2">Live Calls</h1>
          <p className="text-white/50">Join live sessions with your expert</p>
        </div>

        {/* Live Now Alert */}
        {mockUpcomingCalls.some(c => c.status === "live") && (
          <Card className="bg-green-500/10 border-green-500/30 animate-pulse">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-ping" />
                <div>
                  <p className="text-white font-medium">Live Session in Progress</p>
                  <p className="text-green-400">
                    {mockUpcomingCalls.find(c => c.status === "live")?.title}
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => handleJoinCall(mockUpcomingCalls.find(c => c.status === "live")!)}
                className="bg-green-500 text-white hover:bg-green-600"
              >
                <Play className="w-4 h-4 mr-2" />
                Join Now
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Upcoming Calls */}
        <div className="space-y-4">
          {mockUpcomingCalls.map((call) => (
            <Card 
              key={call.id} 
              className={`bg-white/5 border-amber-500/10 hover:border-amber-500/30 transition-all ${
                call.status === 'live' ? 'ring-2 ring-green-500/50' : ''
              }`}
            >
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${
                      call.type === 'video' 
                        ? 'bg-amber-500/10' 
                        : 'bg-indigo-500/10'
                    }`}>
                      {call.type === 'video' ? (
                        <Video className="w-6 h-6 text-amber-500" />
                      ) : (
                        <Phone className="w-6 h-6 text-indigo-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-medium text-white">{call.title}</h3>
                        {call.status === 'live' && (
                          <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                            LIVE
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-white/50 text-sm">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {call.scheduled}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {call.duration}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {call.attendees} {call.status === 'live' ? 'watching' : 'registered'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button 
                    onClick={() => handleJoinCall(call)}
                    disabled={call.status !== 'live'}
                    className={call.status === 'live' 
                      ? "bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30"
                      : "bg-white/5 text-white/50 border border-white/10 cursor-not-allowed"
                    }
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {call.status === 'live' ? 'Join Now' : 'Waiting...'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Past Recordings */}
        <div className="pt-6">
          <h2 className="text-xl font-light text-white mb-4">Past Recordings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { title: "Market Analysis - December Recap", date: "Dec 28, 2024", duration: "1:32:45", views: 892 },
              { title: "Trading Psychology Masterclass", date: "Dec 21, 2024", duration: "2:15:30", views: 1245 },
            ].map((recording, index) => (
              <Card key={index} className="bg-white/5 border-amber-500/10 hover:border-amber-500/30 transition-all cursor-pointer">
                <CardContent className="p-4">
                  <div className="aspect-video bg-black/30 rounded-lg flex items-center justify-center mb-3">
                    <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center">
                      <Play className="w-6 h-6 text-amber-400" />
                    </div>
                  </div>
                  <h4 className="text-white font-medium mb-1">{recording.title}</h4>
                  <div className="flex items-center gap-4 text-white/50 text-sm">
                    <span>{recording.date}</span>
                    <span>{recording.duration}</span>
                    <span>{recording.views} views</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Call Modal */}
      <Dialog open={showCallModal} onOpenChange={setShowCallModal}>
        <DialogContent className="bg-[#0a0a0f] border-amber-500/20 text-white max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {currentCall?.type === 'video' ? (
                <Video className="w-5 h-5 text-green-400" />
              ) : (
                <Phone className="w-5 h-5 text-indigo-400" />
              )}
              {currentCall?.title}
              <span className="ml-2 px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                LIVE
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 flex flex-col">
            {/* Video Area */}
            <div className="flex-1 bg-black/50 rounded-lg flex items-center justify-center mb-4">
              {currentCall?.type === 'video' ? (
                <div className="text-center">
                  <div className="w-32 h-32 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
                    <span className="text-4xl text-amber-400">MT</span>
                  </div>
                  <p className="text-white font-medium">Master Trader</p>
                  <p className="text-white/50 text-sm">{currentCall.attendees} watching</p>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-32 h-32 rounded-full bg-indigo-500/20 flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <Phone className="w-16 h-16 text-indigo-400" />
                  </div>
                  <p className="text-white font-medium">Audio Call Active</p>
                  <p className="text-white/50 text-sm">{currentCall?.attendees} listening</p>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-4 pb-4">
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => setIsMuted(!isMuted)}
                className={`rounded-full w-14 h-14 ${isMuted ? 'bg-red-500/20 border-red-500/30' : 'border-amber-500/20'}`}
              >
                {isMuted ? (
                  <MicOff className="w-6 h-6 text-red-400" />
                ) : (
                  <Mic className="w-6 h-6 text-white" />
                )}
              </Button>
              {currentCall?.type === 'video' && (
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => setIsVideoOff(!isVideoOff)}
                  className={`rounded-full w-14 h-14 ${isVideoOff ? 'bg-red-500/20 border-red-500/30' : 'border-amber-500/20'}`}
                >
                  {isVideoOff ? (
                    <VideoOff className="w-6 h-6 text-red-400" />
                  ) : (
                    <Video className="w-6 h-6 text-white" />
                  )}
                </Button>
              )}
              <Button 
                size="lg"
                onClick={handleLeaveCall}
                className="rounded-full w-14 h-14 bg-red-500 hover:bg-red-600"
              >
                <X className="w-6 h-6" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </ProtocolLayout>
  );
};

export default StudentCalls;
