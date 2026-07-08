import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Ticket, Plus, Trash2, Save, Loader2 } from "lucide-react";
import type { TicketCategory } from "@/services/ticketCategoryService";

interface TicketCategoriesManagerProps {
  eventId: string;
  isPaidEvent: boolean;
}

export function TicketCategoriesManager({ eventId, isPaidEvent }: TicketCategoriesManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["ticket-categories", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ticket_categories")
        .select("*")
        .eq("event_id", eventId)
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data as TicketCategory[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (cat: { name: string; description: string; price: number; max_per_user: number; max_total: number | null }) => {
      const { error } = await supabase.from("ticket_categories").insert({
        event_id: eventId,
        name: cat.name,
        description: cat.description || null,
        price: cat.price,
        max_per_user: cat.max_per_user,
        max_total: cat.max_total,
        display_order: categories.length,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket-categories", eventId] });
      toast({ title: "Category added" });
      setNewCat({ name: "", description: "", price: 0, max_per_user: 5, max_total: null });
      setShowAdd(false);
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ticket_categories")
        .update({ is_active: false })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket-categories", eventId] });
      toast({ title: "Category removed" });
    },
  });

  const [showAdd, setShowAdd] = useState(false);
  const [newCat, setNewCat] = useState({ name: "", description: "", price: 0, max_per_user: 5, max_total: null as number | null });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ticket className="w-5 h-5 text-primary" />
          Ticket Categories
        </CardTitle>
        <CardDescription>Define different ticket types with separate pricing</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading...
          </div>
        ) : categories.length === 0 ? (
          <p className="text-sm text-muted-foreground">No ticket categories defined. All registrations use the standard event price.</p>
        ) : (
          <div className="space-y-2">
            {categories.map(cat => (
              <div key={cat.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium text-sm">{cat.name}</p>
                  {cat.description && <p className="text-xs text-muted-foreground">{cat.description}</p>}
                  <p className="text-xs text-muted-foreground">
                    {isPaidEvent ? `₹${cat.price}` : "Free"} • Max {cat.max_per_user}/person
                    {cat.max_total && ` • ${cat.max_total} total`}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => deleteMutation.mutate(cat.id)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {showAdd ? (
          <div className="p-4 border rounded-lg space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Name *</Label>
                <Input value={newCat.name} onChange={e => setNewCat(p => ({ ...p, name: e.target.value }))} placeholder="e.g., VIP" />
              </div>
              {isPaidEvent && (
                <div className="space-y-1">
                  <Label className="text-xs">Price (₹)</Label>
                  <Input type="number" value={newCat.price} onChange={e => setNewCat(p => ({ ...p, price: parseFloat(e.target.value) || 0 }))} />
                </div>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Description</Label>
              <Textarea value={newCat.description} onChange={e => setNewCat(p => ({ ...p, description: e.target.value }))} rows={2} className="resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Max per person</Label>
                <Input type="number" value={newCat.max_per_user} onChange={e => setNewCat(p => ({ ...p, max_per_user: parseInt(e.target.value) || 1 }))} min={1} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Total available</Label>
                <Input type="number" value={newCat.max_total ?? ""} onChange={e => setNewCat(p => ({ ...p, max_total: e.target.value ? parseInt(e.target.value) : null }))} placeholder="Unlimited" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => addMutation.mutate(newCat)} disabled={!newCat.name || addMutation.isPending} className="gap-1">
                <Save className="w-3 h-3" /> Save
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setShowAdd(true)} className="gap-1.5">
            <Plus className="w-4 h-4" /> Add Category
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
