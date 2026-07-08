import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, X, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { createProject } from "@/services/projectsService";
import { toast } from "sonner";
import { Helmet } from "react-helmet";
import { Navigate } from "react-router-dom";

const CreateProject = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [maxMembers, setMaxMembers] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user) {
    return <Navigate to="/projects" replace />;
  }

  const addSkill = () => {
    const skill = skillInput.trim();
    if (skill && !skills.includes(skill)) {
      setSkills([...skills, skill]);
      setSkillInput("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error("Please enter a project title");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await createProject({
        title: title.trim(),
        description: description.trim() || undefined,
        skills_required: skills,
        max_members: maxMembers,
      });

      if (error) throw error;

      toast.success("Project created successfully!");
      navigate(`/projects/${data?.id}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to create project");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Create Project | UniVoid</title>
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 py-8">
          <div className="container-wide max-w-2xl">
            <Button 
              variant="ghost" 
              onClick={() => navigate(-1)}
              className="mb-6 gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>

            <Card>
              <CardHeader>
                <CardTitle>Create a New Project</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Project Title *</Label>
                    <Input
                      id="title"
                      placeholder="e.g., AI Attendance System for Smart India Hackathon"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe your project, goals, and what you're building..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Skills Needed</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="e.g., React, Python, UI Design"
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addSkill();
                          }
                        }}
                      />
                      <Button type="button" variant="outline" onClick={addSkill}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    {skills.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {skills.map((skill) => (
                          <Badge 
                            key={skill} 
                            variant="secondary"
                            className="gap-1 pr-1"
                          >
                            {skill}
                            <button
                              type="button"
                              onClick={() => removeSkill(skill)}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxMembers">Max Team Size</Label>
                    <Input
                      id="maxMembers"
                      type="number"
                      min={2}
                      max={20}
                      value={maxMembers}
                      onChange={(e) => setMaxMembers(parseInt(e.target.value) || 5)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Including yourself (2-20 members)
                    </p>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Project"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </>
  );
};

export default CreateProject;