import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Building2, 
  Users, 
  FileCheck, 
  Activity,
  Plus,
  ArrowUpRight,
  TrendingUp
} from "lucide-react";
import { useDashboardStats, useRecentActivity } from "@/hooks/use-dashboard-stats";
import { Skeleton } from "@/components/ui/skeleton";

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
}

export default React.memo(function Dashboard() {
  const navigate = useNavigate();
  const { stats, isLoading: isLoadingStats, error: statsError } = useDashboardStats();
  const { activities, isLoading: isLoadingActivities, error: activitiesError } = useRecentActivity(5);

  // Log errors for debugging
  if (statsError) {
    console.error("Dashboard stats error:", statsError);
  }
  if (activitiesError) {
    console.error("Recent activity error:", activitiesError);
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your overview.</p>
        </div>
        <Button asChild>
          <Link to="/organisations/new">
            <Plus className="mr-2 h-4 w-4" />
            New Organisation
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Organisations */}
        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-4">
              {isLoadingStats ? (
                <Skeleton className="h-8 w-16 mb-2" />
              ) : (
                <p className="text-2xl font-bold text-foreground">{formatNumber(stats.totalOrganisations)}</p>
              )}
              <p className="text-sm text-muted-foreground">Total Organisations</p>
            </div>
          </CardContent>
        </Card>

        {/* Active Students */}
        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-4">
              {isLoadingStats ? (
                <Skeleton className="h-8 w-16 mb-2" />
              ) : (
                <p className="text-2xl font-bold text-foreground">{formatNumber(stats.activeStudents)}</p>
              )}
              <p className="text-sm text-muted-foreground">Active Students</p>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Records */}
        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <FileCheck className="h-5 w-5 text-primary" />
              </div>
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-4">
              {isLoadingStats ? (
                <Skeleton className="h-8 w-16 mb-2" />
              ) : (
                <p className="text-2xl font-bold text-foreground">{formatNumber(stats.attendanceRecords)}</p>
              )}
              <p className="text-sm text-muted-foreground">Attendance Records</p>
            </div>
          </CardContent>
        </Card>

        {/* Active Sessions */}
        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Activity className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="mt-4">
              {isLoadingStats ? (
                <Skeleton className="h-8 w-16 mb-2" />
              ) : (
                <p className="text-2xl font-bold text-foreground">{stats.activeSessions}</p>
              )}
              <p className="text-sm text-muted-foreground">Active Sessions</p>
              {!isLoadingStats && stats.activeSessions > 0 && (
                <p className="text-xs text-primary mt-1">{stats.activeSessions} organisation{stats.activeSessions !== 1 ? 's' : ''}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-primary"
            onClick={() => navigate("/activity")}
          >
            View all
            <ArrowUpRight className="ml-1 h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {isLoadingActivities ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-3 w-16" />
                </div>
              ))}
            </div>
          ) : activities.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No recent activity</p>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div 
                  key={activity.id} 
                  className="flex items-center justify-between py-3 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                      {activity.type === "attendance" && <FileCheck className="h-4 w-4 text-primary" />}
                      {activity.type === "registration" && <Users className="h-4 w-4 text-primary" />}
                      {activity.type === "organisation" && <Building2 className="h-4 w-4 text-primary" />}
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
          )}
        </CardContent>
      </Card>
    </div>
  );
});
