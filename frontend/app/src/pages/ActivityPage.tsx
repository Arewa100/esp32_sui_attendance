import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, FileCheck, Users, Building2 } from "lucide-react";
import { useRecentActivity } from "@/hooks/use-dashboard-stats";
import PageBackground from "@/components/PageBackground";

export default function ActivityPage() {
  const navigate = useNavigate();
  const { activities, isLoading, error } = useRecentActivity(100); // Get all activities

  const groupedActivities = useMemo(() => {
    if (!activities.length) return {};

    const groups: Record<string, typeof activities> = {};
    activities.forEach((activity) => {
      const date = new Date(activity.timestamp || Date.now());
      const dateKey = date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(activity);
    });

    return groups;
  }, [activities]);

  const sortedDates = useMemo(() => {
    return Object.keys(groupedActivities).sort((a, b) => {
      return new Date(b).getTime() - new Date(a).getTime();
    });
  }, [groupedActivities]);

  return (
    <>
      <PageBackground />
      <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
        {/* Header */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="min-h-[44px] min-w-[44px] flex-shrink-0">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">All Activity</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">Complete history of all activities across your organisations</p>
          </div>
        </div>

        {/* Activity List */}
        <Card className="border-border">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Activity History</CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            {isLoading ? (
              <div className="space-y-3 sm:space-y-4 p-4 sm:p-0">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="flex items-start sm:items-center justify-between gap-3 py-3">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                      <Skeleton className="h-8 w-8 sm:h-9 sm:w-9 rounded-full flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <Skeleton className="h-3.5 sm:h-4 w-full max-w-[200px] sm:max-w-[300px] mb-2" />
                        <Skeleton className="h-3 w-24 sm:w-32" />
                      </div>
                    </div>
                    <Skeleton className="h-3 w-16 sm:w-20 flex-shrink-0" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-8 px-4 sm:px-0">
                <p className="text-sm sm:text-base text-muted-foreground">Error loading activities. Please try again.</p>
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-12 px-4 sm:px-0">
                <FileCheck className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-sm sm:text-base text-muted-foreground">No activity found</p>
                <p className="text-xs sm:text-sm text-muted-foreground/70 mt-2">
                  Activity will appear here once you start using the system.
                </p>
              </div>
            ) : (
              <div className="space-y-6 sm:space-y-8">
                {sortedDates.map((date) => (
                  <div key={date} className="space-y-3 sm:space-y-4">
                    <div className="sticky top-0 bg-background/80 backdrop-blur-sm py-2 px-4 sm:px-0 z-10 border-b border-border">
                      <h3 className="text-xs sm:text-sm font-semibold text-foreground">{date}</h3>
                    </div>
                    <div className="space-y-2 sm:space-y-3">
                      {groupedActivities[date].map((activity) => (
                        <div
                          key={activity.id}
                          className="flex items-start sm:items-center justify-between gap-3 py-3 px-4 sm:px-4 rounded-lg hover:bg-muted/50 transition-colors border-b border-border last:border-0"
                        >
                          <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0 flex-1">
                            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
                              {activity.type === "attendance" && (
                                <FileCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                              )}
                              {activity.type === "registration" && (
                                <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                              )}
                              {activity.type === "organisation" && (
                                <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs sm:text-sm font-medium text-foreground leading-tight sm:leading-normal break-words">{activity.message}</p>
                              <p className="text-xs text-muted-foreground mt-0.5 sm:mt-1 truncate">{activity.org}</p>
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0 ml-2">{activity.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

