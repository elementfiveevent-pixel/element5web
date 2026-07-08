import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, Trash2, Edit2, Users, Gift, Tag, IndianRupee, 
  Sparkles, Save, Type
} from "lucide-react";
import type { EventUpsell } from "@/services/upsellService";

// Draft upsell for creating events before they exist
export interface DraftUpsell {
  id: string;
  upsell_type: 'group_offer' | 'addon' | 'custom_addon';
  name: string;
  description: string | null;
  price: number;
  discount_amount: number;
  min_quantity: number;
  max_quantity: number;
  group_size: number | null;
  is_active: boolean;
  display_order: number;
  allow_custom_input: boolean;
  custom_input_label: string | null;
  custom_input_placeholder: string | null;
  custom_input_max_length: number;
}

interface UpsellConfigSectionProps {
  upsells: DraftUpsell[];
  onChange: (upsells: DraftUpsell[]) => void;
  upsellEnabled: boolean;
  onUpsellEnabledChange: (enabled: boolean) => void;
  isPaidEvent: boolean;
}

// Default form values
const getDefaultFormData = () => ({
  name: "",
  description: "",
  upsell_type: "addon" as DraftUpsell["upsell_type"],
  price: 0,
  discount_amount: 0,
  min_quantity: 1,
  max_quantity: 10,
  group_size: 5,
  is_active: true,
  allow_custom_input: false,
  custom_input_label: "",
  custom_input_placeholder: "",
  custom_input_max_length: 200,
});

export function UpsellConfigSection({
  upsells,
  onChange,
  upsellEnabled,
  onUpsellEnabledChange,
  isPaidEvent,
}: UpsellConfigSectionProps) {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUpsell, setEditingUpsell] = useState<DraftUpsell | null>(null);
  
  // Use refs for inputs to prevent re-renders and keyboard closing
  const nameRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);
  const discountRef = useRef<HTMLInputElement>(null);
  const groupSizeRef = useRef<HTMLInputElement>(null);
  const minQtyRef = useRef<HTMLInputElement>(null);
  const maxQtyRef = useRef<HTMLInputElement>(null);
  const customLabelRef = useRef<HTMLInputElement>(null);
  const customPlaceholderRef = useRef<HTMLInputElement>(null);
  const customMaxLenRef = useRef<HTMLInputElement>(null);
  
  // Only these need state for conditional rendering
  const [upsellType, setUpsellType] = useState<DraftUpsell["upsell_type"]>("addon");
  const [isActive, setIsActive] = useState(true);
  const [allowCustomInput, setAllowCustomInput] = useState(false);

  const resetForm = useCallback(() => {
    if (nameRef.current) nameRef.current.value = "";
    if (descRef.current) descRef.current.value = "";
    if (priceRef.current) priceRef.current.value = "0";
    if (discountRef.current) discountRef.current.value = "0";
    if (groupSizeRef.current) groupSizeRef.current.value = "5";
    if (minQtyRef.current) minQtyRef.current.value = "1";
    if (maxQtyRef.current) maxQtyRef.current.value = "10";
    if (customLabelRef.current) customLabelRef.current.value = "";
    if (customPlaceholderRef.current) customPlaceholderRef.current.value = "";
    if (customMaxLenRef.current) customMaxLenRef.current.value = "200";
    setUpsellType("addon");
    setIsActive(true);
    setAllowCustomInput(false);
  }, []);

  const openEdit = useCallback((upsell: DraftUpsell) => {
    setEditingUpsell(upsell);
    setUpsellType(upsell.upsell_type);
    setIsActive(upsell.is_active);
    setAllowCustomInput(upsell.allow_custom_input || false);
    
    // Set values after dialog opens (setTimeout to ensure refs are available)
    setTimeout(() => {
      if (nameRef.current) nameRef.current.value = upsell.name;
      if (descRef.current) descRef.current.value = upsell.description || "";
      if (priceRef.current) priceRef.current.value = String(upsell.price);
      if (discountRef.current) discountRef.current.value = String(upsell.discount_amount);
      if (groupSizeRef.current) groupSizeRef.current.value = String(upsell.group_size || 5);
      if (minQtyRef.current) minQtyRef.current.value = String(upsell.min_quantity);
      if (maxQtyRef.current) maxQtyRef.current.value = String(upsell.max_quantity);
      if (customLabelRef.current) customLabelRef.current.value = upsell.custom_input_label || "";
      if (customPlaceholderRef.current) customPlaceholderRef.current.value = upsell.custom_input_placeholder || "";
      if (customMaxLenRef.current) customMaxLenRef.current.value = String(upsell.custom_input_max_length || 200);
    }, 0);
  }, []);

  const handleSubmit = useCallback(() => {
    const name = nameRef.current?.value || "";
    const description = descRef.current?.value || "";
    const price = parseFloat(priceRef.current?.value || "0") || 0;
    const discount_amount = parseFloat(discountRef.current?.value || "0") || 0;
    const group_size = parseInt(groupSizeRef.current?.value || "5") || 5;
    const min_quantity = parseInt(minQtyRef.current?.value || "1") || 1;
    const max_quantity = parseInt(maxQtyRef.current?.value || "10") || 10;
    const custom_input_label = customLabelRef.current?.value || "";
    const custom_input_placeholder = customPlaceholderRef.current?.value || "";
    const custom_input_max_length = parseInt(customMaxLenRef.current?.value || "200") || 200;

    if (!name) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }

    if (upsellType === "group_offer" && group_size < 2) {
      toast({ title: "Group size must be at least 2", variant: "destructive" });
      return;
    }

    const newUpsell: DraftUpsell = {
      id: editingUpsell?.id || `draft-${Date.now()}`,
      upsell_type: upsellType,
      name,
      description: description || null,
      price,
      discount_amount,
      min_quantity,
      max_quantity,
      group_size: upsellType === "group_offer" ? group_size : null,
      is_active: isActive,
      display_order: editingUpsell?.display_order || upsells.length,
      allow_custom_input: allowCustomInput,
      custom_input_label: allowCustomInput ? custom_input_label || null : null,
      custom_input_placeholder: allowCustomInput ? custom_input_placeholder || null : null,
      custom_input_max_length,
    };

    if (editingUpsell) {
      onChange(upsells.map(u => u.id === editingUpsell.id ? newUpsell : u));
      toast({ title: "Upsell Updated" });
    } else {
      onChange([...upsells, newUpsell]);
      toast({ title: "Upsell Created" });
    }

    setIsCreateOpen(false);
    setEditingUpsell(null);
    resetForm();
  }, [upsellType, isActive, allowCustomInput, editingUpsell, upsells, onChange, toast, resetForm]);

  const handleDelete = (id: string) => {
    onChange(upsells.filter(u => u.id !== id));
    toast({ title: "Upsell Deleted" });
  };

  const groupOffers = upsells.filter(u => u.upsell_type === "group_offer");
  const addons = upsells.filter(u => u.upsell_type === "addon" || u.upsell_type === "custom_addon");

  const UpsellForm = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Type *</Label>
        <Select 
          value={upsellType} 
          onValueChange={(v) => setUpsellType(v as DraftUpsell["upsell_type"])}
          disabled={!!editingUpsell}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="group_offer">Group Offer</SelectItem>
            <SelectItem value="addon">Add-on</SelectItem>
            <SelectItem value="custom_addon">Custom Add-on</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Name *</Label>
        <Input 
          ref={nameRef}
          defaultValue=""
          placeholder={upsellType === "group_offer" ? "e.g., Group of 5 Discount" : "e.g., Snacks Combo"}
        />
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea 
          ref={descRef}
          defaultValue=""
          placeholder="Optional description"
          rows={2}
        />
      </div>

      {upsellType === "group_offer" ? (
        <>
          <div className="space-y-2">
            <Label>Minimum Group Size *</Label>
            <Input 
              ref={groupSizeRef}
              type="number"
              min={2}
              defaultValue={5}
            />
            <p className="text-xs text-muted-foreground">Users must book at least this many tickets</p>
          </div>
          <div className="space-y-2">
            <Label>Discount Amount (₹) *</Label>
            <Input 
              ref={discountRef}
              type="number"
              min={0}
              defaultValue={0}
            />
          </div>
        </>
      ) : (
        <>
          <div className="space-y-2">
            <Label>Price (₹) *</Label>
            <Input 
              ref={priceRef}
              type="number"
              min={0}
              defaultValue={0}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Min Quantity</Label>
              <Input 
                ref={minQtyRef}
                type="number"
                min={1}
                defaultValue={1}
              />
            </div>
            <div className="space-y-2">
              <Label>Max Quantity</Label>
              <Input 
                ref={maxQtyRef}
                type="number"
                min={1}
                defaultValue={10}
              />
            </div>
          </div>

          {/* Custom Input Section for Add-ons */}
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Type className="w-4 h-4 text-muted-foreground" />
                <Label className="text-sm font-medium">Allow User Input</Label>
              </div>
              <Switch 
                checked={allowCustomInput}
                onCheckedChange={setAllowCustomInput}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Enable this to let users enter custom text (e.g., names, preferences)
            </p>

            {allowCustomInput && (
              <div className="space-y-3 pt-2">
                <div className="space-y-2">
                  <Label className="text-xs">Input Label</Label>
                  <Input 
                    ref={customLabelRef}
                    defaultValue=""
                    placeholder="e.g., Enter participant names"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Placeholder Text</Label>
                  <Input 
                    ref={customPlaceholderRef}
                    defaultValue=""
                    placeholder="e.g., John, Jane, Mike..."
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Max Character Limit</Label>
                  <Input 
                    ref={customMaxLenRef}
                    type="number"
                    min={10}
                    max={1000}
                    defaultValue={200}
                  />
                </div>
              </div>
            )}
          </div>
        </>
      )}

      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
        <Label>Active</Label>
        <Switch 
          checked={isActive}
          onCheckedChange={setIsActive}
        />
      </div>

      <Button onClick={handleSubmit} className="w-full gap-2">
        <Save className="w-4 h-4" />
        {editingUpsell ? "Update" : "Create"} Upsell
      </Button>
    </div>
  );

  if (!isPaidEvent) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">Upsells for Paid Events Only</h3>
          <p className="text-muted-foreground">
            Enable paid ticketing to add upsells and group offers.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Master Toggle */}
      <Card className="border-primary/30">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Enable Upsells</h3>
                <p className="text-sm text-muted-foreground">
                  Show upsell screen during booking
                </p>
              </div>
            </div>
            <Switch 
              checked={upsellEnabled}
              onCheckedChange={onUpsellEnabledChange}
            />
          </div>
        </CardContent>
      </Card>

      {/* Upsells Management */}
      <Tabs defaultValue="group_offers">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="group_offers" className="gap-1.5">
              <Users className="w-4 h-4" /> Group Offers
            </TabsTrigger>
            <TabsTrigger value="addons" className="gap-1.5">
              <Gift className="w-4 h-4" /> Add-ons
            </TabsTrigger>
          </TabsList>

          <Dialog open={isCreateOpen || !!editingUpsell} onOpenChange={(open) => {
            if (!open) {
              setIsCreateOpen(false);
              setEditingUpsell(null);
              resetForm();
            } else {
              setIsCreateOpen(true);
            }
          }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5">
                <Plus className="w-4 h-4" /> Add
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingUpsell ? "Edit Upsell" : "Create Upsell"}
                </DialogTitle>
              </DialogHeader>
              <UpsellForm />
            </DialogContent>
          </Dialog>
        </div>

        <TabsContent value="group_offers" className="space-y-3">
          {groupOffers.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No group offers yet</p>
                <p className="text-sm text-muted-foreground">Create offers to reward group bookings</p>
              </CardContent>
            </Card>
          ) : (
            groupOffers.map(offer => (
              <Card key={offer.id} className={!offer.is_active ? "opacity-60" : ""}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Tag className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{offer.name}</h4>
                          {!offer.is_active && <Badge variant="secondary">Inactive</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Min {offer.group_size} tickets → ₹{offer.discount_amount} OFF
                        </p>
                        {offer.description && (
                          <p className="text-sm text-muted-foreground mt-1">{offer.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(offer)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(offer.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="addons" className="space-y-3">
          {addons.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Gift className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No add-ons yet</p>
                <p className="text-sm text-muted-foreground">Create add-ons like snacks, merch, etc.</p>
              </CardContent>
            </Card>
          ) : (
            addons.map(addon => (
              <Card key={addon.id} className={!addon.is_active ? "opacity-60" : ""}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                        <Gift className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold">{addon.name}</h4>
                          {!addon.is_active && <Badge variant="secondary">Inactive</Badge>}
                          <Badge variant="outline" className="text-xs">
                            {addon.upsell_type === "custom_addon" ? "Custom" : "Add-on"}
                          </Badge>
                          {addon.allow_custom_input && (
                            <Badge variant="outline" className="text-xs gap-1">
                              <Type className="w-3 h-3" /> Text Input
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <IndianRupee className="w-3 h-3" />{addon.price}
                          {addon.max_quantity > 1 && ` (max ${addon.max_quantity})`}
                        </p>
                        {addon.description && (
                          <p className="text-sm text-muted-foreground mt-1">{addon.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(addon)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(addon.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default UpsellConfigSection;
