/**
 * Expert Students Page - Manage enrolled members
 * TODO: Fetch students from API with pagination
 * TODO: Implement real-time online status via WebSocket
 * TODO: Add bulk actions for student management
 */
import { useState, useEffect } from "react";
import { Search, Filter, Eye, Ban, Trash2, MoreHorizontal, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import ProtocolLayout from "@/components/protocol/ProtocolLayout";
import StatusDot from "@/components/protocol/StatusDot";
import EmptyState from "@/components/protocol/EmptyState";
import { protocolApi } from "@/lib/protocol-api";
import { toast } from "sonner";

const ExpertStudents = () => {
  const [students, setStudents] = useState<any[]>([]);
  const loadStudents = () => protocolApi.students.list().then(setStudents);
  useEffect(() => { loadStudents(); }, []);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "online" | "offline">("all");
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || student.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleBlock = () => {
    if (selectedStudent) {
      toast.success(`${selectedStudent.name} has been blocked`);
      setShowBlockModal(false);
    }
  };

  const handleRemove = async () => {
    if (selectedStudent) {
      await protocolApi.students.remove(selectedStudent.id);
      await loadStudents();
      toast.success(`${selectedStudent.name} has been removed`);
      setShowRemoveModal(false);
    }
  };

  return (
    <ProtocolLayout
      role="expert"
      breadcrumbs={[
        { label: "Expert Dashboard", href: "/protocol/expert" },
        { label: "Students", href: "/protocol/expert/students" }
      ]}
    >
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-light tracking-wide text-white mb-2">Students</h1>
            <p className="text-white/50">Manage your enrolled members</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/5 border-amber-500/20 text-white placeholder:text-white/40 w-64"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-amber-500/20 text-amber-400 hover:bg-amber-500/10">
                  <Filter className="w-4 h-4 mr-2" />
                  {statusFilter === "all" ? "All Status" : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-[#1a1a2e] border-amber-500/20">
                <DropdownMenuItem onClick={() => setStatusFilter("all")} className="text-white hover:bg-amber-500/10">
                  All Status
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("online")} className="text-white hover:bg-amber-500/10">
                  Online
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("offline")} className="text-white hover:bg-amber-500/10">
                  Offline
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-white/5 border-amber-500/10">
            <CardContent className="p-4">
              <p className="text-white/50 text-sm">Total Students</p>
              <p className="text-2xl font-semibold text-white">{students.length}</p>
            </CardContent>
          </Card>
          <Card className="bg-green-500/5 border-green-500/20">
            <CardContent className="p-4">
              <p className="text-white/50 text-sm">Online Now</p>
              <p className="text-2xl font-semibold text-green-400">
                {students.filter(s => s.status === "online").length}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-amber-500/10">
            <CardContent className="p-4">
              <p className="text-white/50 text-sm">Offline</p>
              <p className="text-2xl font-semibold text-white/60">
                {students.filter(s => s.status === "offline").length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Students Table */}
        <Card className="bg-white/5 border-amber-500/10">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-amber-500/10">
                    <th className="text-left p-4 text-white/50 font-medium">Student</th>
                    <th className="text-left p-4 text-white/50 font-medium">Status</th>
                    <th className="text-left p-4 text-white/50 font-medium">Last Active</th>
                    <th className="text-left p-4 text-white/50 font-medium">Joined</th>
                    <th className="text-right p-4 text-white/50 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="border-b border-amber-500/5 hover:bg-white/5 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 font-medium">
                            {student.avatar}
                          </div>
                          <div>
                            <p className="text-white font-medium">{student.name}</p>
                            <p className="text-white/50 text-sm">{student.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${student.status === 'online' ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`} />
                          <span className={student.status === 'online' ? 'text-green-400' : 'text-white/50'}>
                            {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-white/70">{student.lastActive}</td>
                      <td className="p-4 text-white/70">{student.joined}</td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedStudent(student);
                              setShowProfileModal(true);
                            }}
                            className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-white/50 hover:text-white hover:bg-white/10">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-[#1a1a2e] border-amber-500/20">
                              <DropdownMenuItem 
                                onClick={() => {
                                  setSelectedStudent(student);
                                  setShowBlockModal(true);
                                }}
                                className="text-yellow-400 hover:bg-yellow-500/10"
                              >
                                <Ban className="w-4 h-4 mr-2" />
                                Block
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => {
                                  setSelectedStudent(student);
                                  setShowRemoveModal(true);
                                }}
                                className="text-red-400 hover:bg-red-500/10"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profile Modal */}
      <Dialog open={showProfileModal} onOpenChange={setShowProfileModal}>
        <DialogContent className="bg-[#0a0a0f] border-amber-500/20 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Student Profile</DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 text-xl font-medium">
                  {selectedStudent.avatar}
                </div>
                <div>
                  <h3 className="text-xl font-medium">{selectedStudent.name}</h3>
                  <p className="text-white/50">{selectedStudent.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-amber-500/10">
                <div>
                  <p className="text-white/50 text-sm">Status</p>
                  <p className={selectedStudent.status === 'online' ? 'text-green-400' : 'text-white/70'}>
                    {selectedStudent.status.charAt(0).toUpperCase() + selectedStudent.status.slice(1)}
                  </p>
                </div>
                <div>
                  <p className="text-white/50 text-sm">Last Active</p>
                  <p className="text-white">{selectedStudent.lastActive}</p>
                </div>
                <div>
                  <p className="text-white/50 text-sm">Joined</p>
                  <p className="text-white">{selectedStudent.joined}</p>
                </div>
                <div>
                  <p className="text-white/50 text-sm">Engagement</p>
                  <p className="text-amber-400">High</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProfileModal(false)} className="border-amber-500/20 text-white hover:bg-white/5">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Block Modal */}
      <Dialog open={showBlockModal} onOpenChange={setShowBlockModal}>
        <DialogContent className="bg-[#0a0a0f] border-amber-500/20 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Block Student</DialogTitle>
          </DialogHeader>
          <p className="text-white/70">
            Are you sure you want to block {selectedStudent?.name}? They will no longer be able to access your content.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBlockModal(false)} className="border-amber-500/20 text-white hover:bg-white/5">
              Cancel
            </Button>
            <Button onClick={handleBlock} className="bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 border border-yellow-500/30">
              Block Student
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Modal */}
      <Dialog open={showRemoveModal} onOpenChange={setShowRemoveModal}>
        <DialogContent className="bg-[#0a0a0f] border-amber-500/20 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Remove Student</DialogTitle>
          </DialogHeader>
          <p className="text-white/70">
            Are you sure you want to remove {selectedStudent?.name}? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRemoveModal(false)} className="border-amber-500/20 text-white hover:bg-white/5">
              Cancel
            </Button>
            <Button onClick={handleRemove} className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30">
              Remove Student
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProtocolLayout>
  );
};

export default ExpertStudents;
