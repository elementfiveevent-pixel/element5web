import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { 
  Users, Gift, ShoppingBag, IndianRupee, Minus, Plus, 
  ChevronRight, Tag, Sparkles
} from "lucide-react";
import { 
  type EventUpsell, 
  type SelectedUpsell, 
  calculateTotalWithUpsells 
} from "@/services/upsellService";

interface UpsellScreenProps {
  upsells: EventUpsell[];
  basePrice: number;
  groupSize: number;
  onGroupSizeChange: (size: number) => void;
  selectedUpsells: SelectedUpsell[];
  onUpsellsChange: (upsells: SelectedUpsell[]) => void;
  onContinue: () => void;
  onSkip: () => void;
}

const UpsellScreen = ({
  upsells,
  basePrice,
  groupSize,
  onGroupSizeChange,
  selectedUpsells,
  onUpsellsChange,
  onContinue,
  onSkip,
}: UpsellScreenProps) => {
  const groupOffers = useMemo(() => 
    upsells.filter(u => u.upsell_type === 'group_offer').sort((a, b) => (a.group_size || 0) - (b.group_size || 0)),
    [upsells]
  );
  
  const addons = useMemo(() => 
    upsells.filter(u => u.upsell_type === 'addon' || u.upsell_type === 'custom_addon'),
    [upsells]
  );

  const totals = useMemo(() => 
    calculateTotalWithUpsells(basePrice, groupSize, selectedUpsells, groupOffers),
    [basePrice, groupSize, selectedUpsells, groupOffers]
  );

  const handleAddonToggle = (upsell: EventUpsell, checked: boolean) => {
    if (checked) {
      onUpsellsChange([
        ...selectedUpsells,
        { upsell, quantity: 1, totalPrice: upsell.price }
      ]);
    } else {
      onUpsellsChange(selectedUpsells.filter(s => s.upsell.id !== upsell.id));
    }
  };

  const handleQuantityChange = (upsellId: string, delta: number) => {
    onUpsellsChange(
      selectedUpsells.map(item => {
        if (item.upsell.id === upsellId) {
          const newQty = Math.max(
            item.upsell.min_quantity,
            Math.min(item.upsell.max_quantity, item.quantity + delta)
          );
          return { ...item, quantity: newQty, totalPrice: newQty * item.upsell.price };
        }
        return item;
      })
    );
  };

  const isSelected = (upsellId: string) => 
    selectedUpsells.some(s => s.upsell.id === upsellId);

  const getQuantity = (upsellId: string) => 
    selectedUpsells.find(s => s.upsell.id === upsellId)?.quantity || 0;

  return (
    <div className="space-y-6">
      {/* Group Entry Warning */}
      {groupSize > 1 && (
        <div className="bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200 p-4 rounded-lg">
          <p className="font-semibold text-sm">⚠️ Important: Group Entry Rule</p>
          <p className="text-sm mt-1">
            Group entry is allowed only when the full group arrives together. Partial entry will not be permitted.
          </p>
        </div>
      )}

      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">Enhance Your Experience</h2>
        </div>
        <p className="text-muted-foreground text-sm">
          Add extras to make your event unforgettable
        </p>
      </div>

      {/* Group Size Selector */}
      {groupOffers.length > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="w-5 h-5 text-primary" />
              Group Booking
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Number of Tickets</span>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onGroupSizeChange(Math.max(1, groupSize - 1))}
                  disabled={groupSize <= 1}
                  className="h-8 w-8"
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="text-xl font-bold w-8 text-center">{groupSize}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onGroupSizeChange(groupSize + 1)}
                  className="h-8 w-8"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Group offer badges */}
            <div className="flex flex-wrap gap-2">
              {groupOffers.map(offer => (
                <Badge 
                  key={offer.id}
                  variant={groupSize >= (offer.group_size || 0) ? "default" : "outline"}
                  className="gap-1"
                >
                  <Tag className="w-3 h-3" />
                  {offer.name} ({offer.group_size}+) - ₹{offer.discount_amount} OFF
                </Badge>
              ))}
            </div>

            {totals.discounts > 0 && (
              <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 p-3 rounded-lg text-center">
                <span className="font-semibold">🎉 You save ₹{totals.discounts}!</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add-ons */}
      {addons.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShoppingBag className="w-5 h-5 text-primary" />
              Add-ons & Extras
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {addons.map(addon => {
              const selected = isSelected(addon.id);
              const quantity = getQuantity(addon.id);

              return (
                <div
                  key={addon.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                    selected ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50"
                  }`}
                >
                  <Checkbox
                    checked={selected}
                    onCheckedChange={(checked) => handleAddonToggle(addon, checked === true)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{addon.name}</p>
                        {addon.description && (
                          <p className="text-sm text-muted-foreground">{addon.description}</p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-semibold flex items-center gap-1">
                          <IndianRupee className="w-4 h-4" />
                          {addon.price}
                        </p>
                        {addon.max_quantity > 1 && (
                          <p className="text-xs text-muted-foreground">each</p>
                        )}
                      </div>
                    </div>

                    {/* Quantity selector for multi-quantity addons */}
                    {selected && addon.max_quantity > 1 && (
                      <div className="flex items-center justify-between mt-3 pt-3 border-t">
                        <span className="text-sm text-muted-foreground">Quantity</span>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleQuantityChange(addon.id, -1)}
                            disabled={quantity <= addon.min_quantity}
                            className="h-7 w-7"
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="font-medium w-6 text-center">{quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleQuantityChange(addon.id, 1)}
                            disabled={quantity >= addon.max_quantity}
                            className="h-7 w-7"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Price Summary */}
      <Card className="bg-muted/50">
        <CardContent className="py-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Base ({groupSize} × ₹{basePrice})</span>
            <span>₹{totals.baseTotal}</span>
          </div>
          {totals.discounts > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Group Discount</span>
              <span>-₹{totals.discounts}</span>
            </div>
          )}
          {totals.addonsTotal > 0 && (
            <div className="flex justify-between text-sm">
              <span>Add-ons</span>
              <span>+₹{totals.addonsTotal}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg pt-2 border-t">
            <span>Total</span>
            <span className="flex items-center gap-1">
              <IndianRupee className="w-5 h-5" />
              {totals.finalTotal}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <Button onClick={onContinue} className="w-full gap-2">
          Continue to Payment
          <ChevronRight className="w-4 h-4" />
        </Button>
        <Button variant="ghost" onClick={onSkip} className="text-muted-foreground">
          Skip Extras
        </Button>
      </div>
    </div>
  );
};

export default UpsellScreen;
