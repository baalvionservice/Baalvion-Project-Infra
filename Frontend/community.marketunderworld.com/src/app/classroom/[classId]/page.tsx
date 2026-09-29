
"use client"

import { use, useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Mic, MicOff, Video, VideoOff, Monitor, PenTool, Smile, Users, 
  Settings, X, PhoneOff, Circle, LogOut, Share2, Download, Eye, 
  FileText, Plus, Minus, Trash2, Undo2, Redo2, Camera, CheckCircle2, 
  Hand, Heart, Laugh, PartyPopper, ThumbsUp, Send, Paperclip, 
  Globe, Clock, Shield, Award, Gift, Zap, MessageSquare
} from "lucide-react"
import { NexusCard, NexusBadge } from "@/components/ui/nexus-card"
import { NexusButton } from "@/components/ui/nexus-button"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import Link from "next/link"

// --- Types ---
type Reaction = { id: number; emoji: React.ReactNode; x: number }
type Message = { id: number; author: string; role: 'teacher' | 'student' | 'system'; text: string; time: string }

export default function ClassroomPage({ params }: { params: Promise<{ classId: string }> }) {
  const resolvedParams = use(params)
  const classId = resolvedParams.classId
  const { toast } = useToast()

  // --- States ---
  const [isLive, setIsLive] = useState(true)
  const [timer, setTimer] = useState(1477) // 24:37 start
  const [isMicOn, setIsMicOn] = useState(false)
  const [isCamOn, setIsCamOn] = useState(true)
  const [isSharing, setIsSharing] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isWhiteboardActive, setIsWhiteboardActive] = useState(false)
  const [activeTab, setActiveTab] = useState<'chat' | 'notes' | 'people' | 'resources'>('chat')
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true)
  const [reactions, setReactions] = useState<Reaction[]>([])
  const [isHandRaised, setIsHandRaised] = useState(false)
  const [showReactionPicker, setShowReactionPicker] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isTipModalOpen, setIsTipModalOpen] = useState(false)
  const [isEndClassModalOpen, setIsEndClassModalOpen] = useState(false)
  const [isClassComplete, setIsClassComplete] = useState(false)

  // --- Timer Logic ---
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(prev => prev + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h > 0 ? h.toString().padStart(2, '0') + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  // --- Milestone Toasts ---
  useEffect(() => {
    if (timer === 1800) toast({ title: "⏱️ Halfway point!", description: "30 minutes remaining." })
    if (timer === 3000) toast({ variant: "destructive", title: "⚠️ 10 minutes remaining", description: "Wrap up your key concepts." })
  }, [timer, toast])

  // --- Reaction Handler ---
  const sendReaction = (emoji: React.ReactNode) => {
    const id = Date.now()
    setReactions(prev => [...prev, { id, emoji, x: Math.random() * 80 + 10 }])
    setTimeout(() => {
      setReactions(prev => prev.filter(r => r.id !== id))
    }, 3000)
    setShowReactionPicker(false)
  }

  const toggleHandRaise = () => {
    setIsHandRaised(!isHandRaised)
    if (!isHandRaised) sendReaction(<Hand className="w-8 h-8 text-yellow-400 fill-yellow-400" />)
  }

  if (isClassComplete) return <ClassSummaryScreen onBack={() => window.location.href = '/student/dashboard'} />

  return (
    <div className="h-screen w-screen bg-[#050508] text-white flex flex-col overflow-hidden select-none font-body">
      
      {/* --- TOP BAR --- */}
      <header className="h-12 border-b border-white/5 bg-[#0A0A0F] flex items-center justify-between px-4 shrink-0 z-[100]">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-lg nexus-gradient-bg flex items-center justify-center text-[10px] font-bold">NX</div>
          <div className="h-4 w-px bg-white/10" />
          <div className="text-xs font-bold truncate max-w-[200px]">Advanced Chemistry — Electrochemistry</div>
          <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest hidden md:block">#{classId}</div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">LIVE</span>
            </div>
            <div className="text-sm font-mono font-bold">{formatTime(timer)} <span className="text-gray-600">/ 60:00</span></div>
          </div>
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/5 border border-emerald-500/10 text-[10px] font-bold text-emerald-400 uppercase">
            <CheckCircle2 className="w-3 h-3" /> 0.02 ETH Paid
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-white/5 cursor-pointer">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4].map(i => <div key={i} className="w-1 h-3 bg-emerald-500 rounded-full" />)}
            </div>
            <span className="text-[10px] font-bold text-gray-500 uppercase">Excellent</span>
          </div>
          <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-gray-500 hover:text-white transition-colors">
            <Settings className="w-4 h-4" />
          </button>
          <button onClick={() => setIsEndClassModalOpen(true)} className="flex items-center gap-2 px-4 py-1.5 rounded-lg border border-red-500/20 text-red-500 hover:bg-red-500/10 transition-all text-xs font-bold">
            <LogOut className="w-3 h-3" /> Leave
          </button>
        </div>
      </header>

      {/* --- MAIN AREA --- */}
      <main className="flex-1 flex overflow-hidden relative">
        
        {/* VIDEO AREA */}
        <div className="flex-1 relative bg-black flex flex-col">
          <AnimatePresence mode="wait">
            {!isWhiteboardActive ? (
              <motion.div 
                key="video"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex-1 p-4 grid gap-4 relative"
              >
                {/* Main Teacher Video */}
                <div className={cn(
                  "relative bg-gray-900/40 rounded-2xl border border-white/5 overflow-hidden transition-all duration-500 flex items-center justify-center",
                  isSharing ? "h-32 w-48 absolute top-8 right-8 z-50 shadow-2xl" : "h-full w-full"
                )}>
                  {isCamOn ? (
                    <div className="absolute inset-0 nexus-gradient-bg opacity-20" />
                  ) : (
                    <div className="absolute inset-0 bg-[#0D0D14]" />
                  )}
                  
                  <div className="relative z-10 flex flex-col items-center gap-4">
                    <img src="https://picsum.photos/seed/priya/200/200" className={cn("rounded-full border-4 border-white/10 shadow-3xl", isSharing ? "w-12 h-12" : "w-32 h-32")} alt="Priya" />
                    {!isCamOn && <span className="text-gray-500 font-bold uppercase text-xs">Camera Off</span>}
                  </div>

                  <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/40 backdrop-blur-md border border-white/10">
                    <div className="text-[10px] font-bold">Priya Sharma <span className="text-blue-400">👨‍🏫 Teacher</span></div>
                    <Mic className="w-3 h-3 text-emerald-400" />
                  </div>
                  
                  <div className="absolute top-4 right-4">
                    <NexusBadge variant="info" className="bg-black/40 border-none px-3 py-1">📹 HD</NexusBadge>
                  </div>
                </div>

                {/* Shared Screen Placeholder */}
                {isSharing && (
                  <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    className="flex-1 bg-[#0D0D14] rounded-2xl border border-blue-500/20 flex flex-col items-center justify-center gap-6"
                  >
                    <div className="w-20 h-20 rounded-3xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                      <Monitor className="w-10 h-10" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-xl font-bold mb-1">Screen Share Active</h3>
                      <p className="text-sm text-gray-500">Teacher is presenting their screen</p>
                    </div>
                  </motion.div>
                )}

                {/* Student PiP */}
                <div className="absolute bottom-8 right-8 w-48 aspect-video bg-[#0D0D14] rounded-xl border border-white/10 overflow-hidden shadow-2xl z-50">
                  <div className="absolute inset-0 nexus-gradient-bg opacity-10" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <img src="https://picsum.photos/seed/aryan/100/100" className="w-12 h-12 rounded-full border-2 border-white/5" alt="You" />
                  </div>
                  <div className="absolute bottom-2 left-2 flex items-center gap-2 px-2 py-1 rounded-lg bg-black/40 text-[8px] font-bold border border-white/5">
                    Aryan Mehta (You)
                    {!isMicOn && <MicOff className="w-2 h-2 text-red-500" />}
                  </div>
                </div>
              </motion.div>
            ) : (
              <WhiteboardArea onClose={() => setIsWhiteboardActive(false)} />
            )}
          </AnimatePresence>

          {/* Floating Reactions Layer */}
          <div className="absolute inset-0 pointer-events-none z-[60]">
            <AnimatePresence>
              {reactions.map(r => (
                <motion.div
                  key={r.id}
                  initial={{ y: 0, opacity: 0, scale: 0.5 }}
                  animate={{ y: -400, opacity: [0, 1, 1, 0], scale: 1.5 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 3, ease: "easeOut" }}
                  className="absolute bottom-20 text-4xl"
                  style={{ left: `${r.x}%` }}
                >
                  {r.emoji}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <AnimatePresence>
          {isRightPanelOpen && (
            <motion.aside 
              initial={{ x: 320 }} animate={{ x: 0 }} exit={{ x: 320 }}
              className="w-80 bg-[#0D0D14] border-l border-white/5 flex flex-col shrink-0"
            >
              <div className="flex items-center p-1 bg-white/5 m-4 rounded-xl border border-white/5">
                {[
                  { id: 'chat', icon: <Smile className="w-4 h-4" /> },
                  { id: 'notes', icon: <FileText className="w-4 h-4" /> },
                  { id: 'people', icon: <Users className="w-4 h-4" /> },
                  { id: 'resources', icon: <Award className="w-4 h-4" /> },
                ].map(tab => (
                  <button 
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      "flex-1 flex items-center justify-center py-2.5 rounded-lg transition-all",
                      activeTab === tab.id ? "bg-[#16161F] text-blue-400 shadow-lg" : "text-gray-500 hover:text-gray-300"
                    )}
                  >
                    {tab.icon}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-4">
                {activeTab === 'chat' && <ChatTab />}
                {activeTab === 'notes' && <NotesTab />}
                {activeTab === 'people' && <PeopleTab />}
                {activeTab === 'resources' && <ResourcesTab />}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </main>

      {/* --- BOTTOM BAR --- */}
      <footer className="h-[72px] border-t border-white/5 bg-[#0A0A0F]/80 backdrop-blur-xl flex items-center justify-between px-8 shrink-0 z-[100]">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsTipModalOpen(true)}
            className="flex flex-col items-center gap-1 group"
          >
            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20 group-hover:scale-110 group-hover:bg-amber-500/20 transition-all">
              <Gift className="w-5 h-5" />
            </div>
            <span className="text-[9px] font-bold uppercase tracking-tighter text-gray-500 group-hover:text-amber-400">Tip Teacher</span>
          </button>
          <div className="h-8 w-px bg-white/5 mx-2" />
          <button className="flex flex-col items-center gap-1 group">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 border border-white/5 group-hover:bg-white/10 transition-all">
              <Plus className="w-5 h-5" />
            </div>
            <span className="text-[9px] font-bold uppercase tracking-tighter text-gray-500">Invite</span>
          </button>
        </div>

        <div className="flex items-center gap-6">
          <ControlBtn 
            active={isMicOn} 
            icon={isMicOn ? <Mic /> : <MicOff />} 
            label={isMicOn ? "Mute" : "Unmute"} 
            onClick={() => setIsMicOn(!isMicOn)}
            danger={!isMicOn}
          />
          <ControlBtn 
            active={isCamOn} 
            icon={isCamOn ? <Video /> : <VideoOff />} 
            label={isCamOn ? "Stop Cam" : "Start Cam"} 
            onClick={() => setIsCamOn(!isCamOn)}
            danger={!isCamOn}
          />
          <ControlBtn 
            active={isSharing} 
            icon={<Monitor />} 
            label="Share" 
            onClick={() => setIsSharing(!isSharing)}
            color="blue"
          />
          <ControlBtn 
            active={isWhiteboardActive} 
            icon={<PenTool />} 
            label="Board" 
            onClick={() => setIsWhiteboardActive(!isWhiteboardActive)}
            color="purple"
          />
          <div className="relative">
            <ControlBtn 
              active={showReactionPicker} 
              icon={<Smile />} 
              label="React" 
              onClick={() => setShowReactionPicker(!showReactionPicker)}
            />
            {showReactionPicker && (
              <motion.div 
                initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                className="absolute bottom-20 left-1/2 -translate-x-1/2 p-3 bg-[#111118] border border-white/10 rounded-2xl flex gap-3 shadow-3xl"
              >
                {[
                  { icon: <ThumbsUp className="w-5 h-5" />, color: "text-blue-400" },
                  { icon: <Heart className="w-5 h-5" />, color: "text-red-400" },
                  { icon: <Laugh className="w-5 h-5" />, color: "text-yellow-400" },
                  { icon: <Eye className="w-5 h-5" />, color: "text-purple-400" },
                  { icon: <PartyPopper className="w-5 h-5" />, color: "text-emerald-400" },
                ].map((r, i) => (
                  <button 
                    key={i} 
                    onClick={() => sendReaction(r.icon)}
                    className={cn("p-2 rounded-xl hover:bg-white/5 transition-all", r.color)}
                  >
                    {r.icon}
                  </button>
                ))}
              </motion.div>
            )}
          </div>
          <ControlBtn 
            active={isRecording} 
            icon={<Circle className={cn(isRecording && "fill-red-500")} />} 
            label="Record" 
            onClick={() => {
              setIsRecording(!isRecording)
              toast({ title: isRecording ? "Recording Stopped" : "Recording Started", description: isRecording ? "Saved to your dashboard." : "Saving to cloud..." })
            }}
            danger={isRecording}
          />
        </div>

        <div className="flex items-center gap-4">
          <ControlBtn 
            active={isHandRaised} 
            icon={<Hand />} 
            label="Hand" 
            onClick={toggleHandRaise}
            color="yellow"
          />
          <ControlBtn 
            active={isRightPanelOpen} 
            icon={<MessageSquare />} 
            label="Panel" 
            onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
          />
          <div className="h-8 w-px bg-white/5 mx-2" />
          <NexusButton 
            variant="danger" 
            size="sm" 
            className="px-6 h-12"
            onClick={() => setIsEndClassModalOpen(true)}
          >
            End Class
          </NexusButton>
        </div>
      </footer>

      {/* --- MODALS --- */}
      <AnimatePresence>
        {isTipModalOpen && (
          <Modal title="⭐ Tip Teacher" onClose={() => setIsTipModalOpen(false)}>
            <div className="space-y-8 text-center">
              <div className="w-20 h-20 rounded-3xl bg-amber-500/10 flex items-center justify-center text-amber-500 mx-auto shadow-2xl">
                <Gift className="w-10 h-10" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[0.001, 0.005, 0.01, 0.02].map(amt => (
                  <button key={amt} className="p-4 rounded-2xl bg-white/5 border border-white/10 font-bold hover:border-amber-500/50 transition-all">
                    {amt} ETH
                  </button>
                ))}
              </div>
              <textarea className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm" placeholder="Add a message..." rows={3} />
              <NexusButton className="w-full h-14 bg-amber-500 text-black hover:bg-amber-400 font-bold text-lg" onClick={() => {
                setIsTipModalOpen(false)
                toast({ title: "Tip Sent! 🎉", description: "Teacher has been notified." })
              }}>Send Tip</NexusButton>
            </div>
          </Modal>
        )}

        {isEndClassModalOpen && (
          <Modal title="End Class Session?" onClose={() => setIsEndClassModalOpen(false)}>
            <div className="space-y-8">
              <div className="p-6 bg-white/5 rounded-2xl border border-white/5 space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Duration</span>
                  <span className="font-bold">{formatTime(timer)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Recording</span>
                  <span className="text-emerald-400 font-bold">Saved ✅</span>
                </div>
              </div>
              <div className="flex gap-4">
                <NexusButton variant="outline" className="flex-1 h-14" onClick={() => setIsEndClassModalOpen(false)}>Continue</NexusButton>
                <NexusButton variant="danger" className="flex-1 h-14" onClick={() => setIsClassComplete(true)}>End Session</NexusButton>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

    </div>
  )
}

// --- Sub-Components ---

function ControlBtn({ active, icon, label, onClick, danger, color }: any) {
  const colorMap: any = {
    blue: "text-blue-400",
    purple: "text-purple-400",
    yellow: "text-yellow-400",
    red: "text-red-400"
  }

  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1 group">
      <div className={cn(
        "w-12 h-12 rounded-full flex items-center justify-center transition-all border",
        active ? (danger ? "bg-red-500/20 border-red-500/40 text-red-400" : "bg-white/10 border-white/20 text-white shadow-lg") : "bg-white/5 border-white/5 text-gray-500 group-hover:bg-white/10",
        active && color && `bg-${color}-500/20 border-${color}-500/40 ${colorMap[color]}`
      )}>
        {icon}
      </div>
      <span className="text-[9px] font-bold uppercase tracking-tighter text-gray-500 group-hover:text-white">{label}</span>
    </button>
  )
}

function Modal({ title, onClose, children }: any) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-lg bg-[#111118] border border-white/10 rounded-[2.5rem] p-10 relative shadow-3xl"
      >
        <button onClick={onClose} className="absolute top-8 right-8 p-2 text-gray-500 hover:text-white"><X /></button>
        <h3 className="text-2xl font-bold mb-10">{title}</h3>
        {children}
      </motion.div>
    </div>
  )
}

function WhiteboardArea({ onClose }: any) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [tool, setTool] = useState('pen')
  const [color, setColor] = useState('#00D4FF')

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Set canvas size to parent
    canvas.width = canvas.parentElement?.clientWidth || 800
    canvas.height = canvas.parentElement?.clientHeight || 600
    ctx.lineCap = 'round'
    ctx.lineWidth = 3
  }, [])

  const startDrawing = (e: any) => {
    setIsDrawing(true)
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    ctx.beginPath()
    ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY)
  }

  const draw = (e: any) => {
    if (!isDrawing) return
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    ctx.strokeStyle = color
    ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY)
    ctx.stroke()
  }

  const stopDrawing = () => setIsDrawing(false)

  return (
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
      className="flex-1 p-4 flex gap-4"
    >
      {/* Tools */}
      <div className="w-16 bg-[#0D0D14] border border-white/5 rounded-2xl flex flex-col items-center gap-4 py-6 shrink-0">
        <button onClick={() => setTool('pen')} className={cn("p-3 rounded-xl transition-all", tool === 'pen' ? "bg-blue-500 text-white" : "text-gray-500")}><Plus /></button>
        <button onClick={() => setTool('rect')} className={cn("p-3 rounded-xl transition-all", tool === 'rect' ? "bg-blue-500 text-white" : "text-gray-500")}><Minus /></button>
        <button onClick={() => setTool('circle')} className={cn("p-3 rounded-xl transition-all", tool === 'circle' ? "bg-blue-500 text-white" : "text-gray-500")}><Circle /></button>
        <div className="h-px w-8 bg-white/5" />
        {['#00D4FF', '#FF3D57', '#00E676', '#FFFFFF'].map(c => (
          <button key={c} onClick={() => setColor(c)} className={cn("w-6 h-6 rounded-full border-2 border-black", color === c ? "ring-2 ring-blue-500" : "")} style={{ background: c }} />
        ))}
        <div className="mt-auto flex flex-col gap-4">
          <button className="p-3 text-gray-500 hover:text-white"><Undo2 /></button>
          <button onClick={onClose} className="p-3 text-red-500 hover:bg-red-500/10 rounded-xl"><X /></button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 bg-[#111118] border border-white/5 rounded-2xl relative overflow-hidden">
        <canvas 
          ref={canvasRef} 
          onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing}
          className="cursor-crosshair w-full h-full"
        />
        <div className="absolute top-4 left-4 flex gap-2">
          <NexusBadge variant="info" className="bg-black/40 backdrop-blur-md">Whiteboard Active</NexusBadge>
          <span className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-2">
            <Circle className="w-2 h-2 fill-emerald-500 text-emerald-500" /> Teacher is drawing...
          </span>
        </div>
      </div>
    </motion.div>
  )
}

function ChatTab() {
  return (
    <div className="flex flex-col h-full gap-4 pt-4">
      <div className="flex-1 space-y-6 overflow-y-auto no-scrollbar">
        <ChatMessage author="Priya S." role="teacher" text="Good morning Aryan! Today we'll cover electrochemistry fundamentals" time="9:02 AM" />
        <ChatMessage author="Aryan M." role="student" text="Good morning! Ready to learn 🎯" time="9:02 AM" />
        <ChatMessage author="Priya S." role="teacher" text="Perfect! ✅ Exactly right. Now let's look at the diagram..." time="9:06 AM" />
        <div className="text-[10px] font-bold text-gray-600 uppercase text-center py-2">Aryan raised their hand ✋</div>
      </div>
      <div className="p-3 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-3">
        <input className="bg-transparent border-none focus:ring-0 text-sm flex-1" placeholder="Type a message..." />
        <Send className="w-4 h-4 text-blue-400 cursor-pointer" />
      </div>
    </div>
  )
}

function ChatMessage({ author, role, text, time }: any) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-baseline px-1">
        <span className={cn("text-[10px] font-bold uppercase", role === 'teacher' ? "text-blue-400" : "text-purple-400")}>{author}</span>
        <span className="text-[8px] text-gray-600">{time}</span>
      </div>
      <div className={cn("p-3 rounded-2xl text-xs leading-relaxed", role === 'teacher' ? "bg-blue-500/10 border-l-2 border-blue-500" : "bg-purple-500/10 border-l-2 border-purple-500")}>
        {text}
      </div>
    </div>
  )
}

function NotesTab() {
  return (
    <div className="pt-4 space-y-6">
      <div className="p-6 bg-[#111118] border border-white/5 rounded-2xl min-h-[400px]">
        <h2 className="text-xl font-bold mb-4">Class Notes</h2>
        <div className="space-y-4 text-xs text-gray-400 leading-relaxed">
          <p className="font-bold text-white">## Electrochemistry — Class 24</p>
          <p>• Electrolysis definition</p>
          <p>• Electrolytic cell components</p>
          <p>• Anode = oxidation (AN OX)</p>
          <p>• Cathode = reduction (RED CAT)</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <NexusButton variant="outline" size="sm" className="h-10 text-[10px]">Export PDF</NexusButton>
        <NexusButton variant="primary" size="sm" className="h-10 text-[10px] nexus-gradient-bg">Save Notes</NexusButton>
      </div>
    </div>
  )
}

function PeopleTab() {
  return (
    <div className="pt-4 space-y-4">
      <ParticipantCard name="Priya Sharma" role="Teacher" avatar="https://picsum.photos/seed/priya/100/100" mic cam />
      <ParticipantCard name="Aryan Mehta" role="Student" avatar="https://picsum.photos/seed/aryan/100/100" mic={false} cam />
    </div>
  )
}

function ParticipantCard({ name, role, avatar, mic, cam }: any) {
  return (
    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="relative">
          <img src={avatar} className="w-10 h-10 rounded-xl" alt="avatar" />
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0D0D14]" />
        </div>
        <div>
          <div className="text-xs font-bold">{name}</div>
          <div className="text-[10px] text-gray-500 font-bold uppercase">{role}</div>
        </div>
      </div>
      <div className="flex gap-2">
        {mic ? <Mic className="w-3.5 h-3.5 text-emerald-400" /> : <MicOff className="w-3.5 h-3.5 text-red-400" />}
        {cam ? <Video className="w-3.5 h-3.5 text-emerald-400" /> : <VideoOff className="w-3.5 h-3.5 text-red-400" />}
      </div>
    </div>
  )
}

function ResourcesTab() {
  return (
    <div className="pt-4 space-y-6">
      <div className="space-y-3">
        <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Shared Files</h4>
        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between group cursor-pointer hover:border-blue-500/30 transition-all">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-blue-400" />
            <div className="text-[10px] font-bold truncate max-w-[120px]">Electrochemistry Ch8.pdf</div>
          </div>
          <Download className="w-4 h-4 text-gray-600 group-hover:text-blue-400" />
        </div>
      </div>
      
      <div className="space-y-3">
        <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Teacher store</h4>
        <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600/10 to-transparent border border-blue-500/20">
          <div className="text-[10px] font-bold text-blue-400 mb-1">Chemistry Full Bundle</div>
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold">0.02 ETH</span>
            <button className="text-[10px] font-bold text-white bg-blue-600 px-3 py-1 rounded-md">Buy</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ClassSummaryScreen({ onBack }: any) {
  return (
    <div className="h-screen w-screen bg-[#050508] flex items-center justify-center p-6">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-2xl text-center space-y-12"
      >
        <div className="space-y-4">
          <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h1 className="text-5xl font-bold tracking-tight">Class Complete!</h1>
          <p className="text-xl text-gray-500 font-medium">Great session, Aryan! You covered 3 new topics today.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <SummaryStat label="Duration" val="47:32" />
          <SummaryStat label="Topics" val="3 Complete" />
          <SummaryStat label="XP Earned" val="+45 XP" />
        </div>

        <NexusCard className="p-10 border-white/5 bg-white/[0.02] space-y-8">
          <h3 className="text-xl font-bold">How was your class with Priya?</h3>
          <div className="flex justify-center gap-4">
            {[1, 2, 3, 4, 5].map(i => <button key={i} className="text-4xl hover:scale-125 transition-transform">⭐</button>)}
          </div>
          <textarea className="w-full bg-black/40 border border-white/10 rounded-2xl p-6 text-sm" placeholder="Add an optional comment..." rows={3} />
          <NexusButton className="w-full h-14 nexus-gradient-bg text-lg" onClick={onBack}>Submit & Finish</NexusButton>
        </NexusCard>
      </motion.div>
    </div>
  )
}

function SummaryStat({ label, val }: any) {
  return (
    <div className="p-6 rounded-3xl bg-white/5 border border-white/5">
      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{label}</div>
      <div className="text-2xl font-bold">{val}</div>
    </div>
  )
}
