import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, GripVertical, Ticket } from "lucide-react";
import type { DraftTicketCategory } from "@/services/ticketCategoryService";

interface TicketCategoryBuilderProps {
  categories: DraftTicketCategory[];
  onChange: (categories: DraftTicketCategory[]) => void;
  isPaidEvent: boolean;
}

const TicketCategoryBuilder = ({ categories, onChange, isPaidEvent }: TicketCategoryBuilderProps) => {
  const addCategory = () => {
    onChange([
      ...categories,
      {
        name: "",
        description: "",
        price: 0,
        max_per_user: 5,
        max_total: null,
      },
    ]);
  };

  const updateCategory = (index: number, field: keyof DraftTicketCategory, value: unknown) => {
    const updated = [...categories];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const removeCategory = (index: number) => {
    onChange(categories.filter((_, i) => i !== index));
  };

  if (!isPaidEvent && categories.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base">Ticket Categories</Label>
            <p className="text-sm text-muted-foreground">Define different ticket types (optional for free events)</p>
          </div>
          <Button variant="outline" size="sm" onClick={addCategory} className="gap-1.5">
            <Plus className="w-4 h-4" /> Add Category
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-base">Ticket Categories</Label>
          <p className="text-sm text-muted-foreground">
            {isPaidEvent
              ? "Define different ticket types with pricing (e.g., Participant, Audience, VIP)"
              : "Define different ticket types (optional)"}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={addCategory} className="gap-1.5">
          <Plus className="w-4 h-4" /> Add
        </Button>
      </div>

      {categories.length === 0 && isPaidEvent && (
        <Card className="border-dashed">
          <CardContent className="p-6 text-center">
            <Ticket className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-3">
              No ticket categories yet. Add categories to offer different ticket types with separate pricing.
            </p>
            <Button variant="outline" onClick={addCategory} className="gap-1.5">
              <Plus className="w-4 h-4" /> Add First Category
            </Button>
          </CardContent>
        </Card>
      )}

      {categories.map((cat, index) => (
        <Card key={index} className="relative">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Category {index + 1}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => removeCategory(index)} className="h-8 w-8 text-destructive">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Category Name *</Label>
                <Input
                  value={cat.name}
                  onChange={(e) => updateCategory(index, "name", e.target.value)}
                  placeholder="e.g., Participant, Audience, VIP"
                />
              </div>
              {isPaidEvent && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Price (₹) *</Label>
                  <Input
                    type="number"
                    value={cat.price}
                    onChange={(e) => updateCategory(index, "price", parseFloat(e.target.value) || 0)}
                    placeholder="299"
                    min={0}
                  />
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Description (optional)</Label>
              <Textarea
                value={cat.description}
                onChange={(e) => updateCategory(index, "description", e.target.value)}
                placeholder="What's included in this ticket?"
                rows={2}
                className="resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Max per person</Label>
                <Input
                  type="number"
                  value={cat.max_per_user}
                  onChange={(e) => updateCategory(index, "max_per_user", parseInt(e.target.value) || 1)}
                  min={1}
                  max={50}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Total available (optional)</Label>
                <Input
                  type="number"
                  value={cat.max_total ?? ""}
                  onChange={(e) => updateCategory(index, "max_total", e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="Unlimited"
                  min={1}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default TicketCategoryBuilder;
