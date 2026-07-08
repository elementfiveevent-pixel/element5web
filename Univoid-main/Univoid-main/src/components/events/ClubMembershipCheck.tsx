import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, Check, IndianRupee, Tag, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchEventClubs, claimClubMembership, getUserClubMembership, type EventClub } from "@/services/clubService";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface ClubMembershipCheckProps {
  eventId: string;
  standardPrice: number;
  onPriceChange: (price: number, selectedClubId: string | null, membershipId: string | null) => void;
}

const ClubMembershipCheck = ({ eventId, standardPrice, onPriceChange }: ClubMembershipCheckProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedOption, setSelectedOption] = useState<"standard" | string>("standard");
  const [membershipId, setMembershipId] = useState("");
  const [isClaimingMembership, setIsClaimingMembership] = useState(false);
  const [membershipClaimed, setMembershipClaimed] = useState<Record<string, boolean>>({});

  const { data: eventClubs, isLoading } = useQuery({
    queryKey: ["event-clubs", eventId],
    queryFn: () => fetchEventClubs(eventId),
    staleTime: 5 * 60 * 1000,
  });

  // Check existing memberships
  useEffect(() => {
    const checkMemberships = async () => {
      if (!user || !eventClubs) return;

      const claimed: Record<string, boolean> = {};
      for (const ec of eventClubs) {
        const membership = await getUserClubMembership(ec.club_id, user.id);
        if (membership) {
          claimed[ec.club_id] = true;
        }
      }
      setMembershipClaimed(claimed);
    };

    checkMemberships();
  }, [user, eventClubs]);

  // Update price when selection changes
  useEffect(() => {
    if (selectedOption === "standard") {
      onPriceChange(standardPrice, null, null);
    } else {
      const selectedClub = eventClubs?.find(ec => ec.club_id === selectedOption);
      if (selectedClub) {
        onPriceChange(selectedClub.member_price, selectedClub.club_id, membershipId || null);
      }
    }
  }, [selectedOption, membershipId, standardPrice, eventClubs, onPriceChange]);

  const handleClaimMembership = async (clubId: string) => {
    if (!user) return;
    
    setIsClaimingMembership(true);
    try {
      await claimClubMembership(clubId, membershipId || undefined);
      setMembershipClaimed(prev => ({ ...prev, [clubId]: true }));
      toast({ title: "Membership claimed", description: "You can now register at member price" });
    } catch (error: any) {
      if (error.message?.includes('duplicate')) {
        setMembershipClaimed(prev => ({ ...prev, [clubId]: true }));
      } else {
        toast({ title: "Failed to claim membership", variant: "destructive" });
      }
    } finally {
      setIsClaimingMembership(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  // No clubs associated with this event
  if (!eventClubs || eventClubs.length === 0) {
    return null;
  }

  // Show the selected club discount prominently at the top
  const selectedClub = eventClubs?.find(ec => ec.club_id === selectedOption);
  const appliedDiscount = selectedClub ? standardPrice - selectedClub.member_price : 0;

  return (
    <div className="space-y-4">
      {/* Discount Applied Banner - Shows when club member pricing is selected */}
      {selectedOption !== "standard" && selectedClub && appliedDiscount > 0 && (
        <div className="bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 text-green-800 dark:text-green-200 p-4 rounded-xl">
          <div className="flex items-center gap-2 font-semibold">
            <Check className="w-5 h-5" />
            <span>Club Member Discount Applied!</span>
          </div>
          <p className="text-sm mt-1">
            You save ₹{appliedDiscount} as a {selectedClub.club?.name || "Club"} member
          </p>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Tag className="w-4 h-4 text-primary" />
        <Label className="font-medium">Select Pricing Option</Label>
      </div>

      <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
        {/* Standard pricing option */}
        <Card className={`cursor-pointer transition-all ${
          selectedOption === "standard" ? "ring-2 ring-primary" : "hover:border-primary/50"
        }`}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <RadioGroupItem value="standard" id="standard" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="standard" className="cursor-pointer font-medium">
                  Standard Registration
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Regular registration for all attendees
                </p>
              </div>
              <div className="text-right">
                <span className="text-xl font-bold flex items-center">
                  <IndianRupee className="w-4 h-4" />
                  {standardPrice}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Club member options */}
        {eventClubs.map((ec) => {
          const savings = standardPrice - ec.member_price;
          const isClaimed = membershipClaimed[ec.club_id];
          const isSelected = selectedOption === ec.club_id;
          
          return (
            <Card 
              key={ec.id} 
              className={`cursor-pointer transition-all ${
                isSelected ? "ring-2 ring-primary bg-primary/5" : "hover:border-primary/50"
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <RadioGroupItem value={ec.club_id} id={ec.club_id} className="mt-1" />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Label htmlFor={ec.club_id} className="cursor-pointer font-medium">
                        {ec.club?.name || "Club"} Member
                      </Label>
                      {savings > 0 && (
                        <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                          Save ₹{savings}
                        </Badge>
                      )}
                      {isClaimed && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                          ✓ Verified
                        </Badge>
                      )}
                    </div>
                    {ec.member_benefits && (
                      <p className="text-sm text-muted-foreground">{ec.member_benefits}</p>
                    )}
                    
                    {/* Not a member? Become one - Upsell section */}
                    {isSelected && !isClaimed && (
                      <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg space-y-3">
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                          🎉 Become a {ec.club?.name || "Club"} member and save ₹{savings}!
                        </p>
                        <div className="space-y-2">
                          <Label className="text-sm">Membership ID (optional)</Label>
                          <Input
                            value={membershipId}
                            onChange={(e) => setMembershipId(e.target.value)}
                            placeholder="Enter your membership ID"
                            className="bg-background"
                          />
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleClaimMembership(ec.club_id)}
                          disabled={isClaimingMembership}
                          className="w-full"
                        >
                          {isClaimingMembership ? "Verifying..." : "Claim Membership & Get Discount"}
                        </Button>
                        <p className="text-xs text-muted-foreground">
                          Your membership may be verified by the organizer
                        </p>
                      </div>
                    )}
                    
                    {/* Membership verified */}
                    {isSelected && isClaimed && (
                      <div className="flex items-center gap-2 text-sm text-green-600 mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded">
                        <Check className="w-4 h-4" />
                        <span>Membership verified - discount will be applied at checkout</span>
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold flex items-center text-green-600">
                      <IndianRupee className="w-4 h-4" />
                      {ec.member_price}
                    </span>
                    {savings > 0 && (
                      <span className="text-sm text-muted-foreground line-through flex items-center justify-end">
                        <IndianRupee className="w-3 h-3" />{standardPrice}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </RadioGroup>
    </div>
  );
};

export default ClubMembershipCheck;
