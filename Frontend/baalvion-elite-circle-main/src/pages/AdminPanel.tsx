import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, Clock, Shield, Users, FileText, MessageSquare, Tag, Trash2, Edit, Plus, ListCheck, TrendingUp, BarChart3, Download, CalendarIcon, ArrowLeftRight, Mail, Loader2, Settings, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line, Legend } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Application = {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  role_title: string;
  company: string;
  bio: string;
  reason_for_joining: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  proof_url: string | null;
};

type TagType = {
  id: string;
  name: string;
  slug: string;
  color: string;
  icon: string | null;
  created_at: string;
};

type ThreadWithTags = {
  id: string;
  title: string;
  author_id: string;
  created_at: string;
  views: number;
  status: string;
  profiles: {
    username: string;
  };
  tags: TagType[];
};

type TagAnalytics = {
  tag: TagType;
  usage_count: number;
  recent_usage_count: number;
  trend_percentage: number;
};

type TimeSeriesData = {
  period: string;
  [tagName: string]: number | string;
};

export default function AdminPanel() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [moderatorNotes, setModeratorNotes] = useState("");
  
  // Tag management states
  const [tags, setTags] = useState<TagType[]>([]);
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<TagType | null>(null);
  const [tagForm, setTagForm] = useState({
    name: "",
    slug: "",
    color: "#3b82f6",
    icon: ""
  });

  // Bulk tag operations states
  const [threads, setThreads] = useState<ThreadWithTags[]>([]);
  const [selectedThreads, setSelectedThreads] = useState<Set<string>>(new Set());
  const [bulkTags, setBulkTags] = useState<Set<string>>(new Set());
  const [loadingThreads, setLoadingThreads] = useState(false);

  // Analytics states
  const [tagAnalytics, setTagAnalytics] = useState<TagAnalytics[]>([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [trendPeriod, setTrendPeriod] = useState<'weekly' | 'monthly' | 'custom'>('weekly');
  
  // Custom date range states
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>();
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>();
  
  // Comparison states
  const [comparisonMode, setComparisonMode] = useState(false);
  const [comparisonStartDate, setComparisonStartDate] = useState<Date | undefined>();
  const [comparisonEndDate, setComparisonEndDate] = useState<Date | undefined>();
  const [comparisonData, setComparisonData] = useState<{ tag: string; current: number; previous: number; change: number }[]>([]);
  
  // Scheduled reports states
  const [generatingReport, setGeneratingReport] = useState(false);
  const [lastReport, setLastReport] = useState<any>(null);
  const [reportSchedule, setReportSchedule] = useState<{ frequency: string; day: number; hour: number }>({
    frequency: 'weekly',
    day: 1,
    hour: 8
  });
  const [updatingSchedule, setUpdatingSchedule] = useState(false);
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [reportHistory, setReportHistory] = useState<any[]>([]);
  const [filteredReportHistory, setFilteredReportHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedReportDetail, setSelectedReportDetail] = useState<any>(null);
  const [reportTypeFilter, setReportTypeFilter] = useState<string>("all");
  const [reportDateStart, setReportDateStart] = useState<Date | undefined>();
  const [reportDateEnd, setReportDateEnd] = useState<Date | undefined>();
  const [selectedReportIds, setSelectedReportIds] = useState<Set<string>>(new Set());
  const [deletingReports, setDeletingReports] = useState(false);
  const [reportCurrentPage, setReportCurrentPage] = useState(1);
  const [reportsPerPage] = useState(5);
  const [compareReports, setCompareReports] = useState<[any, any] | null>(null);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Please sign in");
        navigate("/auth");
        return;
      }

      // Check if user has admin role using RPC function
      const { data: hasAdminRole, error } = await supabase
        .rpc('has_role', { _user_id: user.id, _role: 'admin' });

      if (error) {
        console.error("Role check error:", error);
        toast.error("Access denied");
        navigate("/dashboard");
        return;
      }

      if (!hasAdminRole) {
        toast.error("Admin access required");
        navigate("/dashboard");
        return;
      }

      setIsAdmin(true);
      loadApplications();
      loadTags();
      loadThreads();
      loadTagAnalytics();
      loadTimeSeriesData('weekly');
      loadReportSchedule();
      loadReportHistory();
    } catch (error: any) {
      console.error("Admin check error:", error);
      toast.error("Failed to verify admin status");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const loadApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('elite_applications' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications((data as any) || []);
    } catch (error: any) {
      console.error("Failed to load applications:", error);
      toast.error("Failed to load applications");
    }
  };

  const handleApplicationAction = async (applicationId: string, newStatus: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('elite_applications' as any)
        .update({ 
          status: newStatus,
          moderator_notes: moderatorNotes || null
        })
        .eq('id', applicationId);

      if (error) throw error;

      // If approved, assign elite role
      if (newStatus === 'approved' && selectedApp) {
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: selectedApp.user_id,
            role: 'moderator'
          });

        if (roleError && roleError.code !== '23505') { // Ignore duplicate errors
          console.error("Role assignment error:", roleError);
        }
      }

      toast.success(`Application ${newStatus}`);
      setModeratorNotes("");
      setSelectedApp(null);
      loadApplications();
    } catch (error: any) {
      console.error("Action error:", error);
      toast.error("Failed to update application");
    }
  };

  const loadTags = async () => {
    try {
      const { data, error } = await supabase
        .from('tags' as any)
        .select('*')
        .order('name');

      if (error) throw error;
      setTags((data as any) || []);
    } catch (error: any) {
      console.error("Failed to load tags:", error);
      toast.error("Failed to load tags");
    }
  };

  const loadThreads = async () => {
    setLoadingThreads(true);
    try {
      const { data: threadsData, error } = await supabase
        .from('forum_threads' as any)
        .select(`
          id,
          title,
          author_id,
          created_at,
          views,
          status,
          profiles!forum_threads_author_id_fkey (
            username
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Fetch tags for each thread
      const threadsWithTags = await Promise.all(
        (threadsData || []).map(async (thread: any) => {
          const { data: threadTagsData } = await supabase
            .from('thread_tags' as any)
            .select(`
              tags (
                id,
                name,
                slug,
                color,
                icon
              )
            `)
            .eq('thread_id', thread.id);

          return {
            ...thread,
            tags: threadTagsData?.map((tt: any) => tt.tags).filter(Boolean) || []
          };
        })
      );

      setThreads(threadsWithTags);
    } catch (error: any) {
      console.error("Failed to load threads:", error);
      toast.error("Failed to load threads");
    } finally {
      setLoadingThreads(false);
    }
  };

  const loadTagAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      // Get all tags
      const { data: allTags, error: tagsError } = await supabase
        .from('tags' as any)
        .select('*');

      if (tagsError) throw tagsError;

      // Calculate date for "recent" (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      const analyticsData: TagAnalytics[] = await Promise.all(
        (allTags || []).map(async (tag: any) => {
          // Get total usage count
          const { count: totalCount } = await supabase
            .from('thread_tags' as any)
            .select('*', { count: 'exact', head: true })
            .eq('tag_id', tag.id);

          // Get recent usage count (last 30 days)
          const { data: recentThreadTags } = await supabase
            .from('thread_tags' as any)
            .select('thread_id, created_at')
            .eq('tag_id', tag.id);

          const recentCount = (recentThreadTags || []).filter((tt: any) => {
            const createdDate = new Date(tt.created_at);
            return createdDate >= thirtyDaysAgo;
          }).length;

          // Get previous period count (30-60 days ago) for trend calculation
          const previousCount = (recentThreadTags || []).filter((tt: any) => {
            const createdDate = new Date(tt.created_at);
            return createdDate >= sixtyDaysAgo && createdDate < thirtyDaysAgo;
          }).length;

          // Calculate trend percentage
          const trendPercentage = previousCount > 0 
            ? ((recentCount - previousCount) / previousCount) * 100 
            : recentCount > 0 ? 100 : 0;

          return {
            tag,
            usage_count: totalCount || 0,
            recent_usage_count: recentCount,
            trend_percentage: Math.round(trendPercentage)
          };
        })
      );

      // Sort by usage count
      analyticsData.sort((a, b) => b.usage_count - a.usage_count);
      setTagAnalytics(analyticsData);
    } catch (error: any) {
      console.error("Failed to load analytics:", error);
      toast.error("Failed to load tag analytics");
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const loadTimeSeriesData = async (period: 'weekly' | 'monthly' | 'custom', startDate?: Date, endDate?: Date) => {
    try {
      const { data: allTags } = await supabase.from('tags' as any).select('*');
      const { data: allThreadTags } = await supabase.from('thread_tags' as any).select('tag_id, created_at');

      if (!allTags || !allThreadTags) return;

      // Get top 5 tags by usage
      const tagUsage = new Map<string, number>();
      allThreadTags.forEach((tt: any) => {
        tagUsage.set(tt.tag_id, (tagUsage.get(tt.tag_id) || 0) + 1);
      });
      
      const topTags = allTags
        .sort((a: any, b: any) => (tagUsage.get(b.id) || 0) - (tagUsage.get(a.id) || 0))
        .slice(0, 5);

      // Generate periods
      const now = new Date();
      const periods: { start: Date; end: Date; label: string }[] = [];
      
      if (period === 'custom' && startDate && endDate) {
        const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const numPeriods = Math.min(12, Math.max(4, Math.ceil(daysDiff / 7)));
        const periodLength = daysDiff / numPeriods;
        
        for (let i = 0; i < numPeriods; i++) {
          const start = new Date(startDate.getTime() + i * periodLength * 24 * 60 * 60 * 1000);
          const end = new Date(startDate.getTime() + (i + 1) * periodLength * 24 * 60 * 60 * 1000);
          periods.push({
            start,
            end,
            label: format(start, 'MMM d')
          });
        }
      } else if (period === 'weekly') {
        for (let i = 11; i >= 0; i--) {
          const end = new Date(now);
          end.setDate(now.getDate() - i * 7);
          const start = new Date(end);
          start.setDate(end.getDate() - 7);
          periods.push({ start, end, label: `W${12 - i}` });
        }
      } else {
        for (let i = 5; i >= 0; i--) {
          const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
          const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
          periods.push({ start, end, label: start.toLocaleDateString('en-US', { month: 'short' }) });
        }
      }

      // Build time series
      const timeSeries: TimeSeriesData[] = periods.map(p => {
        const dataPoint: TimeSeriesData = { period: p.label };
        topTags.forEach((tag: any) => {
          const count = allThreadTags.filter((tt: any) => {
            const date = new Date(tt.created_at);
            return tt.tag_id === tag.id && date >= p.start && date <= p.end;
          }).length;
          dataPoint[tag.name] = count;
        });
        return dataPoint;
      });

      setTimeSeriesData(timeSeries);
    } catch (error) {
      console.error("Failed to load time series:", error);
    }
  };

  const handlePeriodChange = (period: 'weekly' | 'monthly' | 'custom') => {
    setTrendPeriod(period);
    if (period !== 'custom') {
      loadTimeSeriesData(period);
    }
  };

  const handleCustomDateApply = () => {
    if (customStartDate && customEndDate) {
      setTrendPeriod('custom');
      loadTimeSeriesData('custom', customStartDate, customEndDate);
    } else {
      toast.error("Please select both start and end dates");
    }
  };

  const loadComparisonData = async () => {
    if (!customStartDate || !customEndDate || !comparisonStartDate || !comparisonEndDate) {
      toast.error("Please select all date ranges for comparison");
      return;
    }

    try {
      const { data: allTags } = await supabase.from('tags' as any).select('*');
      const { data: allThreadTags } = await supabase.from('thread_tags' as any).select('tag_id, created_at');

      if (!allTags || !allThreadTags) return;

      const comparison = allTags.map((tag: any) => {
        const currentCount = allThreadTags.filter((tt: any) => {
          const date = new Date(tt.created_at);
          return tt.tag_id === tag.id && date >= customStartDate && date <= customEndDate;
        }).length;

        const previousCount = allThreadTags.filter((tt: any) => {
          const date = new Date(tt.created_at);
          return tt.tag_id === tag.id && date >= comparisonStartDate && date <= comparisonEndDate;
        }).length;

        const change = previousCount > 0 ? Math.round(((currentCount - previousCount) / previousCount) * 100) : currentCount > 0 ? 100 : 0;

        return { tag: tag.name, color: tag.color, current: currentCount, previous: previousCount, change };
      }).filter((d: any) => d.current > 0 || d.previous > 0).sort((a: any, b: any) => b.current - a.current);

      setComparisonData(comparison);
      toast.success("Comparison loaded");
    } catch (error) {
      console.error("Failed to load comparison:", error);
      toast.error("Failed to load comparison");
    }
  };

  const handleTagSubmit = async () => {
    try {
      if (!tagForm.name || !tagForm.slug) {
        toast.error("Name and slug are required");
        return;
      }

      if (editingTag) {
        // Update existing tag
        const { error } = await supabase
          .from('tags' as any)
          .update({
            name: tagForm.name,
            slug: tagForm.slug,
            color: tagForm.color,
            icon: tagForm.icon || null
          })
          .eq('id', editingTag.id);

        if (error) throw error;
        toast.success("Tag updated successfully");
      } else {
        // Create new tag
        const { error } = await supabase
          .from('tags' as any)
          .insert({
            name: tagForm.name,
            slug: tagForm.slug,
            color: tagForm.color,
            icon: tagForm.icon || null
          });

        if (error) throw error;
      toast.success("Tag created successfully");
      }

      setIsTagDialogOpen(false);
      setEditingTag(null);
      setTagForm({ name: "", slug: "", color: "#3b82f6", icon: "" });
      loadTags();
      loadTagAnalytics();
    } catch (error: any) {
      console.error("Tag save error:", error);
      toast.error("Failed to save tag");
    }
  };

  const handleTagDelete = async (tagId: string) => {
    try {
      // Check if tag is in use
      const { data: usageCount } = await supabase
        .from('thread_tags' as any)
        .select('id', { count: 'exact', head: true })
        .eq('tag_id', tagId);

      if ((usageCount as any) > 0) {
        toast.error("Cannot delete tag that is in use");
        return;
      }

      const { error } = await supabase
        .from('tags' as any)
        .delete()
        .eq('id', tagId);

      if (error) throw error;
      toast.success("Tag deleted successfully");
      loadTags();
      loadTagAnalytics();
    } catch (error: any) {
      console.error("Tag delete error:", error);
      toast.error("Failed to delete tag");
    }
  };

  const openTagDialog = (tag?: TagType) => {
    if (tag) {
      setEditingTag(tag);
      setTagForm({
        name: tag.name,
        slug: tag.slug,
        color: tag.color,
        icon: tag.icon || ""
      });
    } else {
      setEditingTag(null);
      setTagForm({ name: "", slug: "", color: "#3b82f6", icon: "" });
    }
    setIsTagDialogOpen(true);
  };

  const handleThreadSelect = (threadId: string) => {
    const newSelection = new Set(selectedThreads);
    if (newSelection.has(threadId)) {
      newSelection.delete(threadId);
    } else {
      newSelection.add(threadId);
    }
    setSelectedThreads(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedThreads.size === threads.length) {
      setSelectedThreads(new Set());
    } else {
      setSelectedThreads(new Set(threads.map(t => t.id)));
    }
  };

  const handleBulkAddTags = async () => {
    if (selectedThreads.size === 0 || bulkTags.size === 0) {
      toast.error("Please select threads and tags");
      return;
    }

    try {
      const operations = [];
      for (const threadId of selectedThreads) {
        for (const tagId of bulkTags) {
          operations.push({
            thread_id: threadId,
            tag_id: tagId
          });
        }
      }

      const { error } = await supabase
        .from('thread_tags' as any)
        .upsert(operations, { onConflict: 'thread_id,tag_id' });

      if (error) throw error;

      toast.success(`Tags added to ${selectedThreads.size} thread(s)`);
      setSelectedThreads(new Set());
      setBulkTags(new Set());
      loadThreads();
      loadTagAnalytics();
    } catch (error: any) {
      console.error("Bulk add tags error:", error);
      toast.error("Failed to add tags");
    }
  };

  const handleBulkRemoveTags = async () => {
    if (selectedThreads.size === 0 || bulkTags.size === 0) {
      toast.error("Please select threads and tags");
      return;
    }

    try {
      for (const threadId of selectedThreads) {
        for (const tagId of bulkTags) {
          await supabase
            .from('thread_tags' as any)
            .delete()
            .eq('thread_id', threadId)
            .eq('tag_id', tagId);
        }
      }

      toast.success(`Tags removed from ${selectedThreads.size} thread(s)`);
      setSelectedThreads(new Set());
      setBulkTags(new Set());
      loadThreads();
      loadTagAnalytics();
    } catch (error: any) {
      console.error("Bulk remove tags error:", error);
      toast.error("Failed to remove tags");
    }
  };

  const handleTagToggleForBulk = (tagId: string) => {
    const newSelection = new Set(bulkTags);
    if (newSelection.has(tagId)) {
      newSelection.delete(tagId);
    } else {
      newSelection.add(tagId);
    }
    setBulkTags(newSelection);
  };

  const exportToCSV = () => {
    const headers = ["Tag Name", "Slug", "Color", "Total Uses", "Recent Uses (30d)", "Trend %"];
    const rows = tagAnalytics.map(a => [
      a.tag.name,
      a.tag.slug,
      a.tag.color,
      a.usage_count.toString(),
      a.recent_usage_count.toString(),
      `${a.trend_percentage}%`
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `tag-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success("CSV exported successfully");
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.text("Tag Analytics Report", 14, 22);
    
    // Date
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);
    
    // Summary stats
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Total Tags: ${tagAnalytics.length}`, 14, 42);
    doc.text(`Trending Up: ${tagAnalytics.filter(a => a.trend_percentage > 0).length}`, 14, 50);
    doc.text(`Total Tag Uses: ${tagAnalytics.reduce((sum, a) => sum + a.usage_count, 0)}`, 14, 58);
    
    // Table
    autoTable(doc, {
      startY: 68,
      head: [["Tag Name", "Slug", "Total Uses", "Recent (30d)", "Trend"]],
      body: tagAnalytics.map(a => [
        a.tag.name,
        a.tag.slug,
        a.usage_count.toString(),
        a.recent_usage_count.toString(),
        `${a.trend_percentage > 0 ? '+' : ''}${a.trend_percentage}%`
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [59, 130, 246] }
    });
    
    doc.save(`tag-analytics-${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success("PDF exported successfully");
  };

  const generateScheduledReport = async () => {
    setGeneratingReport(true);
    try {
      const { data, error } = await supabase.functions.invoke('scheduled-tag-report');
      
      if (error) throw error;
      
      setLastReport(data.report);
      loadReportHistory(); // Refresh history
      toast.success(`Report generated! ${data.notifiedModerators} moderator(s) notified.`);
    } catch (error: any) {
      console.error("Report generation error:", error);
      toast.error("Failed to generate report");
    } finally {
      setGeneratingReport(false);
    }
  };

  const loadReportSchedule = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings' as any)
        .select('value')
        .eq('key', 'report_schedule')
        .single();

      if (error) {
        // No schedule setting found; use component defaults
        return;
      }

      const settingData = data as any;
      if (settingData?.value) {
        setReportSchedule(settingData.value);
      }
    } catch (error) {
      console.error("Failed to load schedule:", error);
    }
  };

  const updateReportSchedule = async (newSchedule: { frequency: string; day: number; hour: number }) => {
    setUpdatingSchedule(true);
    try {
      const { data, error } = await supabase.functions.invoke('update-report-schedule', {
        body: newSchedule
      });
      
      if (error) throw error;
      
      setReportSchedule(newSchedule);
      toast.success(`Schedule updated to ${newSchedule.frequency}`);
    } catch (error: any) {
      console.error("Schedule update error:", error);
      toast.error("Failed to update schedule");
    } finally {
      setUpdatingSchedule(false);
    }
  };

  const loadReportHistory = async () => {
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('tag_analytics_reports' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setReportHistory(data || []);
    } catch (error) {
      console.error("Failed to load report history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Filter report history based on type and date range
  const applyReportFilters = () => {
    let filtered = [...reportHistory];
    
    if (reportTypeFilter !== "all") {
      filtered = filtered.filter(r => r.report_type === reportTypeFilter);
    }
    
    if (reportDateStart) {
      filtered = filtered.filter(r => new Date(r.created_at) >= reportDateStart);
    }
    
    if (reportDateEnd) {
      const endOfDay = new Date(reportDateEnd);
      endOfDay.setHours(23, 59, 59, 999);
      filtered = filtered.filter(r => new Date(r.created_at) <= endOfDay);
    }
    
    setFilteredReportHistory(filtered);
  };

  useEffect(() => {
    applyReportFilters();
    setReportCurrentPage(1); // Reset to first page when filters change
  }, [reportHistory, reportTypeFilter, reportDateStart, reportDateEnd]);

  const clearReportFilters = () => {
    setReportTypeFilter("all");
    setReportDateStart(undefined);
    setReportDateEnd(undefined);
    setReportCurrentPage(1);
  };

  // Pagination calculations
  const totalReportPages = Math.ceil(filteredReportHistory.length / reportsPerPage);
  const paginatedReports = filteredReportHistory.slice(
    (reportCurrentPage - 1) * reportsPerPage,
    reportCurrentPage * reportsPerPage
  );

  const exportReportHistoryToCSV = () => {
    if (filteredReportHistory.length === 0) {
      toast.error("No report history to export");
      return;
    }

    const headers = ["Report Type", "Created At", "Period Start", "Period End", "Total Threads", "Total Tag Usages", "Top Tags"];
    const rows = filteredReportHistory.map(report => [
      report.report_type,
      format(new Date(report.created_at), "yyyy-MM-dd HH:mm"),
      format(new Date(report.period_start), "yyyy-MM-dd"),
      format(new Date(report.period_end), "yyyy-MM-dd"),
      report.report_data?.totalThreads?.toString() || "0",
      report.report_data?.totalTagUsages?.toString() || "0",
      report.report_data?.topTags?.map((t: any) => `${t.name}(${t.count})`).join("; ") || ""
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `report-history-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success("Report history exported to CSV");
  };

  const exportReportHistoryToPDF = () => {
    if (filteredReportHistory.length === 0) {
      toast.error("No report history to export");
      return;
    }

    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text("Report History Export", 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);
    doc.text(`Total Reports: ${filteredReportHistory.length}`, 14, 36);
    
    autoTable(doc, {
      startY: 45,
      head: [["Type", "Created", "Period", "Threads", "Tag Uses"]],
      body: filteredReportHistory.map(report => [
        report.report_type,
        format(new Date(report.created_at), "MMM d, yyyy"),
        `${format(new Date(report.period_start), "MMM d")} - ${format(new Date(report.period_end), "MMM d")}`,
        report.report_data?.totalThreads?.toString() || "0",
        report.report_data?.totalTagUsages?.toString() || "0"
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [59, 130, 246] }
    });

    // Add top tags section for each report
    let yPosition = (doc as any).lastAutoTable.finalY + 15;
    
    filteredReportHistory.forEach((report, index) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text(`Report ${index + 1}: ${format(new Date(report.created_at), "MMM d, yyyy")}`, 14, yPosition);
      yPosition += 6;
      
      if (report.report_data?.topTags?.length > 0) {
        doc.setFontSize(9);
        doc.setTextColor(80);
        const topTagsText = report.report_data.topTags.slice(0, 10).map((t: any) => `${t.name}: ${t.count}`).join(", ");
        const splitText = doc.splitTextToSize(topTagsText, 180);
        doc.text(splitText, 14, yPosition);
        yPosition += splitText.length * 5 + 8;
      } else {
        yPosition += 8;
      }
    });
    
    doc.save(`report-history-${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success("Report history exported to PDF");
  };

  const deleteReport = async (reportId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening the detail modal
    
    if (!confirm("Are you sure you want to delete this report?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('tag_analytics_reports' as any)
        .delete()
        .eq('id', reportId);

      if (error) throw error;
      
      toast.success("Report deleted successfully");
      loadReportHistory();
    } catch (error: any) {
      console.error("Delete report error:", error);
      toast.error("Failed to delete report");
    }
  };

  const toggleReportSelection = (reportId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSelection = new Set(selectedReportIds);
    if (newSelection.has(reportId)) {
      newSelection.delete(reportId);
    } else {
      newSelection.add(reportId);
    }
    setSelectedReportIds(newSelection);
  };

  const toggleAllReports = () => {
    const currentPageIds = paginatedReports.map((r: any) => r.id);
    const allCurrentSelected = currentPageIds.every((id: string) => selectedReportIds.has(id));
    
    if (allCurrentSelected) {
      // Deselect all on current page
      const newSelection = new Set(selectedReportIds);
      currentPageIds.forEach((id: string) => newSelection.delete(id));
      setSelectedReportIds(newSelection);
    } else {
      // Select all on current page
      const newSelection = new Set(selectedReportIds);
      currentPageIds.forEach((id: string) => newSelection.add(id));
      setSelectedReportIds(newSelection);
    }
  };

  const bulkDeleteReports = async () => {
    if (selectedReportIds.size === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedReportIds.size} report(s)?`)) {
      return;
    }

    setDeletingReports(true);
    try {
      const { error } = await supabase
        .from('tag_analytics_reports' as any)
        .delete()
        .in('id', Array.from(selectedReportIds));

      if (error) throw error;
      
      toast.success(`${selectedReportIds.size} report(s) deleted successfully`);
      setSelectedReportIds(new Set());
      loadReportHistory();
    } catch (error: any) {
      console.error("Bulk delete error:", error);
      toast.error("Failed to delete reports");
    } finally {
      setDeletingReports(false);
    }
  };

  const exportComparisonToPDF = (reports: [any, any]) => {
    const doc = new jsPDF();
    const [older, newer] = reports;
    
    // Title
    doc.setFontSize(20);
    doc.text("Report Comparison", 14, 22);
    
    // Date
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);
    
    // Report headers
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text("Comparing Reports:", 14, 42);
    
    doc.setFontSize(10);
    doc.text(`Older: ${format(new Date(older.created_at), "PPP")} (${older.report_type})`, 14, 50);
    doc.text(`  Period: ${format(new Date(older.period_start), "MMM d")} - ${format(new Date(older.period_end), "MMM d, yyyy")}`, 14, 56);
    doc.text(`Newer: ${format(new Date(newer.created_at), "PPP")} (${newer.report_type})`, 14, 66);
    doc.text(`  Period: ${format(new Date(newer.period_start), "MMM d")} - ${format(new Date(newer.period_end), "MMM d, yyyy")}`, 14, 72);
    
    // Stats comparison table
    const oldThreads = older.report_data?.totalThreads || 0;
    const newThreads = newer.report_data?.totalThreads || 0;
    const threadsDiff = oldThreads > 0 ? Math.round(((newThreads - oldThreads) / oldThreads) * 100) : (newThreads > 0 ? 100 : 0);
    
    const oldUsages = older.report_data?.totalTagUsages || 0;
    const newUsages = newer.report_data?.totalTagUsages || 0;
    const usagesDiff = oldUsages > 0 ? Math.round(((newUsages - oldUsages) / oldUsages) * 100) : (newUsages > 0 ? 100 : 0);
    
    const oldTags = older.report_data?.topTags?.length || 0;
    const newTags = newer.report_data?.topTags?.length || 0;
    const tagsDiff = newTags - oldTags;
    
    autoTable(doc, {
      startY: 82,
      head: [["Metric", "Older Report", "Newer Report", "Change"]],
      body: [
        ["New Threads", oldThreads.toString(), newThreads.toString(), `${threadsDiff >= 0 ? "+" : ""}${threadsDiff}%`],
        ["Tag Usages", oldUsages.toString(), newUsages.toString(), `${usagesDiff >= 0 ? "+" : ""}${usagesDiff}%`],
        ["Active Tags", oldTags.toString(), newTags.toString(), `${tagsDiff >= 0 ? "+" : ""}${tagsDiff}`]
      ],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [59, 130, 246] }
    });
    
    // Top tags comparison
    let yPosition = (doc as any).lastAutoTable.finalY + 15;
    
    doc.setFontSize(12);
    doc.text("Top Tags Comparison", 14, yPosition);
    yPosition += 8;
    
    // Build tag comparison data
    const allTagNames = new Set<string>();
    older.report_data?.topTags?.forEach((t: any) => allTagNames.add(t.name));
    newer.report_data?.topTags?.forEach((t: any) => allTagNames.add(t.name));
    
    const tagComparisonData: string[][] = [];
    allTagNames.forEach(tagName => {
      const oldTag = older.report_data?.topTags?.find((t: any) => t.name === tagName);
      const newTag = newer.report_data?.topTags?.find((t: any) => t.name === tagName);
      const oldCount = oldTag?.count || 0;
      const newCount = newTag?.count || 0;
      const diff = newCount - oldCount;
      tagComparisonData.push([
        tagName,
        oldCount.toString(),
        newCount.toString(),
        `${diff >= 0 ? "+" : ""}${diff}`
      ]);
    });
    
    // Sort by newer count descending
    tagComparisonData.sort((a, b) => parseInt(b[2]) - parseInt(a[2]));
    
    if (tagComparisonData.length > 0) {
      autoTable(doc, {
        startY: yPosition,
        head: [["Tag Name", "Older", "Newer", "Change"]],
        body: tagComparisonData.slice(0, 20),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [34, 197, 94] }
      });
    }
    
    doc.save(`report-comparison-${new Date().toISOString().split("T")[0]}.pdf`);
    toast.success("Comparison exported to PDF");
  };

  const generateEmailPreviewHtml = (): string => {
    // Use lastReport data if available, otherwise use sample data
    const reportData = lastReport || {
      period: {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString(),
      },
      totalThreads: tagAnalytics.reduce((sum, a) => sum + a.usage_count, 0) || 12,
      totalTagUsages: tagAnalytics.reduce((sum, a) => sum + a.usage_count, 0) || 47,
      topTags: tagAnalytics.slice(0, 10).map(a => ({
        name: a.tag.name,
        color: a.tag.color,
        count: a.usage_count
      })) || [
        { name: "JavaScript", color: "#f7df1e", count: 15 },
        { name: "React", color: "#61dafb", count: 12 },
        { name: "TypeScript", color: "#3178c6", count: 10 },
      ],
      generatedAt: new Date().toISOString(),
    };

    const topTagsHtml = reportData.topTags
      .map((tag: any, index: number) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${index + 1}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">
            <span style="background-color: ${tag.color}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">${tag.name}</span>
          </td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${tag.count}</td>
        </tr>
      `)
      .join("");

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Weekly Tag Analytics Report</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <div style="background-color: white; border-radius: 8px; padding: 24px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h1 style="color: #1a1a1a; margin-bottom: 8px;">Weekly Tag Analytics Report</h1>
          <p style="color: #666; margin-bottom: 24px;">
            ${new Date(reportData.period.start).toLocaleDateString()} - ${new Date(reportData.period.end).toLocaleDateString()}
          </p>
          
          <div style="display: flex; gap: 16px; margin-bottom: 24px;">
            <div style="flex: 1; background-color: #f0f9ff; padding: 16px; border-radius: 8px; text-align: center;">
              <div style="font-size: 28px; font-weight: bold; color: #0369a1;">${reportData.totalThreads}</div>
              <div style="color: #666; font-size: 14px;">New Threads</div>
            </div>
            <div style="flex: 1; background-color: #f0fdf4; padding: 16px; border-radius: 8px; text-align: center;">
              <div style="font-size: 28px; font-weight: bold; color: #15803d;">${reportData.totalTagUsages}</div>
              <div style="color: #666; font-size: 14px;">Tag Usages</div>
            </div>
          </div>

          <h2 style="color: #1a1a1a; font-size: 18px; margin-bottom: 16px;">Top Tags This Week</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f9fafb;">
                <th style="padding: 8px; text-align: left; font-weight: 600;">#</th>
                <th style="padding: 8px; text-align: left; font-weight: 600;">Tag</th>
                <th style="padding: 8px; text-align: right; font-weight: 600;">Uses</th>
              </tr>
            </thead>
            <tbody>
              ${topTagsHtml || '<tr><td colspan="3" style="padding: 16px; text-align: center; color: #666;">No tag usage this week</td></tr>'}
            </tbody>
          </table>

          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #eee; text-align: center;">
            <a href="#" style="color: #0369a1; text-decoration: none;">View Full Report in Admin Panel →</a>
          </div>
        </div>
        
        <p style="color: #999; font-size: 12px; text-align: center; margin-top: 16px;">
          Generated on ${new Date(reportData.generatedAt).toLocaleString()}
        </p>
      </body>
      </html>
    `;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const pendingApps = applications.filter(a => a.status === 'pending');
  const approvedApps = applications.filter(a => a.status === 'approved');
  const rejectedApps = applications.filter(a => a.status === 'rejected');

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-10 h-10 text-primary" />
          <div>
            <h1 className="text-4xl font-bold">Admin Panel</h1>
            <p className="text-muted-foreground">Manage applications and moderate content</p>
          </div>
        </div>

        {/* Enhanced Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <Clock className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <div className="text-3xl font-bold text-yellow-500">{pendingApps.length}</div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <div className="text-3xl font-bold text-green-500">{approvedApps.length}</div>
              <div className="text-sm text-muted-foreground">Approved</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <div className="text-3xl font-bold text-red-500">{rejectedApps.length}</div>
              <div className="text-sm text-muted-foreground">Rejected</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Users className="w-8 h-8 text-primary mx-auto mb-2" />
              <div className="text-3xl font-bold text-primary">{applications.length}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <MessageSquare className="w-8 h-8 text-primary mx-auto mb-2" />
              <div className="text-3xl font-bold text-primary">-</div>
              <div className="text-sm text-muted-foreground">Active Threads</div>
            </CardContent>
          </Card>
        </div>

        {/* Applications List */}
        <Card>
          <CardHeader>
            <CardTitle>Elite Applications</CardTitle>
            <CardDescription>Review and manage membership applications</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pending">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="pending">Pending ({pendingApps.length})</TabsTrigger>
                <TabsTrigger value="approved">Approved ({approvedApps.length})</TabsTrigger>
                <TabsTrigger value="rejected">Rejected ({rejectedApps.length})</TabsTrigger>
              </TabsList>

              {[
                { value: 'pending', apps: pendingApps },
                { value: 'approved', apps: approvedApps },
                { value: 'rejected', apps: rejectedApps }
              ].map(({ value, apps }) => (
                <TabsContent key={value} value={value} className="space-y-4 mt-6">
                  {apps.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      No {value} applications
                    </div>
                  ) : (
                    apps.map((app) => (
                      <Card key={app.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                {getStatusIcon(app.status)}
                                <h3 className="text-xl font-bold">{app.full_name}</h3>
                                <Badge variant={
                                  app.status === 'pending' ? 'outline' : 
                                  app.status === 'approved' ? 'default' : 'destructive'
                                }>
                                  {app.status}
                                </Badge>
                              </div>
                              <div className="space-y-1 text-sm text-muted-foreground">
                                <p><strong>Email:</strong> {app.email}</p>
                                <p><strong>Role:</strong> {app.role_title} at {app.company}</p>
                                <p><strong>Submitted:</strong> {new Date(app.created_at).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedApp(selectedApp?.id === app.id ? null : app)}
                            >
                              {selectedApp?.id === app.id ? 'Hide Details' : 'View Details'}
                            </Button>
                          </div>

                          {selectedApp?.id === app.id && (
                            <div className="mt-6 pt-6 border-t space-y-4">
                              <div>
                                <Label className="text-sm font-semibold">Bio</Label>
                                <p className="text-sm text-muted-foreground mt-1">{app.bio}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-semibold">Reason for Joining</Label>
                                <p className="text-sm text-muted-foreground mt-1">{app.reason_for_joining}</p>
                              </div>
                              {app.proof_url && (
                                <div>
                                  <Label className="text-sm font-semibold">Proof Document</Label>
                                  <Button
                                    variant="link"
                                    size="sm"
                                    className="p-0 h-auto"
                                    onClick={async () => {
                                      const path = app.proof_url!;
                                      // Support legacy public URLs by extracting the storage path.
                                      const storagePath = path.includes('/elite-proofs/')
                                        ? path.split('/elite-proofs/')[1]
                                        : path;
                                      const { data, error } = await supabase
                                        .storage
                                        .from('elite-proofs')
                                        .createSignedUrl(storagePath, 3600);
                                      if (error || !data?.signedUrl) {
                                        toast.error('Could not load proof document');
                                        return;
                                      }
                                      window.open(data.signedUrl, '_blank');
                                    }}
                                  >
                                    <FileText className="w-4 h-4 mr-2" />
                                    View Document
                                  </Button>
                                </div>
                              )}
                              
                              {app.status === 'pending' && (
                                <div className="space-y-3 pt-4">
                                  <div>
                                    <Label htmlFor="notes">Moderator Notes (optional)</Label>
                                    <Textarea
                                      id="notes"
                                      value={moderatorNotes}
                                      onChange={(e) => setModeratorNotes(e.target.value)}
                                      placeholder="Add notes for the applicant..."
                                      rows={3}
                                    />
                                  </div>
                                  <div className="flex gap-3">
                                    <Button
                                      variant="default"
                                      onClick={() => handleApplicationAction(app.id, 'approved')}
                                      className="flex-1"
                                    >
                                      <CheckCircle className="w-4 h-4 mr-2" />
                                      Approve
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      onClick={() => handleApplicationAction(app.id, 'rejected')}
                                      className="flex-1"
                                    >
                                      <XCircle className="w-4 h-4 mr-2" />
                                      Reject
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* Tag Analytics Section */}
        <Card className="mt-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Tag Analytics
                </CardTitle>
                <CardDescription>Usage statistics and trending tags</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={exportToCSV} disabled={tagAnalytics.length === 0}>
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
                <Button variant="outline" size="sm" onClick={exportToPDF} disabled={tagAnalytics.length === 0}>
                  <Download className="w-4 h-4 mr-2" />
                  Export PDF
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loadingAnalytics ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-4">Loading analytics...</p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <Tag className="w-8 h-8 text-primary mx-auto mb-2" />
                      <div className="text-3xl font-bold text-primary">{tagAnalytics.length}</div>
                      <div className="text-sm text-muted-foreground">Total Tags</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
                      <div className="text-3xl font-bold text-green-500">
                        {tagAnalytics.filter(a => a.trend_percentage > 0).length}
                      </div>
                      <div className="text-sm text-muted-foreground">Trending Up</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <FileText className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                      <div className="text-3xl font-bold text-blue-500">
                        {tagAnalytics.reduce((sum, a) => sum + a.usage_count, 0)}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Tag Uses</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Most Popular Tags Chart */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Most Popular Tags</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={tagAnalytics.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis 
                        dataKey="tag.name" 
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload[0]) {
                            const data = payload[0].payload as TagAnalytics;
                            return (
                              <div className="bg-background border rounded-lg p-3 shadow-lg">
                                <p className="font-semibold">{data.tag.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  Total uses: {data.usage_count}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Recent uses (30d): {data.recent_usage_count}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="usage_count" radius={[8, 8, 0, 0]}>
                        {tagAnalytics.slice(0, 10).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.tag.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Usage Trends Over Time */}
                <div>
                  <div className="flex flex-col gap-4 mb-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Usage Trends Over Time</h3>
                      <div className="flex items-center gap-2">
                        <Button
                          variant={comparisonMode ? "default" : "outline"}
                          size="sm"
                          onClick={() => setComparisonMode(!comparisonMode)}
                        >
                          <ArrowLeftRight className="w-4 h-4 mr-2" />
                          Compare
                        </Button>
                        <Select value={trendPeriod} onValueChange={(v) => handlePeriodChange(v as 'weekly' | 'monthly' | 'custom')}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="custom">Custom</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    {/* Custom Date Range */}
                    {(trendPeriod === 'custom' || comparisonMode) && (
                      <div className="flex flex-wrap items-end gap-4 p-4 bg-muted/50 rounded-lg">
                        <div className="space-y-2">
                          <Label className="text-xs">{comparisonMode ? 'Current Period Start' : 'Start Date'}</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" size="sm" className={cn("w-36 justify-start text-left font-normal", !customStartDate && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {customStartDate ? format(customStartDate, "MMM d, yyyy") : "Pick date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar mode="single" selected={customStartDate} onSelect={setCustomStartDate} className="p-3 pointer-events-auto" />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">{comparisonMode ? 'Current Period End' : 'End Date'}</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" size="sm" className={cn("w-36 justify-start text-left font-normal", !customEndDate && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {customEndDate ? format(customEndDate, "MMM d, yyyy") : "Pick date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar mode="single" selected={customEndDate} onSelect={setCustomEndDate} className="p-3 pointer-events-auto" />
                            </PopoverContent>
                          </Popover>
                        </div>
                        
                        {comparisonMode && (
                          <>
                            <div className="space-y-2">
                              <Label className="text-xs">Comparison Start</Label>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button variant="outline" size="sm" className={cn("w-36 justify-start text-left font-normal", !comparisonStartDate && "text-muted-foreground")}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {comparisonStartDate ? format(comparisonStartDate, "MMM d, yyyy") : "Pick date"}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar mode="single" selected={comparisonStartDate} onSelect={setComparisonStartDate} className="p-3 pointer-events-auto" />
                                </PopoverContent>
                              </Popover>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs">Comparison End</Label>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button variant="outline" size="sm" className={cn("w-36 justify-start text-left font-normal", !comparisonEndDate && "text-muted-foreground")}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {comparisonEndDate ? format(comparisonEndDate, "MMM d, yyyy") : "Pick date"}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar mode="single" selected={comparisonEndDate} onSelect={setComparisonEndDate} className="p-3 pointer-events-auto" />
                                </PopoverContent>
                              </Popover>
                            </div>
                          </>
                        )}
                        
                        <Button size="sm" onClick={comparisonMode ? loadComparisonData : handleCustomDateApply}>
                          {comparisonMode ? 'Compare' : 'Apply'}
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {/* Comparison Results */}
                  {comparisonMode && comparisonData.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-medium mb-3">Period Comparison</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {comparisonData.slice(0, 6).map((item: any) => (
                          <Card key={item.tag} className="border" style={{ borderLeftColor: item.color, borderLeftWidth: 4 }}>
                            <CardContent className="pt-4 pb-3">
                              <div className="flex justify-between items-start mb-2">
                                <span className="font-medium text-sm">{item.tag}</span>
                                <Badge variant={item.change > 0 ? "default" : item.change < 0 ? "destructive" : "secondary"} className="text-xs">
                                  {item.change > 0 ? '+' : ''}{item.change}%
                                </Badge>
                              </div>
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Current: <strong className="text-foreground">{item.current}</strong></span>
                                <span>Previous: <strong className="text-foreground">{item.previous}</strong></span>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {timeSeriesData.length > 0 && tagAnalytics.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={timeSeriesData}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                        <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                        <YAxis />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
                        <Legend />
                        {tagAnalytics.slice(0, 5).map((analytics) => (
                          <Line
                            key={analytics.tag.id}
                            type="monotone"
                            dataKey={analytics.tag.name}
                            stroke={analytics.tag.color}
                            strokeWidth={2}
                            dot={{ fill: analytics.tag.color, r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No trend data available
                    </div>
                  )}
                </div>

                {/* Trending Tags */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Trending Tags (Last 30 Days)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tagAnalytics
                      .filter(a => a.recent_usage_count > 0)
                      .sort((a, b) => b.trend_percentage - a.trend_percentage)
                      .slice(0, 9)
                      .map((analytics) => (
                        <Card key={analytics.tag.id} className="border-2" style={{ borderColor: analytics.tag.color }}>
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: analytics.tag.color }}
                                />
                                <h4 className="font-semibold">{analytics.tag.name}</h4>
                              </div>
                              {analytics.trend_percentage !== 0 && (
                                <Badge 
                                  variant={analytics.trend_percentage > 0 ? "default" : "destructive"}
                                  className="text-xs"
                                >
                                  <TrendingUp className={`w-3 h-3 mr-1 ${analytics.trend_percentage < 0 ? 'rotate-180' : ''}`} />
                                  {analytics.trend_percentage > 0 ? '+' : ''}{analytics.trend_percentage}%
                                </Badge>
                              )}
                            </div>
                            <div className="space-y-2 text-sm text-muted-foreground">
                              <div className="flex justify-between">
                                <span>Total uses:</span>
                                <span className="font-semibold">{analytics.usage_count}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Recent (30d):</span>
                                <span className="font-semibold text-primary">{analytics.recent_usage_count}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                  {tagAnalytics.filter(a => a.recent_usage_count > 0).length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No tags used in the last 30 days
                    </div>
                  )}
                </div>

                {/* All Tags Table */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">All Tags Usage</h3>
                  <ScrollArea className="h-[400px] border rounded-md">
                    <div className="p-4">
                      <div className="grid grid-cols-12 gap-4 font-semibold text-sm mb-4 pb-2 border-b">
                        <div className="col-span-4">Tag</div>
                        <div className="col-span-2 text-right">Total Uses</div>
                        <div className="col-span-2 text-right">Recent (30d)</div>
                        <div className="col-span-2 text-right">Trend</div>
                        <div className="col-span-2 text-right">Color</div>
                      </div>
                      {tagAnalytics.map((analytics) => (
                        <div 
                          key={analytics.tag.id}
                          className="grid grid-cols-12 gap-4 items-center py-3 border-b hover:bg-muted/50"
                        >
                          <div className="col-span-4 flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full flex-shrink-0" 
                              style={{ backgroundColor: analytics.tag.color }}
                            />
                            <span className="font-medium">{analytics.tag.icon} {analytics.tag.name}</span>
                          </div>
                          <div className="col-span-2 text-right font-semibold">
                            {analytics.usage_count}
                          </div>
                          <div className="col-span-2 text-right font-semibold text-primary">
                            {analytics.recent_usage_count}
                          </div>
                          <div className="col-span-2 text-right">
                            {analytics.trend_percentage !== 0 && (
                              <Badge 
                                variant={analytics.trend_percentage > 0 ? "default" : "secondary"}
                                className="text-xs"
                              >
                                {analytics.trend_percentage > 0 ? '+' : ''}{analytics.trend_percentage}%
                              </Badge>
                            )}
                            {analytics.trend_percentage === 0 && (
                              <span className="text-muted-foreground text-xs">-</span>
                            )}
                          </div>
                          <div className="col-span-2 text-right">
                            <code className="text-xs">{analytics.tag.color}</code>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bulk Tag Operations Section */}
        <Card className="mt-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ListCheck className="w-5 h-5" />
                  Bulk Tag Operations
                </CardTitle>
                <CardDescription>Apply or remove tags from multiple threads at once</CardDescription>
              </div>
              {selectedThreads.size > 0 && (
                <Badge variant="secondary">
                  {selectedThreads.size} thread(s) selected
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Thread Selection */}
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-base font-semibold">Select Threads</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleSelectAll}
                  >
                    {selectedThreads.size === threads.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>
                
                <ScrollArea className="h-[400px] border rounded-md p-4">
                  {loadingThreads ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Loading threads...
                    </div>
                  ) : threads.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No threads available
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {threads.map((thread) => (
                        <div 
                          key={thread.id}
                          className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                          onClick={() => handleThreadSelect(thread.id)}
                        >
                          <Checkbox
                            checked={selectedThreads.has(thread.id)}
                            onCheckedChange={() => handleThreadSelect(thread.id)}
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">{thread.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              by {thread.profiles?.username || 'Unknown'} • {thread.views} views
                            </p>
                            {thread.tags.length > 0 && (
                              <div className="flex gap-1 mt-2 flex-wrap">
                                {thread.tags.map((tag) => (
                                  <Badge
                                    key={tag.id}
                                    variant="secondary"
                                    style={{
                                      backgroundColor: `${tag.color}20`,
                                      borderColor: tag.color,
                                      color: tag.color
                                    }}
                                    className="text-xs border"
                                  >
                                    {tag.icon} {tag.name}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>

              {/* Tag Selection and Actions */}
              <div>
                <Label className="text-base font-semibold mb-4 block">Select Tags</Label>
                <ScrollArea className="h-[300px] border rounded-md p-4 mb-4">
                  <div className="space-y-2">
                    {tags.map((tag) => (
                      <div
                        key={tag.id}
                        className="flex items-center gap-2 p-2 hover:bg-muted rounded-md cursor-pointer"
                        onClick={() => handleTagToggleForBulk(tag.id)}
                      >
                        <Checkbox
                          checked={bulkTags.has(tag.id)}
                          onCheckedChange={() => handleTagToggleForBulk(tag.id)}
                        />
                        <div 
                          className="w-3 h-3 rounded-full flex-shrink-0" 
                          style={{ backgroundColor: tag.color }}
                        />
                        <span className="text-sm">{tag.icon} {tag.name}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <div className="space-y-2">
                  <Button
                    onClick={handleBulkAddTags}
                    disabled={selectedThreads.size === 0 || bulkTags.size === 0}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Tags
                  </Button>
                  <Button
                    onClick={handleBulkRemoveTags}
                    disabled={selectedThreads.size === 0 || bulkTags.size === 0}
                    variant="destructive"
                    className="w-full"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove Tags
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scheduled Reports Section */}
        <Card className="mt-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Scheduled Reports
                </CardTitle>
                <CardDescription>Generate and send tag analytics reports to moderators</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowEmailPreview(true)}>
                  <Eye className="w-4 h-4 mr-2" />
                  Preview Email
                </Button>
                <Button onClick={generateScheduledReport} disabled={generatingReport}>
                  {generatingReport ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Generate Report Now
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Schedule Settings */}
            <div className="mb-6 p-4 border rounded-lg bg-muted/30">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="w-4 h-4" />
                <h4 className="font-medium">Report Schedule</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select 
                    value={reportSchedule.frequency} 
                    onValueChange={(value) => {
                      const newSchedule = { ...reportSchedule, frequency: value };
                      // Set sensible defaults when changing frequency
                      if (value === 'daily') {
                        newSchedule.day = 0;
                      } else if (value === 'weekly') {
                        newSchedule.day = 1; // Monday
                      } else if (value === 'monthly') {
                        newSchedule.day = 1; // 1st of month
                      }
                      setReportSchedule(newSchedule);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {reportSchedule.frequency === 'weekly' && (
                  <div className="space-y-2">
                    <Label>Day of Week</Label>
                    <Select 
                      value={reportSchedule.day.toString()} 
                      onValueChange={(value) => setReportSchedule({ ...reportSchedule, day: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Sunday</SelectItem>
                        <SelectItem value="1">Monday</SelectItem>
                        <SelectItem value="2">Tuesday</SelectItem>
                        <SelectItem value="3">Wednesday</SelectItem>
                        <SelectItem value="4">Thursday</SelectItem>
                        <SelectItem value="5">Friday</SelectItem>
                        <SelectItem value="6">Saturday</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                {reportSchedule.frequency === 'monthly' && (
                  <div className="space-y-2">
                    <Label>Day of Month</Label>
                    <Select 
                      value={reportSchedule.day.toString()} 
                      onValueChange={(value) => setReportSchedule({ ...reportSchedule, day: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                          <SelectItem key={day} value={day.toString()}>{day}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label>Hour (UTC)</Label>
                  <Select 
                    value={reportSchedule.hour.toString()} 
                    onValueChange={(value) => setReportSchedule({ ...reportSchedule, hour: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                        <SelectItem key={hour} value={hour.toString()}>
                          {hour.toString().padStart(2, '0')}:00
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Current: {reportSchedule.frequency === 'daily' 
                    ? `Daily at ${reportSchedule.hour.toString().padStart(2, '0')}:00 UTC`
                    : reportSchedule.frequency === 'weekly'
                    ? `Every ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][reportSchedule.day]} at ${reportSchedule.hour.toString().padStart(2, '0')}:00 UTC`
                    : `Day ${reportSchedule.day} of each month at ${reportSchedule.hour.toString().padStart(2, '0')}:00 UTC`
                  }
                </p>
                <Button 
                  onClick={() => updateReportSchedule(reportSchedule)} 
                  disabled={updatingSchedule}
                  size="sm"
                >
                  {updatingSchedule ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Schedule'
                  )}
                </Button>
              </div>
            </div>

            {/* Report Preview */}
            {lastReport ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">{lastReport.totalThreads}</div>
                      <p className="text-sm text-muted-foreground">Threads this period</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">{lastReport.totalTagUsages}</div>
                      <p className="text-sm text-muted-foreground">Tag usages</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">{lastReport.topTags?.length || 0}</div>
                      <p className="text-sm text-muted-foreground">Active tags</p>
                    </CardContent>
                  </Card>
                </div>
                
                {lastReport.topTags && lastReport.topTags.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Top Tags This Period</h4>
                    <div className="flex flex-wrap gap-2">
                      {lastReport.topTags.map((tag: any) => (
                        <Badge
                          key={tag.id}
                          variant="outline"
                          style={{ borderColor: tag.color, color: tag.color }}
                        >
                          {tag.name}: {tag.count}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <p className="text-xs text-muted-foreground">
                  Report generated: {format(new Date(lastReport.generatedAt), "PPpp")}
                </p>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No reports generated yet</p>
                <p className="text-sm mt-1">Click "Generate Report Now" to create a summary</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Report History Section */}
        <Card className="mt-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Report History
                </CardTitle>
                <CardDescription>Previously generated analytics reports</CardDescription>
              </div>
              {reportHistory.length > 0 && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={exportReportHistoryToCSV}>
                    <Download className="w-4 h-4 mr-2" />
                    CSV
                  </Button>
                  <Button variant="outline" size="sm" onClick={exportReportHistoryToPDF}>
                    <Download className="w-4 h-4 mr-2" />
                    PDF
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-6 p-4 bg-muted/30 rounded-lg">
              <div className="flex-1 min-w-[150px]">
                <Label className="text-xs text-muted-foreground mb-1 block">Report Type</Label>
                <Select value={reportTypeFilter} onValueChange={setReportTypeFilter}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 min-w-[150px]">
                <Label className="text-xs text-muted-foreground mb-1 block">From Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("h-9 w-full justify-start text-left font-normal", !reportDateStart && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {reportDateStart ? format(reportDateStart, "MMM d, yyyy") : "Start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={reportDateStart} onSelect={setReportDateStart} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex-1 min-w-[150px]">
                <Label className="text-xs text-muted-foreground mb-1 block">To Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("h-9 w-full justify-start text-left font-normal", !reportDateEnd && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {reportDateEnd ? format(reportDateEnd, "MMM d, yyyy") : "End date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={reportDateEnd} onSelect={setReportDateEnd} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
              {(reportTypeFilter !== "all" || reportDateStart || reportDateEnd) && (
                <div className="flex items-end">
                  <Button variant="ghost" size="sm" onClick={clearReportFilters} className="h-9">
                    <XCircle className="w-4 h-4 mr-1" />
                    Clear
                  </Button>
                </div>
              )}
            </div>

            {loadingHistory ? (
              <div className="text-center py-8">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
              </div>
            ) : reportHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No report history yet</p>
              </div>
            ) : filteredReportHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No reports match filters</p>
                <Button variant="link" onClick={clearReportFilters} className="mt-2">Clear filters</Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Bulk actions bar */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={paginatedReports.length > 0 && paginatedReports.every((r: any) => selectedReportIds.has(r.id))}
                      onCheckedChange={toggleAllReports}
                    />
                    <span className="text-sm text-muted-foreground">
                      {selectedReportIds.size > 0 
                        ? `${selectedReportIds.size} selected` 
                        : `Page ${reportCurrentPage} of ${totalReportPages} (${filteredReportHistory.length} total)`}
                    </span>
                  </div>
                  {selectedReportIds.size > 0 && (
                    <div className="flex gap-2">
                      {selectedReportIds.size === 2 && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            const ids = Array.from(selectedReportIds);
                            const report1 = filteredReportHistory.find(r => r.id === ids[0]);
                            const report2 = filteredReportHistory.find(r => r.id === ids[1]);
                            if (report1 && report2) {
                              // Sort by date so older is first
                              const sorted = [report1, report2].sort((a, b) => 
                                new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                              );
                              setCompareReports([sorted[0], sorted[1]]);
                            }
                          }}
                        >
                          <ArrowLeftRight className="w-4 h-4 mr-2" />
                          Compare Reports
                        </Button>
                      )}
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={bulkDeleteReports}
                        disabled={deletingReports}
                      >
                        {deletingReports ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4 mr-2" />
                        )}
                        Delete {selectedReportIds.size} Report(s)
                      </Button>
                    </div>
                  )}
                </div>

                {paginatedReports.map((report: any) => (
                  <div 
                    key={report.id} 
                    className={cn(
                      "border rounded-lg p-4 hover:bg-muted/30 transition-colors cursor-pointer",
                      selectedReportIds.has(report.id) && "bg-muted/50 border-primary"
                    )}
                    onClick={() => setSelectedReportDetail(report)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selectedReportIds.has(report.id)}
                          onCheckedChange={() => {}}
                          onClick={(e) => toggleReportSelection(report.id, e)}
                        />
                        <Badge variant="outline" className="capitalize">
                          {report.report_type} Report
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(report.created_at), "PPp")}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                          onClick={(e) => deleteReport(report.id, e)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm ml-8">
                      <div>
                        <span className="text-muted-foreground">Period:</span>
                        <div className="font-medium">
                          {format(new Date(report.period_start), "MMM d")} - {format(new Date(report.period_end), "MMM d, yyyy")}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Threads:</span>
                        <div className="font-medium">{report.report_data?.totalThreads || 0}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Tag Usages:</span>
                        <div className="font-medium">{report.report_data?.totalTagUsages || 0}</div>
                      </div>
                    </div>
                    {report.report_data?.topTags?.length > 0 && (
                      <div className="mt-3 flex gap-1 flex-wrap">
                        {report.report_data.topTags.slice(0, 5).map((tag: any, idx: number) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            style={{ backgroundColor: `${tag.color}20`, borderColor: tag.color, color: tag.color }}
                            className="text-xs border"
                          >
                            {tag.name}: {tag.count}
                          </Badge>
                        ))}
                        {report.report_data.topTags.length > 5 && (
                          <Badge variant="secondary" className="text-xs">
                            +{report.report_data.topTags.length - 5} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {/* Pagination Controls */}
                {totalReportPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Page {reportCurrentPage} of {totalReportPages} ({filteredReportHistory.length} reports)
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setReportCurrentPage(p => Math.max(1, p - 1))}
                        disabled={reportCurrentPage === 1}
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Previous
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalReportPages }, (_, i) => i + 1)
                          .filter(page => {
                            // Show first, last, current, and adjacent pages
                            return page === 1 || 
                                   page === totalReportPages || 
                                   Math.abs(page - reportCurrentPage) <= 1;
                          })
                          .map((page, idx, arr) => (
                            <span key={page} className="flex items-center">
                              {idx > 0 && arr[idx - 1] !== page - 1 && (
                                <span className="px-2 text-muted-foreground">...</span>
                              )}
                              <Button
                                variant={page === reportCurrentPage ? "default" : "outline"}
                                size="sm"
                                className="w-8 h-8 p-0"
                                onClick={() => setReportCurrentPage(page)}
                              >
                                {page}
                              </Button>
                            </span>
                          ))}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setReportCurrentPage(p => Math.min(totalReportPages, p + 1))}
                        disabled={reportCurrentPage === totalReportPages}
                      >
                        Next
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tag Management Section */}
        <Card className="mt-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="w-5 h-5" />
                  Tag Management
                </CardTitle>
                <CardDescription>Create, edit, and manage forum tags</CardDescription>
              </div>
              <Button onClick={() => openTagDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Create Tag
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tags.length === 0 ? (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  No tags created yet
                </div>
              ) : (
                tags.map((tag) => (
                  <Card key={tag.id} className="border-2" style={{ borderColor: tag.color }}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: tag.color }}
                            />
                            <h3 className="font-semibold">{tag.name}</h3>
                          </div>
                          <p className="text-sm text-muted-foreground">/{tag.slug}</p>
                          {tag.icon && (
                            <p className="text-xs text-muted-foreground mt-1">Icon: {tag.icon}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openTagDialog(tag)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleTagDelete(tag.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tag Dialog */}
        <Dialog open={isTagDialogOpen} onOpenChange={setIsTagDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTag ? 'Edit Tag' : 'Create New Tag'}</DialogTitle>
              <DialogDescription>
                {editingTag ? 'Update tag information' : 'Add a new tag for forum threads'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="tag-name">Tag Name</Label>
                <Input
                  id="tag-name"
                  value={tagForm.name}
                  onChange={(e) => setTagForm({ ...tagForm, name: e.target.value })}
                  placeholder="e.g., Technology"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tag-slug">Slug</Label>
                <Input
                  id="tag-slug"
                  value={tagForm.slug}
                  onChange={(e) => setTagForm({ ...tagForm, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  placeholder="e.g., technology"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tag-color">Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="tag-color"
                    type="color"
                    value={tagForm.color}
                    onChange={(e) => setTagForm({ ...tagForm, color: e.target.value })}
                    className="w-20 h-10"
                  />
                  <Input
                    value={tagForm.color}
                    onChange={(e) => setTagForm({ ...tagForm, color: e.target.value })}
                    placeholder="#3b82f6"
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tag-icon">Icon (optional)</Label>
                <Input
                  id="tag-icon"
                  value={tagForm.icon}
                  onChange={(e) => setTagForm({ ...tagForm, icon: e.target.value })}
                  placeholder="e.g., 💻"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsTagDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleTagSubmit}>
                {editingTag ? 'Update Tag' : 'Create Tag'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Email Preview Dialog */}
        <Dialog open={showEmailPreview} onOpenChange={setShowEmailPreview}>
          <DialogContent className="max-w-3xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Email Preview
              </DialogTitle>
              <DialogDescription>
                This is how the report email will look when sent to moderators
              </DialogDescription>
            </DialogHeader>
            <div className="border rounded-lg overflow-hidden bg-muted/30">
              <iframe
                srcDoc={generateEmailPreviewHtml()}
                title="Email Preview"
                className="w-full h-[500px] bg-white"
                sandbox="allow-same-origin"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEmailPreview(false)}>
                Close
              </Button>
              <Button onClick={() => {
                setShowEmailPreview(false);
                generateScheduledReport();
              }} disabled={generatingReport}>
                <Mail className="w-4 h-4 mr-2" />
                Send Report Now
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Report Detail Modal */}
        <Dialog open={!!selectedReportDetail} onOpenChange={(open) => !open && setSelectedReportDetail(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Report Details
              </DialogTitle>
              <DialogDescription>
                {selectedReportDetail && (
                  <>Generated on {format(new Date(selectedReportDetail.created_at), "PPpp")}</>
                )}
              </DialogDescription>
            </DialogHeader>
            
            {selectedReportDetail && (
              <div className="space-y-6">
                {/* Summary Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-3xl font-bold text-primary">{selectedReportDetail.report_data?.totalThreads || 0}</div>
                      <p className="text-sm text-muted-foreground">New Threads</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-3xl font-bold text-green-600">{selectedReportDetail.report_data?.totalTagUsages || 0}</div>
                      <p className="text-sm text-muted-foreground">Tag Usages</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Period Info */}
                <div className="p-4 bg-muted/30 rounded-lg">
                  <h4 className="font-medium mb-2">Report Period</h4>
                  <div className="flex items-center gap-2 text-sm">
                    <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                    <span>
                      {format(new Date(selectedReportDetail.period_start), "MMMM d, yyyy")} — {format(new Date(selectedReportDetail.period_end), "MMMM d, yyyy")}
                    </span>
                  </div>
                  <Badge variant="outline" className="mt-2 capitalize">
                    {selectedReportDetail.report_type} Report
                  </Badge>
                </div>

                {/* All Tags */}
                {selectedReportDetail.report_data?.topTags?.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3">Top Tags ({selectedReportDetail.report_data.topTags.length})</h4>
                    <div className="space-y-2">
                      {selectedReportDetail.report_data.topTags.map((tag: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-2 border rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-medium text-muted-foreground w-6">#{idx + 1}</span>
                            <Badge
                              style={{ backgroundColor: tag.color, color: 'white' }}
                            >
                              {tag.name}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <span className="font-bold">{tag.count}</span>
                            <span className="text-muted-foreground text-sm ml-1">uses</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedReportDetail(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Report Comparison Modal */}
        <Dialog open={!!compareReports} onOpenChange={(open) => !open && setCompareReports(null)}>
          <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5" />
                Report Comparison
              </DialogTitle>
              <DialogDescription>
                Comparing two analytics reports side by side
              </DialogDescription>
            </DialogHeader>
            
            {compareReports && (
              <div className="space-y-6">
                {/* Header row with report dates */}
                <div className="grid grid-cols-2 gap-4">
                  {compareReports.map((report, idx) => (
                    <div key={report.id} className="p-4 border rounded-lg bg-muted/30">
                      <Badge variant={idx === 0 ? "secondary" : "default"} className="mb-2">
                        {idx === 0 ? "Older Report" : "Newer Report"}
                      </Badge>
                      <p className="font-medium">{format(new Date(report.created_at), "PPP")}</p>
                      <p className="text-sm text-muted-foreground">
                        Period: {format(new Date(report.period_start), "MMM d")} - {format(new Date(report.period_end), "MMM d, yyyy")}
                      </p>
                      <Badge variant="outline" className="mt-2 capitalize">
                        {report.report_type}
                      </Badge>
                    </div>
                  ))}
                </div>

                {/* Stats comparison */}
                <div>
                  <h4 className="font-medium mb-3">Summary Statistics</h4>
                  <div className="border rounded-lg overflow-hidden">
                    <div className="grid grid-cols-3 bg-muted/50 p-3 font-medium text-sm">
                      <div>Metric</div>
                      <div className="text-center">Older</div>
                      <div className="text-center">Newer</div>
                    </div>
                    <div className="divide-y">
                      {/* Threads */}
                      <div className="grid grid-cols-3 p-3">
                        <div className="text-muted-foreground">New Threads</div>
                        <div className="text-center font-medium">
                          {compareReports[0].report_data?.totalThreads || 0}
                        </div>
                        <div className="text-center font-medium flex items-center justify-center gap-2">
                          {compareReports[1].report_data?.totalThreads || 0}
                          {(() => {
                            const old = compareReports[0].report_data?.totalThreads || 0;
                            const newer = compareReports[1].report_data?.totalThreads || 0;
                            const diff = newer - old;
                            const pct = old > 0 ? Math.round((diff / old) * 100) : (newer > 0 ? 100 : 0);
                            if (diff === 0) return null;
                            return (
                              <Badge variant={diff > 0 ? "default" : "destructive"} className="text-xs">
                                {diff > 0 ? "+" : ""}{pct}%
                              </Badge>
                            );
                          })()}
                        </div>
                      </div>
                      {/* Tag Usages */}
                      <div className="grid grid-cols-3 p-3">
                        <div className="text-muted-foreground">Tag Usages</div>
                        <div className="text-center font-medium">
                          {compareReports[0].report_data?.totalTagUsages || 0}
                        </div>
                        <div className="text-center font-medium flex items-center justify-center gap-2">
                          {compareReports[1].report_data?.totalTagUsages || 0}
                          {(() => {
                            const old = compareReports[0].report_data?.totalTagUsages || 0;
                            const newer = compareReports[1].report_data?.totalTagUsages || 0;
                            const diff = newer - old;
                            const pct = old > 0 ? Math.round((diff / old) * 100) : (newer > 0 ? 100 : 0);
                            if (diff === 0) return null;
                            return (
                              <Badge variant={diff > 0 ? "default" : "destructive"} className="text-xs">
                                {diff > 0 ? "+" : ""}{pct}%
                              </Badge>
                            );
                          })()}
                        </div>
                      </div>
                      {/* Active Tags */}
                      <div className="grid grid-cols-3 p-3">
                        <div className="text-muted-foreground">Active Tags</div>
                        <div className="text-center font-medium">
                          {compareReports[0].report_data?.topTags?.length || 0}
                        </div>
                        <div className="text-center font-medium flex items-center justify-center gap-2">
                          {compareReports[1].report_data?.topTags?.length || 0}
                          {(() => {
                            const old = compareReports[0].report_data?.topTags?.length || 0;
                            const newer = compareReports[1].report_data?.topTags?.length || 0;
                            const diff = newer - old;
                            if (diff === 0) return null;
                            return (
                              <Badge variant={diff > 0 ? "default" : "destructive"} className="text-xs">
                                {diff > 0 ? "+" : ""}{diff}
                              </Badge>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tag comparison */}
                <div>
                  <h4 className="font-medium mb-3">Top Tags Comparison</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {compareReports.map((report, idx) => (
                      <div key={report.id} className="space-y-2">
                        <p className="text-sm text-muted-foreground mb-2">
                          {idx === 0 ? "Older Report" : "Newer Report"}
                        </p>
                        {report.report_data?.topTags?.length > 0 ? (
                          <div className="space-y-1">
                            {report.report_data.topTags.slice(0, 10).map((tag: any, tagIdx: number) => {
                              // Find the same tag in the other report
                              const otherReport = compareReports[idx === 0 ? 1 : 0];
                              const otherTag = otherReport.report_data?.topTags?.find((t: any) => t.name === tag.name);
                              const diff = idx === 1 && otherTag ? tag.count - otherTag.count : null;
                              
                              return (
                                <div key={tagIdx} className="flex items-center justify-between p-2 border rounded text-sm">
                                  <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground w-5">#{tagIdx + 1}</span>
                                    <Badge
                                      variant="outline"
                                      style={{ borderColor: tag.color, color: tag.color }}
                                      className="text-xs"
                                    >
                                      {tag.name}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{tag.count}</span>
                                    {diff !== null && diff !== 0 && (
                                      <Badge 
                                        variant={diff > 0 ? "default" : "destructive"} 
                                        className="text-xs"
                                      >
                                        {diff > 0 ? "+" : ""}{diff}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No tags in this report</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => compareReports && exportComparisonToPDF(compareReports)}
              >
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
              <Button variant="outline" onClick={() => setCompareReports(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
