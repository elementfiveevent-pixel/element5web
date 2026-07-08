import { useState } from "react";
import { Link, useOutletContext } from "react-router-dom";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Medal, Award, User, ArrowRight, Crown, Loader2 } from "lucide-react";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import SEOHead from "@/components/common/SEOHead";

interface LayoutContext {
  onAuthClick?: () => void;
}

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Crown className="w-5 h-5 text-warning" />;
    case 2:
      return <Medal className="w-5 h-5 text-muted-foreground" />;
    case 3:
      return <Award className="w-5 h-5 text-amber-600" />;
    default:
      return (
        <span className="w-5 h-5 flex items-center justify-center text-sm font-semibold text-muted-foreground">
          {rank}
        </span>
      );
  }
};

const getRankStyles = (rank: number) => {
  switch (rank) {
    case 1:
      return "bg-gradient-to-br from-warning/10 to-warning/5 border-warning/30";
    case 2:
      return "bg-gradient-to-br from-muted/50 to-muted/30 border-muted-foreground/20";
    case 3:
      return "bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/30";
    default:
      return "";
  }
};

const Leaderboard = () => {
  const context = useOutletContext<LayoutContext>();
  const { leaderboard, isLoading } = useLeaderboard(50);

  const topThree = leaderboard.slice(0, 3);

  return (
    <div>
      <SEOHead
        title="Leaderboard - Top Contributors"
        description="See the top contributors on UniVoid. Earn XP by sharing study materials, news, and helping fellow students. Climb the leaderboard and get recognized."
        url="/leaderboard"
        keywords={['leaderboard', 'top contributors', 'student rankings', 'XP points', 'UniVoid community']}
      />
      <main className="py-10 md:py-14">
        <div className="container-wide">
          {/* Header */}
          <div className="mb-10 text-center">
            <div className="w-16 h-16 bg-warning/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-warning" />
            </div>
            <h1 className="font-display text-2xl md:text-3xl text-foreground mb-2">
              Leaderboard
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Top contributors making UniVoid better for everyone
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground">No contributors yet. Be the first!</p>
            </div>
          ) : (
            <>
              {/* Top 3 Podium */}
              {topThree.length >= 3 && (
                <div className="grid md:grid-cols-3 gap-4 mb-10">
                  {/* Second Place */}
                  <div className="order-2 md:order-1 md:mt-8">
                    <Card className={`${getRankStyles(2)} border transition-all hover:shadow-premium-md`}>
                      <CardContent className="p-6 text-center">
                        <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <Medal className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <Link to={`/profile/${topThree[1].id}`} className="hover:text-primary transition-colors">
                          <h3 className="font-semibold text-foreground mb-1">{topThree[1].full_name}</h3>
                        </Link>
                        <p className="text-sm text-muted-foreground mb-3">Level {topThree[1].level}</p>
                        <p className="text-2xl font-bold text-primary">{topThree[1].total_xp.toLocaleString()} XP</p>
                        <div className="flex justify-center gap-4 mt-4 text-xs text-muted-foreground">
                          <span>{topThree[1].materials_count} materials</span>
                          <span>{topThree[1].news_count} news</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* First Place */}
                  <div className="order-1 md:order-2">
                    <Card className={`${getRankStyles(1)} border transition-all hover:shadow-premium-lg`}>
                      <CardContent className="p-6 text-center">
                        <div className="w-20 h-20 bg-warning/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <Crown className="w-10 h-10 text-warning" />
                        </div>
                        <Link to={`/profile/${topThree[0].id}`} className="hover:text-primary transition-colors">
                          <h3 className="font-semibold text-lg text-foreground mb-1">{topThree[0].full_name}</h3>
                        </Link>
                        <p className="text-sm text-muted-foreground mb-3">Level {topThree[0].level}</p>
                        <p className="text-3xl font-bold text-warning">{topThree[0].total_xp.toLocaleString()} XP</p>
                        <div className="flex justify-center gap-4 mt-4 text-xs text-muted-foreground">
                          <span>{topThree[0].materials_count} materials</span>
                          <span>{topThree[0].news_count} news</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Third Place */}
                  <div className="order-3 md:mt-12">
                    <Card className={`${getRankStyles(3)} border transition-all hover:shadow-premium-md`}>
                      <CardContent className="p-6 text-center">
                        <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <Award className="w-8 h-8 text-amber-600" />
                        </div>
                        <Link to={`/profile/${topThree[2].id}`} className="hover:text-primary transition-colors">
                          <h3 className="font-semibold text-foreground mb-1">{topThree[2].full_name}</h3>
                        </Link>
                        <p className="text-sm text-muted-foreground mb-3">Level {topThree[2].level}</p>
                        <p className="text-2xl font-bold text-amber-600">{topThree[2].total_xp.toLocaleString()} XP</p>
                        <div className="flex justify-center gap-4 mt-4 text-xs text-muted-foreground">
                          <span>{topThree[2].materials_count} materials</span>
                          <span>{topThree[2].news_count} news</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* Full Leaderboard Table */}
              <Card className="shadow-premium-sm">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left p-4 text-sm font-medium text-muted-foreground">Rank</th>
                          <th className="text-left p-4 text-sm font-medium text-muted-foreground">User</th>
                          <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden sm:table-cell">Level</th>
                          <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Materials</th>
                          <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">News</th>
                          <th className="text-right p-4 text-sm font-medium text-muted-foreground">XP</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaderboard.map((user) => (
                          <tr 
                            key={user.id} 
                            className={`border-b border-border/50 last:border-0 hover:bg-secondary/30 transition-colors ${
                              user.rank && user.rank <= 3 ? 'bg-accent/30' : ''
                            }`}
                          >
                            <td className="p-4">
                              <div className="flex items-center">
                                {getRankIcon(user.rank || 0)}
                              </div>
                            </td>
                            <td className="p-4">
                              <Link to={`/profile/${user.id}`} className="flex items-center gap-3 hover:text-primary transition-colors">
                                <div className="w-9 h-9 bg-secondary rounded-full flex items-center justify-center overflow-hidden">
                                  {user.profile_photo_url ? (
                                    <img src={user.profile_photo_url} alt={user.full_name} className="w-full h-full object-cover" />
                                  ) : (
                                    <User className="w-4 h-4 text-muted-foreground" />
                                  )}
                                </div>
                                <span className="font-medium text-foreground">{user.full_name}</span>
                              </Link>
                            </td>
                            <td className="p-4 text-muted-foreground hidden sm:table-cell">Level {user.level}</td>
                            <td className="p-4 text-muted-foreground hidden md:table-cell">{user.materials_count}</td>
                            <td className="p-4 text-muted-foreground hidden md:table-cell">{user.news_count}</td>
                            <td className="p-4 text-right font-semibold text-primary">{user.total_xp.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* CTA */}
          <Card className="mt-12 border-0 bg-secondary/50">
            <CardContent className="p-8 text-center">
              <h3 className="font-display text-xl text-foreground mb-3">Want to climb the leaderboard?</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Start contributing study materials or share news. Every approved contribution earns you XP.
              </p>
              <Button onClick={context?.onAuthClick} className="shadow-premium-sm">
                Start contributing
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      
    </div>
  );
};

export default Leaderboard;
