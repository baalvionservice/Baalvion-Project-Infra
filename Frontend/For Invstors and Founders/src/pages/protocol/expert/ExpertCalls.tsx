import { useState, useEffect } from "react";
import { Video, Phone, Calendar, Clock, Users, Play, Plus, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ProtocolLayout from "@/components/protocol/ProtocolLayout";
import { protocolApi } from "@/lib/protocol-api";
import { toast } from "sonner";

const mockVideoCalls = [
  { id: 1, title: "Weekly Strategy Session", scheduled: "Today, 3:00 PM", attendees: 24, duration: "1 hour" },
  { id: 2, title: "Q&A with Premium Members", scheduled: "Tomorrow, 5:00 PM", attendees: 156, duration: "2 hours" },
  { id: 3, title: "Advanced Techniques Workshop", scheduled: "Jan 15, 2:00 PM", attendees: 89, duration: "1.5 hours" },
];

const mockAudioCalls = [
  { id: 1, title: "Quick Check-in", scheduled: "Today, 1:00 PM", attendees: 12, duration: "30 min" },
  { id: 2, title: "Voice-only Discussion", scheduled: "Jan 12, 4:00 PM", attendees: 45, duration: "1 hour" },
];

const ExpertCalls = () => {
  const [calls, setCalls] = useState<any[]>([]);
  const loadCalls = () => protocolApi.calls.list().then(setCalls);
  useEffect(() => { loadCalls(); }, []);
  const videoCalls = calls.filter((c) => c.type === "video");
  const audioCalls = calls.filter((c) => c.type === "audio");
  const [showStartModal, setShowStartModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [callType, setCallType] = useState<"video" | "audio">("video");
  const [newCall, setNewCall] = useState({ title: "", date: "", time: "", duration: "" });

  const handleStartCall = () => {
    setShowStartModal(false);
    setShowCallModal(true);
    toast.success(`${callType === 'video' ? 'Video' : 'Audio'} call started`);
  };

  const handleScheduleCall = async () => {
    const scheduled_at = newCall.date ? new Date(`${newCall.date}T${newCall.time || "12:00"}`).toISOString() : undefined;
    const { error } = await protocolApi.calls.create({ title: newCall.title || "Untitled session", type: callType, status: "upcoming", duration: newCall.duration, scheduled_at });
    if (error) { toast.error(error.message || "Could not schedule call"); return; }
    await loadCalls();
    toast.success("Call scheduled successfully");
    setShowScheduleModal(false);
    setNewCall({ title: "", date: "", time: "", duration: "" });
  };

  return (
    <ProtocolLayout
      role="expert"
      breadcrumbs={[
        { label: "Expert Dashboard", href: "/protocol/expert" },
        { label: "Calls", href: "/protocol/expert/calls" }
      ]}
    >
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-light tracking-wide text-white mb-2">Calls</h1>
            <p className="text-white/50">Manage video and audio calls with your students</p>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={() => setShowStartModal(true)}
              className="bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30"
            >
              <Play className="w-4 h-4 mr-2" />
              Start Call
            </Button>
            <Button 
              onClick={() => setShowScheduleModal(true)}
              className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30"
            >
              <Plus className="w-4 h-4 mr-2" />
              Schedule Call
            </Button>
          </div>
        </div>

        <Tabs defaultValue="video" className="space-y-6">
          <TabsList className="bg-white/5 border border-amber-500/10">
            <TabsTrigger value="video" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
              <Video className="w-4 h-4 mr-2" />
              Video Calls
            </TabsTrigger>
            <TabsTrigger value="audio" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
              <Phone className="w-4 h-4 mr-2" />
              Audio Calls
            </TabsTrigger>
          </TabsList>

          <TabsContent value="video" className="space-y-4">
            {videoCalls.map((call) => (
              <Card key={call.id} className="bg-white/5 border-amber-500/10 hover:border-amber-500/30 transition-all">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-amber-500/10 rounded-lg">
                        <Video className="w-6 h-6 text-amber-500" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-white">{call.title}</h3>
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
                            {call.attendees} attendees
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        className="border-amber-500/20 text-amber-400 hover:bg-amber-500/10"
                        onClick={() => {
                          setCallType("video");
                          setShowCallModal(true);
                        }}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Start
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="audio" className="space-y-4">
            {audioCalls.map((call) => (
              <Card key={call.id} className="bg-white/5 border-amber-500/10 hover:border-amber-500/30 transition-all">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-indigo-500/10 rounded-lg">
                        <Phone className="w-6 h-6 text-indigo-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-white">{call.title}</h3>
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
                            {call.attendees} attendees
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        className="border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/10"
                        onClick={() => {
                          setCallType("audio");
                          setShowCallModal(true);
                        }}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Start
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>

      {/* Start Call Modal */}
      <Dialog open={showStartModal} onOpenChange={setShowStartModal}>
        <DialogContent className="bg-[#0a0a0f] border-amber-500/20 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Start a Call</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <button
              onClick={() => setCallType("video")}
              className={`p-6 rounded-lg border transition-all ${
                callType === "video" 
                  ? "bg-amber-500/20 border-amber-500/50" 
                  : "bg-white/5 border-amber-500/10 hover:border-amber-500/30"
              }`}
            >
              <Video className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <p className="text-white font-medium">Video Call</p>
            </button>
            <button
              onClick={() => setCallType("audio")}
              className={`p-6 rounded-lg border transition-all ${
                callType === "audio" 
                  ? "bg-indigo-500/20 border-indigo-500/50" 
                  : "bg-white/5 border-amber-500/10 hover:border-amber-500/30"
              }`}
            >
              <Phone className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
              <p className="text-white font-medium">Audio Call</p>
            </button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStartModal(false)} className="border-amber-500/20 text-white hover:bg-white/5">
              Cancel
            </Button>
            <Button onClick={handleStartCall} className="bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30">
              Start Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Call Modal */}
      <Dialog open={showScheduleModal} onOpenChange={setShowScheduleModal}>
        <DialogContent className="bg-[#0a0a0f] border-amber-500/20 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule a Call</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-white/70">Call Title</Label>
              <Input 
                value={newCall.title}
                onChange={(e) => setNewCall({...newCall, title: e.target.value})}
                placeholder="e.g., Weekly Strategy Session"
                className="bg-white/5 border-amber-500/20 text-white mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white/70">Date</Label>
                <Input 
                  type="date"
                  value={newCall.date}
                  onChange={(e) => setNewCall({...newCall, date: e.target.value})}
                  className="bg-white/5 border-amber-500/20 text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-white/70">Time</Label>
                <Input 
                  type="time"
                  value={newCall.time}
                  onChange={(e) => setNewCall({...newCall, time: e.target.value})}
                  className="bg-white/5 border-amber-500/20 text-white mt-1"
                />
              </div>
            </div>
            <div>
              <Label className="text-white/70">Duration</Label>
              <Input 
                value={newCall.duration}
                onChange={(e) => setNewCall({...newCall, duration: e.target.value})}
                placeholder="e.g., 1 hour"
                className="bg-white/5 border-amber-500/20 text-white mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setCallType("video")}
                className={`p-4 rounded-lg border transition-all ${
                  callType === "video" 
                    ? "bg-amber-500/20 border-amber-500/50" 
                    : "bg-white/5 border-amber-500/10"
                }`}
              >
                <Video className="w-5 h-5 text-amber-500 mx-auto" />
                <p className="text-white text-sm mt-1">Video</p>
              </button>
              <button
                onClick={() => setCallType("audio")}
                className={`p-4 rounded-lg border transition-all ${
                  callType === "audio" 
                    ? "bg-indigo-500/20 border-indigo-500/50" 
                    : "bg-white/5 border-amber-500/10"
                }`}
              >
                <Phone className="w-5 h-5 text-indigo-400 mx-auto" />
                <p className="text-white text-sm mt-1">Audio</p>
              </button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScheduleModal(false)} className="border-amber-500/20 text-white hover:bg-white/5">
              Cancel
            </Button>
            <Button onClick={handleScheduleCall} className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30">
              Schedule Call
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Active Call Modal */}
      <Dialog open={showCallModal} onOpenChange={setShowCallModal}>
        <DialogContent className="bg-[#0a0a0f] border-amber-500/20 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {callType === "video" ? <Video className="w-5 h-5 text-amber-500" /> : <Phone className="w-5 h-5 text-indigo-400" />}
              {callType === "video" ? "Video" : "Audio"} Call in Progress
            </DialogTitle>
          </DialogHeader>
          <div className="py-8">
            <div className="aspect-video bg-black/50 rounded-lg flex items-center justify-center mb-6">
              {callType === "video" ? (
                <div className="text-center">
                  <div className="w-24 h-24 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl text-amber-400">EX</span>
                  </div>
                  <p className="text-white/50">Camera Preview</p>
                  <p className="text-white/30 text-sm">347 participants watching</p>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-24 h-24 rounded-full bg-indigo-500/20 flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <Phone className="w-12 h-12 text-indigo-400" />
                  </div>
                  <p className="text-white/50">Audio Call Active</p>
                  <p className="text-white/30 text-sm">12 participants connected</p>
                </div>
              )}
            </div>
            <div className="flex justify-center gap-4">
              <Button variant="outline" className="border-amber-500/20 text-white hover:bg-white/5">
                Mute
              </Button>
              {callType === "video" && (
                <Button variant="outline" className="border-amber-500/20 text-white hover:bg-white/5">
                  Stop Video
                </Button>
              )}
              <Button variant="outline" className="border-amber-500/20 text-white hover:bg-white/5">
                Share Screen
              </Button>
              <Button 
                onClick={() => {
                  setShowCallModal(false);
                  toast.success("Call ended");
                }}
                className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30"
              >
                <X className="w-4 h-4 mr-2" />
                End Call
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </ProtocolLayout>
  );
};

export default ExpertCalls;
