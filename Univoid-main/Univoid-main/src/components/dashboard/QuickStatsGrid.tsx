import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Zap, Trophy, Calendar, BookOpen } from "lucide-react";

interface QuickStatsGridProps {
  xp: number;
  rank: number | null;
  eventsRegistered: number;
  materialsUploaded: number;
  isLoading?: boolean;
}

const QuickStatsGrid = ({
  xp,
  rank,
  eventsRegistered,
  materialsUploaded,
  isLoading = false,
}: QuickStatsGridProps) => {
  const stats = [
    {
      label: "XP Earned",
      value: xp,
      icon: Zap,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
    },
    {
      label: "Campus Rank",
      value: rank ? `#${rank}` : "—",
      icon: Trophy,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      label: "Events Registered",
      value: eventsRegistered,
      icon: Calendar,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Materials Shared",
      value: materialsUploaded,
      icon: BookOpen,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((stat) => (
        <Card key={stat.label} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${stat.bgColor}`}
              >
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold text-foreground truncate">
                  {stat.value}
                </p>
                <p className="text-xs text-muted-foreground truncate">{stat.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default QuickStatsGrid;
