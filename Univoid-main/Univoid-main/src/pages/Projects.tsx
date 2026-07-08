import { useState, useEffect } from "react";
import { Link, useSearchParams, useOutletContext } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Users, Search, Folder, UserPlus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getProjects, Project } from "@/services/projectsService";
import SEOHead from "@/components/common/SEOHead";

import { useSkeletonSync } from "@/hooks/useSkeleton";
import { supabase } from "@/integrations/supabase/client";

interface LayoutContext {
  onAuthClick?: () => void;
}

const Projects = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('event');
  const context = useOutletContext<LayoutContext>();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [rawLoading, setRawLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Use skeleton sync - skeleton only appears if loading takes >150ms
  const isLoading = useSkeletonSync(rawLoading, { showDelay: 150 });

  useEffect(() => {
    loadProjects();

    // Real-time subscription for instant updates
    const channel = supabase
      .channel('projects-page-realtime')
      .on(
        'postgres_changes' as any,
        { event: '*', schema: 'public', table: 'projects' },
        (payload: any) => {
          const newData = payload.new as Project;
          
          if (payload.eventType === 'INSERT' && newData?.is_open) {
            setProjects(prev => {
              if (prev.some(p => p.id === newData.id)) return prev;
              return [newData, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            setProjects(prev => prev.map(p => 
              p.id === newData.id ? { ...p, ...newData } : p
            ));
          } else if (payload.eventType === 'DELETE') {
            setProjects(prev => prev.filter(p => p.id !== payload.old?.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  const loadProjects = async () => {
    setRawLoading(true);
    try {
      const data = await getProjects(eventId || undefined);
      setProjects(data);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setRawLoading(false);
    }
  };

  const filteredProjects = projects.filter(project =>
    project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.skills_required.some(skill => 
      skill.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const ProjectSkeleton = () => (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2 mt-2" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-2/3 mb-4" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div>
      <SEOHead
        title="Project Partner - Find Your Team"
        description="Find teammates for hackathons, projects, and startups. Collaborate with students who have the skills you need. Join open projects or create your own."
        url="/projects"
        keywords={['project partner', 'find teammates', 'hackathon team', 'college projects', 'student collaboration', 'UniVoid']}
      />

      <div className="py-8">
        <div className="container-wide">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
                  <Folder className="w-8 h-8 text-primary" />
                  Project Partner
                </h1>
                <p className="text-muted-foreground mt-1">
                  Find teammates for hackathons, projects & startups
                </p>
              </div>
              
              {user ? (
                <Link to="/projects/create">
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Create Project
                  </Button>
                </Link>
              ) : (
                <Button className="gap-2" onClick={context?.onAuthClick}>
                  <Plus className="w-4 h-4" />
                  Create Project
                </Button>
              )}
            </div>

            {eventId && (
              <Badge variant="secondary" className="mt-4">
                Filtered by event
              </Badge>
            )}
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search projects or skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Projects Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <ProjectSkeleton key={i} />
              ))}
            </div>
          ) : filteredProjects.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Folder className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No projects found
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery ? "Try a different search term" : "Be the first to create a project!"}
                </p>
                {user && !searchQuery && (
                  <Link to="/projects/create">
                    <Button>Create Your Project</Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 staggered-grid-fast">
              {filteredProjects.map((project) => (
                <Link key={project.id} to={`/projects/${project.id}`}>
                  <Card className="border-border hover:border-primary/50 transition-colors h-full">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-lg line-clamp-2">
                          {project.title}
                        </CardTitle>
                        <Badge variant={project.is_open ? "default" : "secondary"}>
                          {project.is_open ? "Open" : "Closed"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        by {project.owner_name}
                      </p>
                    </CardHeader>
                    <CardContent>
                      {project.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                          {project.description}
                        </p>
                      )}
                      
                      {/* Skills */}
                      {project.skills_required.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {project.skills_required.slice(0, 4).map((skill, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {project.skills_required.length > 4 && (
                            <Badge variant="outline" className="text-xs">
                              +{project.skills_required.length - 4}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {project.member_count}/{project.max_members}
                        </div>
                        {project.is_open && (
                          <div className="flex items-center gap-1 text-primary">
                            <UserPlus className="w-4 h-4" />
                            Join
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      
    </div>
  );
};

export default Projects;
