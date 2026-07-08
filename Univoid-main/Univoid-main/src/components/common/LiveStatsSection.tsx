import { useLiveStats } from '@/hooks/useLiveStats';
import { AnimatedCounter } from './AnimatedCounter';
import { Users, FileText } from 'lucide-react';

export function LiveStatsSection() {
  const { totalUsers, totalMaterials } = useLiveStats();

  // Show fallback text if data is unavailable
  const hasData = totalUsers > 0 || totalMaterials > 0;

  return (
    <section className="section-spacing-sm bg-gradient-to-b from-secondary/60 to-secondary/40">
      <div className="container-wide">
        <div className="text-center">
          {/* Trust heading - always shows immediately */}
          <p className="text-lg md:text-xl font-medium text-foreground mb-2">
            {hasData ? (
              <>Trusted by <span className="text-primary font-bold">{totalUsers}+</span> students</>
            ) : (
              "Trusted by students across colleges"
            )}
          </p>
          
          {hasData && (
            <p className="text-base text-muted-foreground mb-8">
              <span className="font-semibold text-foreground">{totalMaterials}+</span> study materials shared
            </p>
          )}
          
          {/* Stats cards - only show when data is available */}
          {hasData && (
            <div className="flex flex-wrap justify-center gap-8 md:gap-16 mt-6">
              {/* Total Users */}
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-3 transition-transform hover:scale-110">
                  <Users className="w-7 h-7 text-primary" />
                </div>
                <div className="text-3xl md:text-4xl font-bold text-foreground mb-1">
                  <AnimatedCounter value={totalUsers} />
                </div>
                <p className="text-sm text-muted-foreground font-medium">Registered Students</p>
              </div>

              {/* Total Materials */}
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 bg-success/10 rounded-2xl flex items-center justify-center mb-3 transition-transform hover:scale-110">
                  <FileText className="w-7 h-7 text-success" />
                </div>
                <div className="text-3xl md:text-4xl font-bold text-foreground mb-1">
                  <AnimatedCounter value={totalMaterials} />
                </div>
                <p className="text-sm text-muted-foreground font-medium">Study Materials Shared</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
