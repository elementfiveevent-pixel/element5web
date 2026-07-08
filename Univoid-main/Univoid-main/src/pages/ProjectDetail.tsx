import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Users, Plus, Check, X, Loader2, 
  CheckSquare, Clock, User, Trash2, Settings
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { 
  getProjectById, 
  getProjectMembers, 
  getProjectTasks, 
  getProjectRequests,
  createProjectTask,
  updateProjectTask,
  deleteProjectTask,
  approveProjectRequest,
  rejectProjectRequest,
  requestToJoinProject,
  hasExistingRequest,
  isProjectMember,
  updateProject,
  Project,
  ProjectMember,
  ProjectTask,
  ProjectRequest,
} from "@/services/projectsService";
import { toast } from "sonner";
import { Helmet } from "react-helmet";
import AuthModal from "@/components/auth/AuthModal";
import PageBreadcrumb from "@/components/common/PageBreadcrumb";
import { format } from "date-fns";

const ProjectDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [requests, setRequests] = useState<ProjectRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  // Permissions
  const [isMember, setIsMember] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);
  
  // Forms
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [joinMessage, setJoinMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadProject();
  }, [projectId, user]);

  const loadProject = async () => {
    if (!projectId) return;
    
    setIsLoading(true);
    try {
      const projectData = await getProjectById(projectId);
      if (!projectData) {
        navigate('/projects');
        return;
      }
      setProject(projectData);
      
      const [membersData, tasksData] = await Promise.all([
        getProjectMembers(projectId),
        getProjectTasks(projectId),
      ]);
      
      setMembers(membersData);
      setTasks(tasksData);

      if (user) {
        const userIsOwner = projectData.owner_id === user.id;
        setIsOwner(userIsOwner);
        
        if (userIsOwner) {
          const requestsData = await getProjectRequests(projectId);
          setRequests(requestsData);
        }
        
        const memberStatus = await isProjectMember(projectId);
        setIsMember(memberStatus);
        
        if (!memberStatus && !userIsOwner) {
          const requestStatus = await hasExistingRequest(projectId);
          setHasRequested(requestStatus);
        }
      }
    } catch (error) {
      console.error('Failed to load project:', error);
      toast.error('Failed to load project');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRequest = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await requestToJoinProject(projectId!, joinMessage);
      if (error) throw error;
      
      toast.success('Join request sent!');
      setHasRequested(true);
      setShowJoinDialog(false);
      setJoinMessage("");
    } catch (error: any) {
      toast.error(error.message || 'Failed to send request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveRequest = async (request: ProjectRequest) => {
    setProcessingId(request.id);
    try {
      const { error } = await approveProjectRequest(request.id, projectId!, request.user_id);
      if (error) throw error;
      
      toast.success('Member added!');
      setRequests(prev => prev.filter(r => r.id !== request.id));
      loadProject(); // Reload to get updated members
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectRequest = async (request: ProjectRequest) => {
    setProcessingId(request.id);
    try {
      const { error } = await rejectProjectRequest(request.id);
      if (error) throw error;
      
      toast.success('Request rejected');
      setRequests(prev => prev.filter(r => r.id !== request.id));
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject');
    } finally {
      setProcessingId(null);
    }
  };

  const handleCreateTask = async () => {
    if (!taskTitle.trim()) {
      toast.error('Task title is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await createProjectTask({
        project_id: projectId!,
        title: taskTitle.trim(),
        description: taskDescription.trim() || undefined,
      });
      if (error) throw error;
      
      toast.success('Task created!');
      setTaskTitle("");
      setTaskDescription("");
      setShowTaskForm(false);
      loadProject();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTaskStatus = async (task: ProjectTask, newStatus: 'todo' | 'in_progress' | 'done') => {
    setProcessingId(task.id);
    try {
      const { error } = await updateProjectTask(task.id, { status: newStatus });
      if (error) throw error;
      
      setTasks(prev => prev.map(t => 
        t.id === task.id ? { ...t, status: newStatus } : t
      ));
      toast.success('Task updated');
    } catch (error: any) {
      toast.error('Failed to update task');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    setProcessingId(taskId);
    try {
      const { error } = await deleteProjectTask(taskId);
      if (error) throw error;
      
      setTasks(prev => prev.filter(t => t.id !== taskId));
      toast.success('Task deleted');
    } catch (error: any) {
      toast.error('Failed to delete task');
    } finally {
      setProcessingId(null);
    }
  };

  const handleToggleOpen = async () => {
    if (!project) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await updateProject(projectId!, { is_open: !project.is_open });
      if (error) throw error;
      
      setProject(prev => prev ? { ...prev, is_open: !prev.is_open } : null);
      toast.success(project.is_open ? 'Project closed' : 'Project opened');
    } catch (error: any) {
      toast.error('Failed to update project');
    } finally {
      setIsSubmitting(false);
    }
  };

  const todoTasks = tasks.filter(t => t.status === 'todo');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const doneTasks = tasks.filter(t => t.status === 'done');

  if (isLoading) {
    return (
      <main className="flex-1 py-8">
        <div className="container-wide max-w-4xl">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-32 w-full mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </main>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <>
      <Helmet>
        <title>{project.title} | UniVoid Projects</title>
      </Helmet>

        <main className="flex-1 py-8">
          <div className="container-wide max-w-4xl">
            <PageBreadcrumb 
              items={[
                { label: "Projects", href: "/projects" },
                { label: project.title }
              ]} 
            />

            {/* Project Header */}
            <Card className="mb-6">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-2xl">{project.title}</CardTitle>
                      <Badge variant={project.is_open ? "default" : "secondary"}>
                        {project.is_open ? "Open" : "Closed"}
                      </Badge>
                    </div>
                    <CardDescription>
                      Created by {project.owner_name} • {members.length + 1} member{members.length !== 0 ? 's' : ''}
                    </CardDescription>
                  </div>
                  
                  {!isMember && !isOwner && project.is_open && (
                    <Button 
                      onClick={() => setShowJoinDialog(true)}
                      disabled={hasRequested}
                    >
                      {hasRequested ? 'Request Pending' : 'Request to Join'}
                    </Button>
                  )}
                  
                  {isOwner && (
                    <Button 
                      variant="outline" 
                      onClick={handleToggleOpen}
                      disabled={isSubmitting}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      {project.is_open ? 'Close Project' : 'Open Project'}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {project.description && (
                  <p className="text-muted-foreground mb-4">{project.description}</p>
                )}
                
                {project.skills_required && project.skills_required.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {project.skills_required.map((skill) => (
                      <Badge key={skill} variant="outline">{skill}</Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="tasks">
              <TabsList className="mb-4">
                <TabsTrigger value="tasks">
                  <CheckSquare className="w-4 h-4 mr-2" />
                  Tasks ({tasks.length})
                </TabsTrigger>
                <TabsTrigger value="members">
                  <Users className="w-4 h-4 mr-2" />
                  Team ({members.length + 1})
                </TabsTrigger>
                {isOwner && requests.length > 0 && (
                  <TabsTrigger value="requests">
                    Requests
                    <Badge variant="destructive" className="ml-2">{requests.length}</Badge>
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="tasks">
                {(isMember || isOwner) && (
                  <div className="mb-4">
                    {showTaskForm ? (
                      <Card>
                        <CardContent className="pt-4 space-y-4">
                          <Input
                            placeholder="Task title"
                            value={taskTitle}
                            onChange={(e) => setTaskTitle(e.target.value)}
                          />
                          <Textarea
                            placeholder="Description (optional)"
                            value={taskDescription}
                            onChange={(e) => setTaskDescription(e.target.value)}
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <Button onClick={handleCreateTask} disabled={isSubmitting}>
                              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                              Create Task
                            </Button>
                            <Button variant="outline" onClick={() => setShowTaskForm(false)}>
                              Cancel
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <Button onClick={() => setShowTaskForm(true)} className="gap-2">
                        <Plus className="w-4 h-4" />
                        Add Task
                      </Button>
                    )}
                  </div>
                )}

                {tasks.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="py-12 text-center">
                      <CheckSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No tasks yet</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid md:grid-cols-3 gap-4">
                    {/* Todo Column */}
                    <div className="space-y-2">
                      <h3 className="font-medium text-muted-foreground flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        To Do ({todoTasks.length})
                      </h3>
                      {todoTasks.map((task) => (
                        <TaskCard 
                          key={task.id} 
                          task={task} 
                          canEdit={isMember || isOwner}
                          processingId={processingId}
                          onStatusChange={handleUpdateTaskStatus}
                          onDelete={handleDeleteTask}
                        />
                      ))}
                    </div>

                    {/* In Progress Column */}
                    <div className="space-y-2">
                      <h3 className="font-medium text-muted-foreground flex items-center gap-2">
                        <Loader2 className="w-4 h-4" />
                        In Progress ({inProgressTasks.length})
                      </h3>
                      {inProgressTasks.map((task) => (
                        <TaskCard 
                          key={task.id} 
                          task={task} 
                          canEdit={isMember || isOwner}
                          processingId={processingId}
                          onStatusChange={handleUpdateTaskStatus}
                          onDelete={handleDeleteTask}
                        />
                      ))}
                    </div>

                    {/* Done Column */}
                    <div className="space-y-2">
                      <h3 className="font-medium text-muted-foreground flex items-center gap-2">
                        <Check className="w-4 h-4" />
                        Done ({doneTasks.length})
                      </h3>
                      {doneTasks.map((task) => (
                        <TaskCard 
                          key={task.id} 
                          task={task} 
                          canEdit={isMember || isOwner}
                          processingId={processingId}
                          onStatusChange={handleUpdateTaskStatus}
                          onDelete={handleDeleteTask}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="members">
                <div className="space-y-3">
                  {/* Owner */}
                  <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{project.owner_name?.charAt(0) || 'O'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{project.owner_name}</p>
                        <p className="text-xs text-muted-foreground">Owner</p>
                      </div>
                      <Badge>Owner</Badge>
                    </CardContent>
                  </Card>

                  {/* Members */}
                  {members.map((member) => (
                    <Card key={member.id}>
                      <CardContent className="p-4 flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>{member.user_name?.charAt(0) || 'M'}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">{member.user_name}</p>
                          <p className="text-xs text-muted-foreground">
                            Joined {format(new Date(member.joined_at), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <Badge variant="secondary">{member.role || 'Member'}</Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {isOwner && (
                <TabsContent value="requests">
                  {requests.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No pending requests</p>
                  ) : (
                    <div className="space-y-3">
                      {requests.map((request) => (
                        <Card key={request.id}>
                          <CardContent className="p-4 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarFallback>{request.user_name?.charAt(0) || 'U'}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{request.user_name}</p>
                                {request.message && (
                                  <p className="text-sm text-muted-foreground italic">"{request.message}"</p>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                onClick={() => handleApproveRequest(request)}
                                disabled={processingId === request.id}
                              >
                                {processingId === request.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Check className="w-4 h-4" />
                                )}
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleRejectRequest(request)}
                                disabled={processingId === request.id}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              )}
            </Tabs>
          </div>
        </main>

      {/* Join Request Dialog */}
      <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request to Join</DialogTitle>
            <DialogDescription>
              Send a request to join this project
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Introduce yourself and explain why you want to join (optional)"
            value={joinMessage}
            onChange={(e) => setJoinMessage(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowJoinDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleJoinRequest} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </>
  );
};

// Task Card Component
const TaskCard = ({ 
  task, 
  canEdit, 
  processingId,
  onStatusChange,
  onDelete,
}: { 
  task: ProjectTask; 
  canEdit: boolean;
  processingId: string | null;
  onStatusChange: (task: ProjectTask, status: 'todo' | 'in_progress' | 'done') => void;
  onDelete: (taskId: string) => void;
}) => (
  <Card className="border-border">
    <CardContent className="p-3">
      <p className="font-medium text-sm mb-1">{task.title}</p>
      {task.description && (
        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{task.description}</p>
      )}
      {task.assignee_name && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <User className="w-3 h-3" />
          {task.assignee_name}
        </p>
      )}
      
      {canEdit && (
        <div className="flex gap-1 mt-2">
          <Select
            value={task.status}
            onValueChange={(value) => onStatusChange(task, value as 'todo' | 'in_progress' | 'done')}
            disabled={processingId === task.id}
          >
            <SelectTrigger className="h-7 text-xs flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todo">To Do</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="done">Done</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => onDelete(task.id)}
            disabled={processingId === task.id}
          >
            {processingId === task.id ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Trash2 className="w-3 h-3 text-destructive" />
            )}
          </Button>
        </div>
      )}
    </CardContent>
  </Card>
);

export default ProjectDetail;
