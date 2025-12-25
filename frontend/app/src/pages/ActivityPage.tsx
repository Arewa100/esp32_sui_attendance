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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">All Activity</h1>
            <p className="text-sm text-muted-foreground">Complete history of all activities across your organisations</p>
          </div>
        </div>

        {/* Activity List */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Activity History</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-9 w-9 rounded-full" />
                      <div>
                        <Skeleton className="h-4 w-48 mb-2" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                    <Skeleton className="h-3 w-20" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Error loading activities. Please try again.</p>
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-12">
                <FileCheck className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground">No activity found</p>
                <p className="text-sm text-muted-foreground/70 mt-2">
                  Activity will appear here once you start using the system.
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {sortedDates.map((date) => (
                  <div key={date} className="space-y-4">
                    <div className="sticky top-0 bg-background/80 backdrop-blur-sm py-2 z-10 border-b border-border">
                      <h3 className="text-sm font-semibold text-foreground">{date}</h3>
                    </div>
                    <div className="space-y-3">
                      {groupedActivities[date].map((activity) => (
                        <div
                          key={activity.id}
                          className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-muted/50 transition-colors border-b border-border last:border-0"
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                              {activity.type === "attendance" && (
                                <FileCheck className="h-4 w-4 text-primary" />
                              )}
                              {activity.type === "registration" && (
                                <Users className="h-4 w-4 text-primary" />
                              )}
                              {activity.type === "organisation" && (
                                <Building2 className="h-4 w-4 text-primary" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">{activity.message}</p>
                              <p className="text-xs text-muted-foreground">{activity.org}</p>
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground">{activity.time}</span>
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

