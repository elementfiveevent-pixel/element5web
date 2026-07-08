import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, IndianRupee, Users, Ticket, UserPlus } from "lucide-react";
import type { TicketCategory, TicketCategorySelection, AttendeeInfo } from "@/services/ticketCategoryService";

interface TicketCategorySelectorProps {
  categories: TicketCategory[];
  selections: TicketCategorySelection[];
  onChange: (selections: TicketCategorySelection[]) => void;
  isPaidEvent: boolean;
  allowAudienceMembers?: boolean;
  artistFreeEntry?: boolean;
}

const TicketCategorySelector = ({ categories, selections, onChange, isPaidEvent, allowAudienceMembers = false, artistFreeEntry = false }: TicketCategorySelectorProps) => {
  const totalTickets = useMemo(
    () => selections.reduce((sum, s) => sum + s.quantity, 0),
    [selections]
  );

  const totalAudience = useMemo(
    () => selections.reduce((sum, s) => sum + (s.audienceCount || 0), 0),
    [selections]
  );

  const totalPrice = useMemo(
    () => selections.reduce((sum, s) => {
      if (artistFreeEntry && allowAudienceMembers) {
        return sum + s.category.price * (s.audienceCount || 0);
      }
      return sum + s.category.price * (s.quantity + (s.audienceCount || 0));
    }, 0),
    [selections, artistFreeEntry, allowAudienceMembers]
  );

  const updateQuantity = (categoryId: string, delta: number) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;

    const existing = selections.find(s => s.category.id === categoryId);
    const currentQty = existing?.quantity || 0;
    const newQty = Math.max(0, Math.min(category.max_per_user, currentQty + delta));

    if (newQty === 0) {
      onChange(selections.filter(s => s.category.id !== categoryId));
      return;
    }

    if (existing) {
      let attendees = [...existing.attendees];
      if (newQty > attendees.length) {
        for (let i = attendees.length; i < newQty; i++) {
          attendees.push({ name: "", email: "", mobile: "" });
        }
      } else {
        attendees = attendees.slice(0, newQty);
      }
      onChange(selections.map(s =>
        s.category.id === categoryId ? { ...s, quantity: newQty, attendees } : s
      ));
    } else {
      const attendees: AttendeeInfo[] = Array.from({ length: newQty }, () => ({
        name: "", email: "", mobile: "",
      }));
      onChange([...selections, { category, quantity: newQty, attendees, audienceCount: 0 }]);
    }
  };

  const updateAudienceCount = (categoryId: string, count: number) => {
    const safeCount = Math.max(0, Math.floor(count) || 0);
    onChange(selections.map(s =>
      s.category.id === categoryId ? { ...s, audienceCount: safeCount } : s
    ));
  };

  const updateAttendee = (categoryId: string, attendeeIndex: number, field: keyof AttendeeInfo, value: string) => {
    onChange(selections.map(s => {
      if (s.category.id !== categoryId) return s;
      const attendees = [...s.attendees];
      attendees[attendeeIndex] = { ...attendees[attendeeIndex], [field]: value };
      return { ...s, attendees };
    }));
  };

  /* ── Left column: ticket cards ── */
  const ticketSelectionSection = (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">1</div>
        <Label className="text-base font-semibold">Choose your ticket</Label>
      </div>
      <p className="text-xs text-muted-foreground ml-8">Tap + to select a ticket type</p>

      {categories.map(cat => {
        const selection = selections.find(s => s.category.id === cat.id);
        const qty = selection?.quantity || 0;

        return (
          <Card key={cat.id} className={`transition-all ${qty > 0 ? "border-primary ring-1 ring-primary/20" : "hover:border-muted-foreground/30"}`}>
            <CardContent className="p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Ticket className="w-4 h-4 text-primary flex-shrink-0" />
                    <p className="font-medium truncate text-sm">{cat.name}</p>
                  </div>
                  {cat.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 ml-6">{cat.description}</p>
                  )}
                  {isPaidEvent && (
                    <p className="text-sm font-bold mt-0.5 ml-6 flex items-center text-primary">
                      <IndianRupee className="w-3.5 h-3.5" />{cat.price}
                      {artistFreeEntry && allowAudienceMembers && (
                        <Badge variant="secondary" className="ml-2 text-[10px]">Your entry free</Badge>
                      )}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => updateQuantity(cat.id, -1)} disabled={qty === 0}>
                    <Minus className="w-3.5 h-3.5" />
                  </Button>
                  <span className="w-7 text-center font-bold text-base">{qty}</span>
                  <Button variant={qty === 0 ? "default" : "outline"} size="icon" className="h-8 w-8 rounded-full" onClick={() => updateQuantity(cat.id, 1)} disabled={qty >= cat.max_per_user}>
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Audience section inline with tickets on desktop */}
      {totalTickets > 0 && allowAudienceMembers && (
        <div className="space-y-2 pt-2">
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-primary" />
            <Label className="text-sm font-semibold">Bringing audience?</Label>
            <Badge variant="outline" className="text-[10px]">Optional</Badge>
          </div>
          {selections.filter(s => s.quantity >= 1).map(selection => {
            const audienceCount = selection.audienceCount || 0;
            return (
              <Card key={selection.category.id} className="bg-accent/20 border-dashed">
                <CardContent className="p-3 space-y-1.5">
                  <p className="text-xs font-medium flex items-center gap-1.5">
                    Audience for {selection.category.name}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => updateAudienceCount(selection.category.id, audienceCount - 1)} disabled={audienceCount <= 0}>
                      <Minus className="w-3.5 h-3.5" />
                    </Button>
                    <Input type="number" value={audienceCount} onChange={(e) => updateAudienceCount(selection.category.id, parseInt(e.target.value) || 0)} className="h-8 w-16 text-center font-bold" min={0} />
                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => updateAudienceCount(selection.category.id, audienceCount + 1)}>
                      <Plus className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  {isPaidEvent && audienceCount > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {audienceCount} × ₹{selection.category.price} = <span className="font-semibold text-foreground">₹{audienceCount * selection.category.price}</span>
                    </p>
                  )}
                  {isPaidEvent && artistFreeEntry && (
                    <p className="text-xs font-medium text-primary">✓ Your entry is free — only audience is charged</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Order Summary */}
      {totalTickets > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-3 space-y-1.5">
            <p className="text-sm font-semibold">Order Summary</p>
            <div className="flex justify-between text-sm">
              <span>{artistFreeEntry && allowAudienceMembers ? 'Your Ticket (Free)' : `Your Ticket${totalTickets > 1 ? 's' : ''}`}</span>
              <span className="font-medium">{totalTickets}</span>
            </div>
            {totalAudience > 0 && (
              <div className="flex justify-between text-sm">
                <span>Audience Members</span>
                <span className="font-medium">{totalAudience}</span>
              </div>
            )}
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Total People Entering</span>
              <span>{totalTickets + totalAudience}</span>
            </div>
            {isPaidEvent && (
              <div className="flex justify-between text-base font-bold pt-1.5 border-t border-border/50">
                <span>Amount to Pay</span>
                <span className="flex items-center text-primary">
                  {totalPrice === 0 ? 'Free' : <><IndianRupee className="w-4 h-4" />{totalPrice}</>}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );

  /* ── Right column: attendee details ── */
  const attendeeDetailsSection = totalTickets > 0 ? (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">2</div>
        <Label className="text-base font-semibold">Fill in your details</Label>
      </div>

      {selections.filter(s => s.quantity >= 1).map(selection => (
        <div key={selection.category.id} className="space-y-2">
          {selection.attendees.map((attendee, idx) => (
            <Card key={idx} className="border-dashed">
              <CardContent className="p-3 space-y-2">
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  {selection.quantity > 1 ? `Attendee ${idx + 1}` : "Your Details"} — {selection.category.name}
                </p>
                <Input placeholder="Full Name" value={attendee.name} onChange={(e) => updateAttendee(selection.category.id, idx, "name", e.target.value)} className="h-9" />
                <Input type="email" placeholder="Email Address" value={attendee.email} onChange={(e) => updateAttendee(selection.category.id, idx, "email", e.target.value)} className="h-9" />
                <Input type="tel" placeholder="Mobile Number" value={attendee.mobile} onChange={(e) => updateAttendee(selection.category.id, idx, "mobile", e.target.value)} className="h-9" />
              </CardContent>
            </Card>
          ))}
        </div>
      ))}
    </div>
  ) : null;

  return (
    <div className="space-y-4">
      {/* Desktop: two-column side-by-side layout */}
      <div className="hidden sm:grid sm:grid-cols-2 sm:gap-6">
        <div>{ticketSelectionSection}</div>
        <div>{attendeeDetailsSection || (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground border border-dashed rounded-xl p-6">
            Select a ticket to fill in details
          </div>
        )}</div>
      </div>

      {/* Mobile: stacked layout */}
      <div className="sm:hidden space-y-4">
        {ticketSelectionSection}
        {attendeeDetailsSection}
      </div>
    </div>
  );
};

export default TicketCategorySelector;
