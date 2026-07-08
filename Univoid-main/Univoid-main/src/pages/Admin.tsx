import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Check, X, FileText, Newspaper, BookOpen, Loader2, 
  Flag, Trash2, Eye, Users, Shield, AlertTriangle, Ban, KeyRound,
  Mail, MessageSquare, Sparkles, Calendar, ToggleLeft, ToggleRight, UserPlus,
  Bell, Send
} from "lucide-react";
import AdminAssistantManager from "@/components/admin/AdminAssistantManager";
import AdminOrganizerManager from "@/components/admin/AdminOrganizerManager";
import { SystemToolsTab } from "@/components/admin/SystemToolsTab";
import { AdminBroadcastEmail } from "@/components/admin/AdminBroadcastEmail";
import { AdminResendTickets } from "@/components/admin/AdminResendTickets";
import { AdminEventDeleteDialog } from "@/components/admin/AdminEventDeleteDialog";
import { isFullAdmin } from "@/services/adminInviteService";
import { useAuth } from "@/contexts/AuthContext";
import { 
  getPendingContent, 
  updateContentStatus, 
  getAllPendingCounts,
  getAllContent,
  getAllUsers,
  getContentCounts,
  adminDeleteMaterial,
  adminDeleteNews,
  adminDeleteBook,
  adminDeleteUser,
  toggleUserDisabled,
  sendPasswordResetEmail,
} from "@/services/adminService";
import { 
  getContactMessages, 
  markMessageAsRead, 
  deleteContactMessage,
  getUnreadCount,
  ContactMessage 
} from "@/services/contactService";
import { getReports, updateReportStatus, deleteReportedContent, Report, ReportContentType } from "@/services/reportsService";
import { logAdminError } from "@/services/errorLoggingService";
import { supabase } from "@/integrations/supabase/client";
import { getMaterialDownloadUrl } from "@/lib/storageProxy";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import EnhancedMaterialPreview from "@/components/materials/EnhancedMaterialPreview";
import AuthModal from "@/components/auth/AuthModal";

interface ContentItem {
  id: string;
  title: string;
  created_by: string;
  created_at: string;
  status: string;
  contributor_name?: string;
  description?: string;
  content?: string;
  condition?: string;
  price?: number;
  file_type?: string;
  file_url?: string;
  file_size?: number;
  downloads_count?: number;
  views_count?: number;
  likes_count?: number;
  subject?: string;
  branch?: string;
  course?: string;
  college?: string;
  language?: string;
  thumbnail_url?: string;
  admin_previewed?: boolean;
}

interface UserItem {
  id: string;
  full_name: string;
  email: string;
  college_name: string;
  course_stream: string;
  year_semester: string;
  total_xp: number;
  created_at: string;
  profile_photo_url?: string;
  mobile_number?: string;
  is_disabled?: boolean;
}

const Admin = () => {
  const { user, isAdmin, isAdminOrAssistant, isLoading: authLoading } = useAuth();
  
  // Content state
  const [allMaterials, setAllMaterials] = useState<ContentItem[]>([]);
  const [allNews, setAllNews] = useState<ContentItem[]>([]);
  const [allBooks, setAllBooks] = useState<ContentItem[]>([]);
  const [allUsers, setAllUsers] = useState<UserItem[]>([]);
  const [allEvents, setAllEvents] = useState<any[]>([]);
  const [allRegistrations, setAllRegistrations] = useState<any[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [organizerApps, setOrganizerApps] = useState<any[]>([]);
  
  // Counts
  const [counts, setCounts] = useState({ materials: 0, news: 0, books: 0, users: 0, events: 0 });
  const [pendingCounts, setPendingCounts] = useState({ materials: 0, news: 0, books: 0 });
  const [reportCount, setReportCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [organizerAppsCount, setOrganizerAppsCount] = useState(0);
  const [eventsCount, setEventsCount] = useState(0);
  const [isUserFullAdmin, setIsUserFullAdmin] = useState(false);
  
  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: string; id: string; title: string } | null>(null);
  const [previewMaterial, setPreviewMaterial] = useState<ContentItem | null>(null);
  const [previewedMaterialIds, setPreviewedMaterialIds] = useState<Set<string>>(new Set());
  const [showAuthModal, setShowAuthModal] = useState(false);

  const fetchAllData = useCallback(async () => {
    setLoadError(null);
    try {
      // Use Promise.allSettled to prevent one failure from crashing all requests
      const results = await Promise.allSettled([
        getAllContent('materials'),
        getAllContent('news'),
        getAllContent('books'),
        getAllUsers(),
        getReports('pending'),
        getContactMessages(),
        getContentCounts(),
        getAllPendingCounts(),
        getUnreadCount(),
        supabase.from('organizer_applications').select('*').eq('status', 'pending').order('created_at', { ascending: true }),
        supabase.from('events').select('*').order('created_at', { ascending: false }),
        supabase.from('event_registrations').select('*, event:events(title)').order('created_at', { ascending: false }).limit(100),
      ]);
      
      // Extract values safely, using empty defaults for rejected promises
      const materialsData = results[0].status === 'fulfilled' ? results[0].value : [];
      const newsData = results[1].status === 'fulfilled' ? results[1].value : [];
      const booksData = results[2].status === 'fulfilled' ? results[2].value : [];
      const usersData = results[3].status === 'fulfilled' ? results[3].value : [];
      const reportsData = results[4].status === 'fulfilled' ? results[4].value : [];
      const messagesData = results[5].status === 'fulfilled' ? results[5].value : [];
      const contentCounts = results[6].status === 'fulfilled' ? results[6].value : { materials: 0, news: 0, books: 0, users: 0 };
      const pendingCountsData = results[7].status === 'fulfilled' ? results[7].value : { materials: 0, news: 0, books: 0 };
      const unreadCount = results[8].status === 'fulfilled' ? results[8].value : 0;
      const organizerAppsResult = results[9].status === 'fulfilled' ? results[9].value : { data: [] };
      const eventsResult = results[10].status === 'fulfilled' ? results[10].value : { data: [] };
      const registrationsResult = results[11].status === 'fulfilled' ? results[11].value : { data: [] };
      
      setAllMaterials(materialsData as ContentItem[]);
      setAllNews(newsData as ContentItem[]);
      setAllBooks(booksData as ContentItem[]);
      setAllUsers(usersData as UserItem[]);
      setReports(reportsData);
      setContactMessages(messagesData);
      setCounts({ ...contentCounts, events: eventsResult.data?.length || 0 });
      setPendingCounts(pendingCountsData);
      setReportCount(reportsData.length);
      setUnreadMessagesCount(unreadCount);
      setOrganizerApps(organizerAppsResult.data || []);
      setOrganizerAppsCount((organizerAppsResult.data || []).length);
      setAllEvents(eventsResult.data || []);
      setAllRegistrations(registrationsResult.data || []);
      setEventsCount(eventsResult.data?.length || 0);
      
      // Log any failures for debugging
      const failures = results.filter(r => r.status === 'rejected');
      if (failures.length > 0) {
        console.warn('Some admin data fetches failed:', failures);
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setLoadError(errorMessage);
      
      // Log error to database for monitoring
      logAdminError(errorMessage, error instanceof Error ? error : undefined, {
        action: 'fetchAllData',
        timestamp: new Date().toISOString(),
      });
      
      toast.error('Failed to load admin data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && isAdminOrAssistant) {
      fetchAllData();
      isFullAdmin().then(setIsUserFullAdmin);

      // Real-time subscriptions for all tables
      const channels = [
        supabase.channel('admin-materials')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'materials' }, () => {
            getAllContent('materials').then(data => setAllMaterials(data as ContentItem[]));
            getContentCounts().then(c => setCounts(prev => ({ ...prev, ...c })));
          })
          .subscribe(),
        
        supabase.channel('admin-news')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'news' }, () => {
            getAllContent('news').then(data => setAllNews(data as ContentItem[]));
            getContentCounts().then(c => setCounts(prev => ({ ...prev, ...c })));
          })
          .subscribe(),
        
        supabase.channel('admin-books')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'books' }, () => {
            getAllContent('books').then(data => setAllBooks(data as ContentItem[]));
            getContentCounts().then(c => setCounts(prev => ({ ...prev, ...c })));
          })
          .subscribe(),
        
        supabase.channel('admin-users')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
            getAllUsers().then(data => setAllUsers(data as UserItem[]));
            getContentCounts().then(c => setCounts(prev => ({ ...prev, ...c })));
          })
          .subscribe(),
        
        supabase.channel('admin-events')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
            supabase.from('events').select('*').order('created_at', { ascending: false }).then(({ data }) => {
              setAllEvents(data || []);
              setCounts(prev => ({ ...prev, events: data?.length || 0 }));
            });
          })
          .subscribe(),
        
        supabase.channel('admin-reports')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => {
            getReports('pending').then(data => {
              setReports(data);
              setReportCount(data.length);
            });
          })
          .subscribe(),
        
        supabase.channel('admin-contact-messages')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'contact_messages' }, () => {
            getContactMessages().then(setContactMessages);
            getUnreadCount().then(setUnreadMessagesCount);
          })
          .subscribe(),
      ];

      return () => {
        channels.forEach(channel => supabase.removeChannel(channel));
      };
    }
  }, [user, isAdminOrAssistant, fetchAllData]);

  // Apply scroll lock on mount - MUST be before all early returns
  useEffect(() => {
    document.documentElement.classList.add('dashboard-scroll-lock');
    return () => {
      document.documentElement.classList.remove('dashboard-scroll-lock');
    };
  }, []);

  // Check auth loading first
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show login prompt if not logged in (before checking isLoading)
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Admin Login Required</h1>
          <p className="text-muted-foreground mb-6">
            Please sign in with an admin account to access the admin panel.
          </p>
          <Button onClick={() => setShowAuthModal(true)}>
            Sign In
          </Button>
        </div>
        
        <AuthModal 
          isOpen={showAuthModal} 
          onClose={() => setShowAuthModal(false)}
          message="Sign in to access the admin panel"
        />
      </div>
    );
  }

  // Show data loading spinner only after auth is confirmed
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show error fallback if data failed to load
  if (loadError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Failed to Load Admin Data</h1>
          <p className="text-muted-foreground mb-2">
            There was a problem loading the admin dashboard data.
          </p>
          <p className="text-sm text-muted-foreground mb-6 font-mono bg-muted p-2 rounded">
            {loadError}
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => { setIsLoading(true); fetchAllData(); }}>
              <Loader2 className="w-4 h-4 mr-2" />
              Retry
            </Button>
            <Button variant="outline" asChild>
              <Link to="/">Go to Home</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show access denied if logged in but not admin or assistant
  if (!isAdminOrAssistant) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Ban className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-2">
            You don't have admin privileges to access this page.
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            Signed in as: {user.email}
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" asChild>
              <a href="/dashboard">Go to Dashboard</a>
            </Button>
            <Button asChild>
              <a href="/">Go to Home</a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleDeleteContent = async (type: string, id: string) => {
    setProcessingId(id);
    let error: Error | null = null;

    switch (type) {
      case 'materials':
        ({ error } = await adminDeleteMaterial(id));
        break;
      case 'news':
        ({ error } = await adminDeleteNews(id));
        break;
      case 'books':
        ({ error } = await adminDeleteBook(id));
        break;
      case 'users':
        ({ error } = await adminDeleteUser(id));
        break;
    }

    setProcessingId(null);
    setDeleteConfirm(null);

    if (error) {
      toast.error(`Failed to delete: ${error.message}`);
      return;
    }

    toast.success(`${type.slice(0, -1).charAt(0).toUpperCase() + type.slice(1, -1)} deleted successfully`);
  };

  const handleApprove = async (type: 'materials' | 'news' | 'books', item: ContentItem) => {
    setProcessingId(item.id);
    const { error } = await updateContentStatus(type, item.id, 'approved', item.created_by, item.title);
    setProcessingId(null);

    if (error) {
      toast.error('Failed to approve: ' + error.message);
      return;
    }

    toast.success('Content approved! XP awarded to contributor.');
    setPendingCounts(prev => ({ ...prev, [type]: prev[type as keyof typeof prev] - 1 }));
    
    // Optimistically update the local state immediately
    if (type === 'materials') {
      setAllMaterials(prev => prev.map(m => m.id === item.id ? { ...m, status: 'approved' } : m));
    } else if (type === 'news') {
      setAllNews(prev => prev.map(n => n.id === item.id ? { ...n, status: 'approved' } : n));
    } else if (type === 'books') {
      setAllBooks(prev => prev.map(b => b.id === item.id ? { ...b, status: 'approved' } : b));
    }
  };

  const handleReject = async (type: 'materials' | 'news' | 'books', item: ContentItem) => {
    setProcessingId(item.id);
    const { error } = await updateContentStatus(type, item.id, 'rejected', item.created_by, item.title);
    setProcessingId(null);

    if (error) {
      toast.error('Failed to reject: ' + error.message);
      return;
    }

    toast.success('Content rejected.');
    setPendingCounts(prev => ({ ...prev, [type]: prev[type as keyof typeof prev] - 1 }));
    
    // Optimistically update the local state immediately
    if (type === 'materials') {
      setAllMaterials(prev => prev.map(m => m.id === item.id ? { ...m, status: 'rejected' } : m));
    } else if (type === 'news') {
      setAllNews(prev => prev.map(n => n.id === item.id ? { ...n, status: 'rejected' } : n));
    } else if (type === 'books') {
      setAllBooks(prev => prev.map(b => b.id === item.id ? { ...b, status: 'rejected' } : b));
    }
  };

  const handleIgnoreReport = async (report: Report) => {
    setProcessingId(report.id);
    const { error } = await updateReportStatus(report.id, 'ignored');
    setProcessingId(null);

    if (error) {
      toast.error('Failed to ignore report: ' + error.message);
      return;
    }

    toast.success('Report ignored');
    setReports(prev => prev.filter(r => r.id !== report.id));
    setReportCount(prev => prev - 1);
  };

  const handleDeleteReportedContent = async (report: Report) => {
    setProcessingId(report.id);
    
    const { error: deleteError } = await deleteReportedContent(
      report.content_type as ReportContentType,
      report.content_id
    );

    if (deleteError) {
      toast.error('Failed to delete content: ' + deleteError.message);
      setProcessingId(null);
      return;
    }

    await updateReportStatus(report.id, 'resolved');
    setProcessingId(null);

    toast.success('Content deleted and report resolved');
    setReports(prev => prev.filter(r => r.id !== report.id));
    setReportCount(prev => prev - 1);
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'MMM d, yyyy');
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="bg-green-500/20 text-green-600 border-green-500/30">Approved</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">Pending</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleAdminPreviewComplete = (materialId: string) => {
    setPreviewedMaterialIds(prev => new Set(prev).add(materialId));
    // Update in database
    supabase.from('materials').update({ admin_previewed: true }).eq('id', materialId);
  };

  const renderContentTable = (items: ContentItem[], type: 'materials' | 'news' | 'books') => {
    if (items.length === 0) {
      return <p className="text-muted-foreground text-center py-8">No {type} found</p>;
    }

    const isMaterial = type === 'materials';

    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-3 text-sm font-medium text-muted-foreground">Title</th>
              <th className="text-left p-3 text-sm font-medium text-muted-foreground hidden sm:table-cell">Status</th>
              <th className="text-left p-3 text-sm font-medium text-muted-foreground hidden md:table-cell">Creator</th>
              <th className="text-left p-3 text-sm font-medium text-muted-foreground hidden md:table-cell">Date</th>
              <th className="text-right p-3 text-sm font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const isPreviewed = previewedMaterialIds.has(item.id) || item.admin_previewed;
              
              return (
                <tr key={item.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                  <td className="p-3 font-medium text-foreground max-w-xs truncate">
                    <div className="flex items-center gap-2">
                      {item.title}
                      {isMaterial && isPreviewed && (
                        <Badge variant="secondary" className="bg-green-500/20 text-green-700 text-xs">
                          <Check className="w-3 h-3 mr-1" />
                          Previewed
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="p-3 hidden sm:table-cell">{getStatusBadge(item.status)}</td>
                  <td className="p-3 text-muted-foreground hidden md:table-cell">{item.contributor_name}</td>
                  <td className="p-3 text-muted-foreground hidden md:table-cell">{formatDate(item.created_at)}</td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-2">
                      {/* Preview button for materials */}
                      {isMaterial && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setPreviewMaterial(item)}
                          className={isPreviewed ? 'border-green-500/50' : ''}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                      
                      {item.status === 'pending' && (
                        <>
                          <Button 
                            variant="default" 
                            size="sm" 
                            onClick={() => handleApprove(type, item)}
                            disabled={processingId === item.id}
                          >
                            {processingId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleReject(type, item)}
                            disabled={processingId === item.id}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => setDeleteConfirm({ type, id: item.id, title: item.title })}
                        disabled={processingId === item.id}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const handleToggleUserDisabled = async (userItem: UserItem) => {
    setProcessingId(userItem.id);
    const newDisabledState = !userItem.is_disabled;
    
    const { error } = await toggleUserDisabled(userItem.id, newDisabledState);
    setProcessingId(null);

    if (error) {
      toast.error('Failed to update user status: ' + error.message);
      return;
    }

    toast.success(newDisabledState ? 'User account disabled' : 'User account enabled');
    setAllUsers(prev => prev.map(u => 
      u.id === userItem.id ? { ...u, is_disabled: newDisabledState } : u
    ));
  };

  const handleForcePasswordReset = async (userItem: UserItem) => {
    setProcessingId(userItem.id);
    
    const { error } = await sendPasswordResetEmail(userItem.email);
    setProcessingId(null);

    if (error) {
      toast.error('Failed to send password reset: ' + error.message);
      return;
    }

    toast.success(`Password reset email sent to ${userItem.email}`);
  };

  const handleMarkMessageRead = async (message: ContactMessage) => {
    if (message.is_read) return;
    
    const { error } = await markMessageAsRead(message.id);
    if (error) {
      toast.error('Failed to mark as read');
      return;
    }

    setContactMessages(prev => prev.map(m => 
      m.id === message.id ? { ...m, is_read: true } : m
    ));
    setUnreadMessagesCount(prev => Math.max(0, prev - 1));
  };

  const handleDeleteMessage = async (messageId: string) => {
    setProcessingId(messageId);
    
    const { error } = await deleteContactMessage(messageId);
    setProcessingId(null);

    if (error) {
      toast.error('Failed to delete message');
      return;
    }

    toast.success('Message deleted');
    setContactMessages(prev => prev.filter(m => m.id !== messageId));
  };

  const renderUsersTable = () => {
    if (allUsers.length === 0) {
      return <p className="text-muted-foreground text-center py-8">No users found</p>;
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-3 text-sm font-medium text-muted-foreground">Name</th>
              <th className="text-left p-3 text-sm font-medium text-muted-foreground hidden sm:table-cell">Email</th>
              <th className="text-left p-3 text-sm font-medium text-muted-foreground hidden md:table-cell">Phone</th>
              <th className="text-left p-3 text-sm font-medium text-muted-foreground hidden md:table-cell">Status</th>
              <th className="text-left p-3 text-sm font-medium text-muted-foreground hidden lg:table-cell">XP</th>
              <th className="text-right p-3 text-sm font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {allUsers.map((userItem) => (
              <tr key={userItem.id} className={`border-b border-border last:border-0 hover:bg-muted/50 ${userItem.is_disabled ? 'opacity-60' : ''}`}>
                <td className="p-3">
                  <div>
                    <p className="font-medium text-foreground">{userItem.full_name}</p>
                    <p className="text-xs text-muted-foreground sm:hidden">{userItem.email}</p>
                  </div>
                </td>
                <td className="p-3 text-muted-foreground hidden sm:table-cell">{userItem.email}</td>
                <td className="p-3 text-muted-foreground hidden md:table-cell">{userItem.mobile_number || '-'}</td>
                <td className="p-3 hidden md:table-cell">
                  {userItem.is_disabled ? (
                    <Badge variant="destructive">Disabled</Badge>
                  ) : (
                    <Badge variant="default" className="bg-green-500/20 text-green-600 border-green-500/30">Active</Badge>
                  )}
                </td>
                <td className="p-3 text-muted-foreground hidden lg:table-cell">{userItem.total_xp}</td>
                <td className="p-3 text-right">
                  <div className="flex justify-end gap-1">
                    <Button 
                      variant={userItem.is_disabled ? "default" : "outline"}
                      size="sm" 
                      onClick={() => handleToggleUserDisabled(userItem)}
                      disabled={processingId === userItem.id || userItem.id === user?.id}
                      title={userItem.is_disabled ? 'Enable account' : 'Disable account'}
                    >
                      {processingId === userItem.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Ban className="w-4 h-4" />
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleForcePasswordReset(userItem)}
                      disabled={processingId === userItem.id}
                      title="Send password reset email"
                    >
                      <KeyRound className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => setDeleteConfirm({ type: 'users', id: userItem.id, title: userItem.full_name })}
                      disabled={processingId === userItem.id || userItem.id === user?.id}
                      title="Delete user"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderContactMessagesTab = () => {
    if (contactMessages.length === 0) {
      return <p className="text-muted-foreground text-center py-8">No contact messages</p>;
    }

    return (
      <div className="space-y-4">
        {contactMessages.map((message) => (
          <Card 
            key={message.id} 
            className={`border-border ${!message.is_read ? 'border-l-4 border-l-primary' : ''}`}
            onClick={() => handleMarkMessageRead(message)}
          >
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{message.name}</span>
                    {!message.is_read && (
                      <Badge variant="default" className="text-xs">New</Badge>
                    )}
                  </div>
                  
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p className="flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      <a href={`mailto:${message.email}`} className="hover:text-primary">
                        {message.email}
                      </a>
                    </p>
                    <p>Received: {formatDate(message.created_at)}</p>
                  </div>

                  <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm text-foreground whitespace-pre-wrap">{message.message}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteMessage(message.id);
                    }}
                    disabled={processingId === message.id}
                    className="flex items-center gap-1"
                  >
                    {processingId === message.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderReportsTab = () => {
    if (reports.length === 0) {
      return <p className="text-muted-foreground text-center py-8">No pending reports</p>;
    }

    return (
      <div className="space-y-4">
        {reports.map((report) => (
          <Card key={report.id} className="border-border">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {report.content_type}
                    </Badge>
                    <span className="text-sm font-medium text-foreground">
                      {report.content_title}
                    </span>
                  </div>
                  
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p><span className="font-medium">Reported user:</span> {report.reported_user_name}</p>
                    <p><span className="font-medium">Reported by:</span> {report.reporter_name}</p>
                    <p><span className="font-medium">Time:</span> {formatDate(report.created_at)}</p>
                  </div>

                  <div className="flex flex-wrap gap-1 mt-2">
                    {report.reasons.map((reason, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {reason}
                      </Badge>
                    ))}
                  </div>

                  {report.comment && (
                    <p className="text-sm text-muted-foreground italic mt-2">"{report.comment}"</p>
                  )}
                </div>

                <div className="flex gap-2 md:flex-col">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteReportedContent(report)}
                    disabled={processingId === report.id}
                    className="flex items-center gap-1"
                  >
                    {processingId === report.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    <span className="hidden sm:inline">Delete</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleIgnoreReport(report)}
                    disabled={processingId === report.id}
                    className="flex items-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    <span className="hidden sm:inline">Ignore</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const handleApproveOrganizer = async (app: any) => {
    setProcessingId(app.id);
    try {
      // Add organizer role
      await supabase.from('user_roles').insert({ user_id: app.user_id, role: 'organizer' });
      // Update application status
      await supabase.from('organizer_applications').update({ 
        status: 'approved', 
        reviewed_by: user?.id, 
        reviewed_at: new Date().toISOString() 
      }).eq('id', app.id);
      
      toast.success('Organizer approved!');
      setOrganizerApps(prev => prev.filter(a => a.id !== app.id));
      setOrganizerAppsCount(prev => prev - 1);
    } catch (error: any) {
      toast.error('Failed to approve: ' + error.message);
    }
    setProcessingId(null);
  };

  const handleRejectOrganizer = async (app: any) => {
    setProcessingId(app.id);
    try {
      await supabase.from('organizer_applications').update({ 
        status: 'rejected', 
        reviewed_by: user?.id, 
        reviewed_at: new Date().toISOString() 
      }).eq('id', app.id);
      
      toast.success('Application rejected');
      setOrganizerApps(prev => prev.filter(a => a.id !== app.id));
      setOrganizerAppsCount(prev => prev - 1);
    } catch (error: any) {
      toast.error('Failed to reject: ' + error.message);
    }
    setProcessingId(null);
  };

  const renderOrganizerAppsTab = () => {
    if (organizerApps.length === 0) {
      return (
        <div className="text-center py-8 space-y-4">
          <p className="text-muted-foreground">No pending organizer applications</p>
          <div className="p-4 rounded-lg bg-muted/50 max-w-md mx-auto">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> With the new onboarding flow, organizers can register directly. 
              Check the <strong>"Organizers"</strong> tab to manage all organizer profiles and verification status.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {organizerApps.map((app) => (
          <Card key={app.id}>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <p className="font-medium">User ID: {app.user_id.slice(0, 8)}...</p>
                  <p className="text-sm text-muted-foreground">Applied: {formatDate(app.created_at)}</p>
                  {app.reason && <p className="text-sm italic">"{app.reason}"</p>}
                  <a href={app.proof_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                    View Proof Document
                  </a>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleApproveOrganizer(app)} disabled={processingId === app.id}>
                    {processingId === app.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
                    Approve
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleRejectOrganizer(app)} disabled={processingId === app.id}>
                    <X className="w-4 h-4 mr-1" /> Reject
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const handleToggleEventStatus = async (event: any) => {
    setProcessingId(event.id);
    const newStatus = event.status === 'published' ? 'cancelled' : 'published';
    
    const { error } = await supabase
      .from('events')
      .update({ status: newStatus })
      .eq('id', event.id);
    
    setProcessingId(null);

    if (error) {
      toast.error('Failed to update event status');
      return;
    }

    toast.success(`Event ${newStatus === 'published' ? 'published' : 'cancelled'}`);
    setAllEvents(prev => prev.map(e => 
      e.id === event.id ? { ...e, status: newStatus } : e
    ));
  };

  const renderEventsTab = () => {
    if (allEvents.length === 0) {
      return <p className="text-muted-foreground text-center py-8">No events found</p>;
    }

    return (
      <div className="space-y-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 text-sm font-medium text-muted-foreground">Event</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground hidden sm:table-cell">Status</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground hidden md:table-cell">Registrations</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground hidden md:table-cell">Date</th>
                <th className="text-right p-3 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {allEvents.map((event) => (
                <tr key={event.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                  <td className="p-3">
                    <div>
                      <p className="font-medium text-foreground">{event.title}</p>
                      <p className="text-xs text-muted-foreground">{event.category} • {event.event_type}</p>
                    </div>
                  </td>
                  <td className="p-3 hidden sm:table-cell">
                    <Badge variant={
                      event.status === 'published' ? 'default' :
                      event.status === 'cancelled' ? 'destructive' :
                      event.status === 'completed' ? 'secondary' : 'outline'
                    }>
                      {event.status}
                    </Badge>
                  </td>
                  <td className="p-3 hidden md:table-cell">
                    <span className="text-sm">{event.registrations_count || 0}</span>
                  </td>
                  <td className="p-3 text-muted-foreground hidden md:table-cell text-sm">
                    {formatDate(event.start_date)}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant={event.status === 'published' ? 'destructive' : 'default'}
                        size="sm"
                        onClick={() => handleToggleEventStatus(event)}
                        disabled={processingId === event.id}
                        title={event.status === 'published' ? 'Cancel event' : 'Publish event'}
                      >
                        {processingId === event.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : event.status === 'published' ? (
                          <ToggleRight className="w-4 h-4" />
                        ) : (
                          <ToggleLeft className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/events/${event.slug || event.id}`, '_blank')}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <AdminEventDeleteDialog
                        eventId={event.id}
                        eventTitle={event.title}
                        registrationsCount={event.registrations_count || 0}
                        onDeleted={() => setAllEvents(prev => prev.filter(e => e.id !== event.id))}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Global Registrations */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Recent Registrations</h3>
          {allRegistrations.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No registrations yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Event</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground hidden sm:table-cell">User</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground hidden md:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {allRegistrations.slice(0, 20).map((reg) => (
                    <tr key={reg.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                      <td className="p-3 text-sm text-foreground">{reg.event?.title || 'Unknown'}</td>
                      <td className="p-3 text-sm text-muted-foreground hidden sm:table-cell">{reg.user_id.slice(0, 8)}...</td>
                      <td className="p-3">
                        <Badge variant={
                          reg.payment_status === 'approved' ? 'default' :
                          reg.payment_status === 'rejected' ? 'destructive' :
                          reg.payment_status === 'used' ? 'secondary' : 'outline'
                        } className="text-xs">
                          {reg.payment_status}
                        </Badge>
                      </td>
                      <td className="p-3 text-sm text-muted-foreground hidden md:table-cell">{formatDate(reg.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  const totalPending = pendingCounts.materials + pendingCounts.news + pendingCounts.books;

  return (
    <div className="h-dvh flex flex-col bg-background overflow-hidden">
      <main className="flex-1 overflow-y-auto overflow-x-hidden py-8">
        <div className="container-wide">
          {/* Header */}
          <div className="mb-8 flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Admin Panel
              </h1>
              <p className="text-muted-foreground">
                Full administrative control over all content
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <FileText className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold text-foreground">{counts.materials}</p>
                  <p className="text-xs text-muted-foreground">Materials</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Newspaper className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold text-foreground">{counts.news}</p>
                  <p className="text-xs text-muted-foreground">News</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <BookOpen className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold text-foreground">{counts.books}</p>
                  <p className="text-xs text-muted-foreground">Books</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Users className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold text-foreground">{counts.users}</p>
                  <p className="text-xs text-muted-foreground">Users</p>
                </div>
              </CardContent>
            </Card>
            <Card className={reportCount > 0 ? "border-destructive" : ""}>
              <CardContent className="p-4 flex items-center gap-3">
                <Flag className={`w-8 h-8 ${reportCount > 0 ? 'text-destructive' : 'text-primary'}`} />
                <div>
                  <p className="text-2xl font-bold text-foreground">{reportCount}</p>
                  <p className="text-xs text-muted-foreground">Reports</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Calendar className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold text-foreground">{counts.events}</p>
                  <p className="text-xs text-muted-foreground">Events</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pending Alert */}
          {totalPending > 0 && (
            <Card className="mb-6 border-yellow-500/30 bg-yellow-500/5">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <p className="text-sm text-foreground">
                  <span className="font-medium">{totalPending} items</span> pending approval
                </p>
              </CardContent>
            </Card>
          )}

          {/* Content Tabs */}
          <Card>
            <Tabs defaultValue="materials">
              <CardHeader className="pb-0">
                <TabsList className="flex flex-wrap h-auto gap-1">
                  <TabsTrigger value="materials" className="text-xs sm:text-sm">
                    Materials
                  </TabsTrigger>
                  <TabsTrigger value="news" className="text-xs sm:text-sm">
                    News
                  </TabsTrigger>
                  <TabsTrigger value="books" className="text-xs sm:text-sm">
                    Books
                  </TabsTrigger>
                  <TabsTrigger value="users" className="text-xs sm:text-sm">
                    Users
                  </TabsTrigger>
                  <TabsTrigger value="reports" className="text-xs sm:text-sm">
                    Reports {reportCount > 0 && <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 text-xs">{reportCount}</Badge>}
                  </TabsTrigger>
                  <TabsTrigger value="messages" className="text-xs sm:text-sm">
                    Messages {unreadMessagesCount > 0 && <Badge variant="default" className="ml-1 h-5 w-5 p-0 text-xs">{unreadMessagesCount}</Badge>}
                  </TabsTrigger>
                  <TabsTrigger value="organizers" className="text-xs sm:text-sm">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Applications {organizerAppsCount > 0 && <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs">{organizerAppsCount}</Badge>}
                  </TabsTrigger>
                  <TabsTrigger value="org-profiles" className="text-xs sm:text-sm">
                    <Users className="w-3 h-3 mr-1" />
                    Organizers
                  </TabsTrigger>
                  <TabsTrigger value="events" className="text-xs sm:text-sm">
                    <Calendar className="w-3 h-3 mr-1" />
                    Events
                  </TabsTrigger>
                  <TabsTrigger value="assistants" className="text-xs sm:text-sm">
                    <UserPlus className="w-3 h-3 mr-1" />
                    Assistants
                  </TabsTrigger>
                  <TabsTrigger value="system" className="text-xs sm:text-sm">
                    <Bell className="w-3 h-3 mr-1" />
                    System
                  </TabsTrigger>
                  <TabsTrigger value="broadcast" className="text-xs sm:text-sm">
                    <Send className="w-3 h-3 mr-1" />
                    Broadcast
                  </TabsTrigger>
                </TabsList>
              </CardHeader>

              <CardContent className="pt-6">
                <TabsContent value="materials" className="mt-0">
                  {renderContentTable(allMaterials, 'materials')}
                </TabsContent>

                <TabsContent value="news" className="mt-0">
                  {renderContentTable(allNews, 'news')}
                </TabsContent>

                <TabsContent value="books" className="mt-0">
                  {renderContentTable(allBooks, 'books')}
                </TabsContent>

                <TabsContent value="users" className="mt-0">
                  {renderUsersTable()}
                </TabsContent>

                <TabsContent value="reports" className="mt-0">
                  {renderReportsTab()}
                </TabsContent>

                <TabsContent value="messages" className="mt-0">
                  {renderContactMessagesTab()}
                </TabsContent>

                <TabsContent value="organizers" className="mt-0">
                  {renderOrganizerAppsTab()}
                </TabsContent>

                <TabsContent value="org-profiles" className="mt-0">
                  <AdminOrganizerManager />
                </TabsContent>

                <TabsContent value="events" className="mt-0">
                  {renderEventsTab()}
                </TabsContent>


                <TabsContent value="assistants" className="mt-0">
                  <AdminAssistantManager isFullAdmin={isUserFullAdmin} />
                </TabsContent>

                <TabsContent value="system" className="mt-0">
                  <SystemToolsTab userId={user?.id} />
                </TabsContent>

                <TabsContent value="broadcast" className="mt-0 space-y-6">
                  <AdminResendTickets />
                  <AdminBroadcastEmail />
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteConfirm?.type.slice(0, -1)}?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteConfirm?.title}"? This action cannot be undone.
              {deleteConfirm?.type === 'users' && (
                <span className="block mt-2 text-destructive font-medium">
                  Warning: This will also delete all content created by this user.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDeleteContent(deleteConfirm.type, deleteConfirm.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Material Preview Modal */}
      <EnhancedMaterialPreview
        material={previewMaterial ? {
          ...previewMaterial,
          file_url: previewMaterial.file_url || '',
          file_type: previewMaterial.file_type || 'pdf',
          downloads_count: previewMaterial.downloads_count || 0,
          views_count: previewMaterial.views_count || 0,
          likes_count: previewMaterial.likes_count || 0,
        } : null}
        isOpen={!!previewMaterial}
        onClose={() => setPreviewMaterial(null)}
        onDownload={() => {
          if (!previewMaterial) return;
          const downloadUrl = getMaterialDownloadUrl(previewMaterial.id, true);
          window.open(downloadUrl, '_blank', 'noopener,noreferrer');
        }}
        isAdmin={true}
        onAdminPreviewComplete={handleAdminPreviewComplete}
      />
    </div>
  );
};

export default Admin;
