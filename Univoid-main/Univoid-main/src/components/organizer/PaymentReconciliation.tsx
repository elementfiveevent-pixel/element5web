import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IndianRupee, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";

interface PaymentReconciliationProps {
  eventId: string;
}

interface ReconciliationData {
  totalExpected: number;
  totalReceived: number;
  totalPending: number;
  totalRejected: number;
  baseExpected: number;
  addonsExpected: number;
  approvedCount: number;
  pendingCount: number;
  rejectedCount: number;
  totalRegistrations: number;
  categoryBreakdown: { name: string; count: number; revenue: number }[];
}

export function PaymentReconciliation({ eventId }: PaymentReconciliationProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["payment-reconciliation", eventId],
    queryFn: async (): Promise<ReconciliationData> => {
      const { data: registrations, error } = await supabase
        .from("event_registrations")
        .select("payment_status, base_amount, addons_amount, total_amount, custom_data")
        .eq("event_id", eventId);

      if (error) throw error;

      const regs = registrations || [];
      const approved = regs.filter(r => r.payment_status === "approved");
      const pending = regs.filter(r => r.payment_status === "pending");
      const rejected = regs.filter(r => r.payment_status === "rejected");

      const sum = (arr: typeof regs, field: "total_amount" | "base_amount" | "addons_amount") =>
        arr.reduce((s, r) => s + (Number(r[field]) || 0), 0);

      // Extract category breakdown from custom_data
      const categoryMap = new Map<string, { count: number; revenue: number }>();
      for (const reg of approved) {
        const cd = reg.custom_data as Record<string, unknown> | null;
        const cats = cd?._ticket_categories as Array<{ category_name: string; quantity: number; total: number }> | undefined;
        if (cats && Array.isArray(cats)) {
          for (const cat of cats) {
            const existing = categoryMap.get(cat.category_name) || { count: 0, revenue: 0 };
            existing.count += cat.quantity;
            existing.revenue += cat.total;
            categoryMap.set(cat.category_name, existing);
          }
        }
      }

      return {
        totalExpected: sum(regs, "total_amount"),
        totalReceived: sum(approved, "total_amount"),
        totalPending: sum(pending, "total_amount"),
        totalRejected: sum(rejected, "total_amount"),
        baseExpected: sum(regs, "base_amount"),
        addonsExpected: sum(regs, "addons_amount"),
        approvedCount: approved.length,
        pendingCount: pending.length,
        rejectedCount: rejected.length,
        totalRegistrations: regs.length,
        categoryBreakdown: Array.from(categoryMap.entries()).map(([name, d]) => ({
          name, count: d.count, revenue: d.revenue,
        })),
      };
    },
    enabled: !!eventId,
  });

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}><CardContent className="p-4"><div className="h-16 bg-muted animate-pulse rounded" /></CardContent></Card>
        ))}
      </div>
    );
  }

  const gap = data.totalExpected - data.totalReceived - data.totalRejected;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <IndianRupee className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Expected</span>
            </div>
            <p className="text-xl font-bold">₹{data.totalExpected.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{data.totalRegistrations} registrations</p>
          </CardContent>
        </Card>

        <Card className="border-green-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-xs text-muted-foreground">Received</span>
            </div>
            <p className="text-xl font-bold text-green-600">₹{data.totalReceived.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{data.approvedCount} approved</p>
          </CardContent>
        </Card>

        <Card className="border-yellow-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="w-4 h-4 text-yellow-500" />
              <span className="text-xs text-muted-foreground">Pending</span>
            </div>
            <p className="text-xl font-bold text-yellow-600">₹{data.totalPending.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{data.pendingCount} awaiting</p>
          </CardContent>
        </Card>

        <Card className={gap > 0 ? "border-red-500/30" : "border-green-500/30"}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-4 h-4 text-red-500" />
              <span className="text-xs text-muted-foreground">Outstanding</span>
            </div>
            <p className={`text-xl font-bold ${gap > 0 ? "text-red-600" : "text-green-600"}`}>
              ₹{gap.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">{data.rejectedCount} rejected</p>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm">Amount Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Base tickets</span>
              <span className="font-medium">₹{data.baseExpected.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Add-ons / Upsells</span>
              <span className="font-medium">₹{data.addonsExpected.toLocaleString()}</span>
            </div>
            <div className="border-t pt-2 flex justify-between text-sm font-semibold">
              <span>Total</span>
              <span>₹{data.totalExpected.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        {data.categoryBreakdown.length > 0 && (
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm">Ticket Categories (Approved)</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2">
              {data.categoryBreakdown.map((cat) => (
                <div key={cat.name} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {cat.name} <Badge variant="outline" className="ml-1 text-xs">×{cat.count}</Badge>
                  </span>
                  <span className="font-medium">₹{cat.revenue.toLocaleString()}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
