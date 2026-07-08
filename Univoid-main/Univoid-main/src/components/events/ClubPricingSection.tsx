import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Trash2, Users, IndianRupee, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { fetchClubs, createClub, type Club } from "@/services/clubService";
import { useToast } from "@/hooks/use-toast";

export interface EventClubConfig {
  tempId: string;
  clubId: string;
  clubName: string;
  memberPrice: number;
  memberBenefits: string;
}

interface ClubPricingSectionProps {
  clubs: EventClubConfig[];
  standardPrice: number;
  onChange: (clubs: EventClubConfig[]) => void;
}

const ClubPricingSection = ({ clubs, standardPrice, onChange }: ClubPricingSectionProps) => {
  const { toast } = useToast();
  const [isAddingClub, setIsAddingClub] = useState(false);
  const [isCreatingClub, setIsCreatingClub] = useState(false);
  const [selectedClubId, setSelectedClubId] = useState("");
  const [memberPrice, setMemberPrice] = useState("");
  const [memberBenefits, setMemberBenefits] = useState("");
  
  // New club form state
  const [newClubName, setNewClubName] = useState("");
  const [newClubShortName, setNewClubShortName] = useState("");

  const { data: existingClubs, refetch: refetchClubs } = useQuery({
    queryKey: ["clubs"],
    queryFn: fetchClubs,
    staleTime: 5 * 60 * 1000,
  });

  const handleAddClub = () => {
    if (!selectedClubId) return;
    
    const club = existingClubs?.find(c => c.id === selectedClubId);
    if (!club) return;

    // Check if already added
    if (clubs.some(c => c.clubId === selectedClubId)) {
      toast({ title: "Club already added", variant: "destructive" });
      return;
    }

    const newConfig: EventClubConfig = {
      tempId: `temp_${Date.now()}`,
      clubId: selectedClubId,
      clubName: club.name,
      memberPrice: parseFloat(memberPrice) || 0,
      memberBenefits: memberBenefits,
    };

    onChange([...clubs, newConfig]);
    setSelectedClubId("");
    setMemberPrice("");
    setMemberBenefits("");
    setIsAddingClub(false);
  };

  const handleRemoveClub = (tempId: string) => {
    onChange(clubs.filter(c => c.tempId !== tempId));
  };

  const handleUpdateClub = (tempId: string, updates: Partial<EventClubConfig>) => {
    onChange(clubs.map(c => c.tempId === tempId ? { ...c, ...updates } : c));
  };

  const handleCreateNewClub = async () => {
    if (!newClubName.trim()) return;

    try {
      const newClub = await createClub({
        name: newClubName.trim(),
        short_name: newClubShortName.trim() || undefined,
      });
      
      await refetchClubs();
      setNewClubName("");
      setNewClubShortName("");
      setIsCreatingClub(false);
      setSelectedClubId(newClub.id);
      toast({ title: "Club created successfully" });
    } catch (error) {
      toast({ title: "Failed to create club", variant: "destructive" });
    }
  };

  const availableClubs = existingClubs?.filter(
    c => !clubs.some(ec => ec.clubId === c.id)
  ) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Club Member Pricing
        </CardTitle>
        <CardDescription>
          Add special pricing for members of clubs/organizations. 
          Members will get discounted rates when they register.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Standard price reference */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <span className="text-sm text-muted-foreground">Standard Price (Non-members)</span>
          <span className="font-medium flex items-center">
            <IndianRupee className="w-4 h-4" />{standardPrice}
          </span>
        </div>

        {/* Added clubs */}
        {clubs.length > 0 && (
          <div className="space-y-3">
            {clubs.map((club) => (
              <div key={club.tempId} className="p-4 border rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      <Users className="w-3 h-3 mr-1" />
                      {club.clubName}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveClub(club.tempId)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Member Price (₹)</Label>
                    <Input
                      type="number"
                      value={club.memberPrice}
                      onChange={(e) => handleUpdateClub(club.tempId, { 
                        memberPrice: parseFloat(e.target.value) || 0 
                      })}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Savings</Label>
                    <div className="h-10 flex items-center text-green-600 font-medium">
                      {standardPrice - club.memberPrice > 0 
                        ? `₹${standardPrice - club.memberPrice} off`
                        : "No discount"}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Member Benefits (optional)</Label>
                  <Textarea
                    value={club.memberBenefits}
                    onChange={(e) => handleUpdateClub(club.tempId, { 
                      memberBenefits: e.target.value 
                    })}
                    placeholder="e.g., Priority seating, exclusive swag..."
                    rows={2}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add club button */}
        {!isAddingClub ? (
          <Button
            variant="outline"
            onClick={() => setIsAddingClub(true)}
            className="w-full gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Club/Organization
          </Button>
        ) : (
          <div className="p-4 border rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <Label>Select Club</Label>
              <Dialog open={isCreatingClub} onOpenChange={setIsCreatingClub}>
                <DialogTrigger asChild>
                  <Button variant="link" size="sm" className="p-0 h-auto">
                    + Create New Club
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Club</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Club Name *</Label>
                      <Input
                        value={newClubName}
                        onChange={(e) => setNewClubName(e.target.value)}
                        placeholder="e.g., IEEE Student Chapter"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Short Name (optional)</Label>
                      <Input
                        value={newClubShortName}
                        onChange={(e) => setNewClubShortName(e.target.value)}
                        placeholder="e.g., IEEE"
                      />
                    </div>
                    <Button
                      onClick={handleCreateNewClub}
                      disabled={!newClubName.trim()}
                      className="w-full"
                    >
                      Create Club
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Select value={selectedClubId} onValueChange={setSelectedClubId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a club/organization" />
              </SelectTrigger>
              <SelectContent>
                {availableClubs.map((club) => (
                  <SelectItem key={club.id} value={club.id}>
                    {club.name} {club.short_name && `(${club.short_name})`}
                  </SelectItem>
                ))}
                {availableClubs.length === 0 && (
                  <div className="p-2 text-sm text-muted-foreground text-center">
                    No clubs available. Create one first.
                  </div>
                )}
              </SelectContent>
            </Select>

            <div className="space-y-2">
              <Label>Member Price (₹)</Label>
              <Input
                type="number"
                value={memberPrice}
                onChange={(e) => setMemberPrice(e.target.value)}
                placeholder="Discounted price for members"
              />
            </div>

            <div className="space-y-2">
              <Label>Member Benefits (optional)</Label>
              <Textarea
                value={memberBenefits}
                onChange={(e) => setMemberBenefits(e.target.value)}
                placeholder="Additional benefits for club members..."
                rows={2}
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddingClub(false);
                  setSelectedClubId("");
                  setMemberPrice("");
                  setMemberBenefits("");
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddClub}
                disabled={!selectedClubId}
                className="flex-1"
              >
                Add Club
              </Button>
            </div>
          </div>
        )}

        {clubs.length === 0 && !isAddingClub && (
          <p className="text-xs text-muted-foreground text-center">
            No clubs added. All registrants will pay the standard price.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ClubPricingSection;
