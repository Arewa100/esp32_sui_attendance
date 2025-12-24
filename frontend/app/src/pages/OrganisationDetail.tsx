import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChevronLeft,
  Building2,
  Users,
  FileCheck,
  Calendar,
  Plus,
  Search,
  TrendingUp,
  Clock,
  User,
  BarChart3,
  Copy,
  Check
} from "lucide-react";
import { useOrganisationObject, useStudentsByIds } from "@/hooks/use-attendance-objects";
import { useAttendanceRecordedEvents, useStudentRegisteredEvents, useSubscriptionRenewedEvents } from "@/hooks/use-attendance-events";
import { useSubscriptionStatus } from "@/hooks/use-subscription-status";
import SubscribeButton from "@/components/SubscribeButton";
import OrganisationAnalytics from "@/components/OrganisationAnalytics";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function OrganisationDetail() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("overview");
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const { toast } = useToast();
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [attendanceSearchQuery, setAttendanceSearchQuery] = useState("");

  const orgId = id;
  const { data: orgData, isLoading: orgLoading, error: orgError } = useOrganisationObject(orgId);
  const studentIds = orgData?.fields?.students ?? [];
  const { data: studentsFromObjects, isLoading: isLoadingStudents } = useStudentsByIds(studentIds);
  const { data: studentsFromEvents } = useStudentRegisteredEvents(orgId, 500);
  const { data: attendanceEvents, isLoading: isLoadingAttendance } = useAttendanceRecordedEvents(orgId, 500);
  const { data: subscriptionEvents } = useSubscriptionRenewedEvents(orgId, 100);
  const { data: subscriptionStatus } = useSubscriptionStatus(orgId);

  const studentNameById = useMemo(() => {
    const map = new Map<string, string>();
    (studentsFromObjects ?? []).forEach((s) => map.set(s.id, s.fields.name));
    (studentsFromEvents ?? []).forEach((s) => map.set(s.student, s.name));
    return map;
  }, [studentsFromObjects, studentsFromEvents]);

  const organisation = useMemo(() => {
    const fields = orgData?.fields;
    const lastRenewal = subscriptionEvents?.[0];
    const expiry = lastRenewal?.expiry_timestamp ?? fields?.subscription?.fields?.expiry_timestamp;
    
    // Determine status based on subscription, not just hardcoded "active"
    const isSubscriptionActive = subscriptionStatus?.isActive ?? false;

    return {
      name: fields?.name ?? orgId ?? "Organisation",
      status: isSubscriptionActive ? "active" as const : "inactive" as const,
      students: fields?.students?.length ?? 0,
      records: attendanceEvents?.length ?? 0,
      created: undefined as string | undefined,
      subscriptionExpiry: expiry ? new Date(Number(expiry)).toISOString() : undefined,
    };
  }, [attendanceEvents?.length, orgData?.fields, orgId, subscriptionEvents, subscriptionStatus?.isActive]);

  // Calculate last seen timestamp for each student
  const studentLastSeen = useMemo(() => {
    const lastSeenMap = new Map<string, number>();
    
    // Find the most recent attendance timestamp for each student
    (attendanceEvents ?? []).forEach((event) => {
      const studentId = event.student;
      const timestamp = Number(event.timestamp);
      const currentLastSeen = lastSeenMap.get(studentId);
      
      if (!currentLastSeen || timestamp > currentLastSeen) {
        lastSeenMap.set(studentId, timestamp);
      }
    });
    
    return lastSeenMap;
  }, [attendanceEvents]);

  const students = useMemo(() => {
    return (studentsFromObjects ?? []).map((s) => {
      const lastSeenTimestamp = studentLastSeen.get(s.id);
      const lastSeen = lastSeenTimestamp 
        ? new Date(lastSeenTimestamp).toLocaleString()
        : "—";
      
      return {
        id: s.id,
        name: s.fields.name,
        cardId: s.fields.card_id,
        department: s.fields.department,
        lastSeen,
      };
    });
  }, [studentsFromObjects, studentLastSeen]);

  // Filter students based on search query
  const filteredStudents = useMemo(() => {
    if (!studentSearchQuery.trim()) {
      return students;
    }
    
    const query = studentSearchQuery.toLowerCase().trim();
    return students.filter((student) => {
      return (
        student.name.toLowerCase().includes(query) ||
        student.cardId.toLowerCase().includes(query) ||
        student.department.toLowerCase().includes(query)
      );
    });
  }, [students, studentSearchQuery]);

  const attendanceRecords = useMemo(() => {
    return (attendanceEvents ?? [])
      .map((e, idx) => ({
        id: `${idx}`,
        student: studentNameById.get(e.student) ?? e.student,
        type: "check-in" as const,
        timestamp: Number(e.timestamp),
        timestampFormatted: new Date(Number(e.timestamp)).toLocaleString(),
        txHash: e.record,
      }))
      .sort((a, b) => b.timestamp - a.timestamp); // Sort by most recent first
  }, [attendanceEvents, studentNameById]);

  // Filter attendance records based on search query
  const filteredAttendanceRecords = useMemo(() => {
    if (!attendanceSearchQuery.trim()) {
      return attendanceRecords;
    }
    
    const query = attendanceSearchQuery.toLowerCase().trim();
    return attendanceRecords.filter((record) => {
      return (
        record.student.toLowerCase().includes(query) ||
        record.type.toLowerCase().includes(query) ||
        record.timestampFormatted.toLowerCase().includes(query) ||
        record.txHash.toLowerCase().includes(query)
      );
    });
  }, [attendanceRecords, attendanceSearchQuery]);

  // Calculate today's check-ins
  const todayCheckIns = useMemo(() => {
    const now = Date.now();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const startOfDayTimestamp = startOfDay.getTime();

    return attendanceRecords.filter(
      (record) => record.timestamp >= startOfDayTimestamp
    ).length;
  }, [attendanceRecords]);

  // Calculate average attendance
  // This is a simplified calculation: percentage of students who have at least one record
  const avgAttendance = useMemo(() => {
    const totalStudents = organisation.students;
    if (totalStudents === 0) return 0;

    // Count unique students who have attendance records from events
    const studentsWithRecords = new Set(
      (attendanceEvents ?? []).map((e) => e.student)
    ).size;

    return (studentsWithRecords / totalStudents) * 100;
  }, [organisation.students, attendanceEvents]);

  // Copy transaction hash to clipboard
  const handleCopyHash = async (hash: string) => {
    try {
      await navigator.clipboard.writeText(hash);
      setCopiedHash(hash);
      toast({
        title: "Copied!",
        description: "Transaction hash copied to clipboard",
      });
      setTimeout(() => setCopiedHash(null), 2000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy transaction hash",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link to="/organisations" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
          <ChevronLeft className="h-4 w-4" />
          Organisations
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-foreground">{organisation.name}</span>
      </div>

      {orgError ? (
        <Card className="border-border">
          <CardContent className="p-4 text-sm text-destructive">
            {(orgError as Error).message}
          </CardContent>
        </Card>
      ) : null}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
            <Building2 className="h-7 w-7 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{organisation.name}</h1>
              {subscriptionStatus?.isActive && (
                <Badge className="bg-green-500 hover:bg-green-600">
                  Active
                </Badge>
              )}
              {!subscriptionStatus?.isActive && subscriptionStatus !== undefined && (
                <Badge variant="destructive">
                  Inactive
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              {orgLoading ? (
                <Skeleton className="h-4 w-48 inline-block" />
              ) : (
                <>
                  On-chain organisation{" "}
                  {subscriptionStatus?.isActive ? (
                    <>• Subscription active until {subscriptionStatus.expiryTimestamp ? new Date(subscriptionStatus.expiryTimestamp).toLocaleDateString() : ""}</>
                  ) : subscriptionStatus?.expiryTimestamp ? (
                    <>• Subscription expired on {new Date(subscriptionStatus.expiryTimestamp).toLocaleDateString()}</>
                  ) : subscriptionStatus !== undefined ? (
                    <>• No active subscription</>
                  ) : null}
                </>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!subscriptionStatus?.isActive && orgId && (
            <SubscribeButton
              orgObjectId={orgId}
              variant="default"
              size="sm"
              showStatus={false}
              onSuccess={() => {
                // Refetch subscription status
                window.location.reload();
              }}
            />
          )}
          <Button asChild size="sm">
            <Link to={`/organisations/${id}/register`}>
              <Plus className="mr-2 h-4 w-4" />
              Register Student
            </Link>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="border-border">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{organisation.students.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Total Students</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <FileCheck className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{organisation.records.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Total Records</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {orgLoading ? (
                        <Skeleton className="h-8 w-16" />
                      ) : (
                        `${avgAttendance.toFixed(1)}%`
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">Avg Attendance</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {orgLoading ? (
                        <Skeleton className="h-8 w-16" />
                      ) : (
                        todayCheckIns.toLocaleString()
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">Today's Check-ins</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Recent Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Transaction</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        No recent attendance records
                      </TableCell>
                    </TableRow>
                  ) : (
                    attendanceRecords.slice(0, 5).map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{record.student}</TableCell>
                        <TableCell>
                          <Badge variant={record.type === "check-in" ? "default" : "secondary"} className={record.type === "check-in" ? "bg-primary" : ""}>
                            {record.type}
                          </Badge>
                        </TableCell>
                      <TableCell className="text-muted-foreground">{record.timestampFormatted}</TableCell>
                      <TableCell>
                        <button
                          onClick={() => handleCopyHash(record.txHash)}
                          className="group relative inline-flex items-center gap-1.5 text-xs bg-muted hover:bg-muted/80 px-2 py-1 rounded font-mono transition-colors cursor-pointer"
                          title="Click to copy full hash"
                        >
                          {record.txHash.slice(0, 8)}...
                          {copiedHash === record.txHash ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students" className="space-y-6 mt-6">
          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    placeholder="Search students..." 
                    className="pl-9" 
                    value={studentSearchQuery}
                    onChange={(e) => setStudentSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Card ID</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Last Seen</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(orgLoading || isLoadingStudents) ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-28" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-8 rounded" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      {students.length === 0 
                        ? "No students registered yet" 
                        : `No students found matching "${studentSearchQuery}"`}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded font-mono">{student.cardId}</code>
                      </TableCell>
                      <TableCell>{student.department}</TableCell>
                      <TableCell className="text-muted-foreground">{student.lastSeen}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          asChild
                        >
                          <Link to={`/organisations/${orgId}/students/${student.id}`}>
                            <User className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="space-y-6 mt-6">
          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    placeholder="Search records..." 
                    className="pl-9" 
                    value={attendanceSearchQuery}
                    onChange={(e) => setAttendanceSearchQuery(e.target.value)}
                  />
                </div>
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => setAnalyticsOpen(true)}
                >
                  <BarChart3 className="mr-2 h-4 w-4" />
                  View Analytics
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Transaction Hash</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(orgLoading || isLoadingAttendance) ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-20 rounded-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-36" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-24" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredAttendanceRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      {attendanceRecords.length === 0 
                        ? "No attendance records found" 
                        : `No records found matching "${attendanceSearchQuery}"`}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAttendanceRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.student}</TableCell>
                      <TableCell>
                        <Badge variant={record.type === "check-in" ? "default" : "secondary"} className={record.type === "check-in" ? "bg-primary" : ""}>
                          {record.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{record.timestampFormatted}</TableCell>
                      <TableCell>
                        <button
                          onClick={() => handleCopyHash(record.txHash)}
                          className="group relative inline-flex items-center gap-1.5 text-xs bg-muted hover:bg-muted/80 px-2 py-1 rounded font-mono transition-colors cursor-pointer"
                          title="Click to copy full hash"
                        >
                          {record.txHash.slice(0, 8)}...
                          {copiedHash === record.txHash ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6 mt-6">
          {/* Subscription Management */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Subscription Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Subscribe to enable attendance recording for your organisation. 
                  Each subscription lasts 30 days and costs 10 SUI.
                </p>
                {subscriptionStatus && (
                  <div className="p-4 rounded-lg bg-muted">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Status:</span>
                        <span className={subscriptionStatus.isActive ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                          {subscriptionStatus.isActive ? "Active" : subscriptionStatus.expiryTimestamp ? "Expired" : "No Subscription"}
                        </span>
                      </div>
                      {subscriptionStatus.expiryTimestamp && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Expires:</span>
                          <span className="text-sm text-muted-foreground">
                            {new Date(subscriptionStatus.expiryTimestamp).toLocaleString()}
                          </span>
                        </div>
                      )}
                      {subscriptionStatus.timeRemaining && subscriptionStatus.isActive && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Time Remaining:</span>
                          <span className="text-sm text-muted-foreground">
                            {subscriptionStatus.timeRemaining.days}d {subscriptionStatus.timeRemaining.hours}h {subscriptionStatus.timeRemaining.minutes}m
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <SubscribeButton
                  orgObjectId={orgId || ""}
                  variant="default"
                  size="default"
                  showStatus={false}
                  onSuccess={() => {
                    // Refetch subscription status
                    window.location.reload();
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Organisation deletion functionality is coming soon. This feature will allow you to permanently remove an organisation and all its associated data.
              </p>
              <Button variant="destructive" disabled>
                Delete Organisation (Coming Soon)
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Analytics Dialog */}
      {orgId && (
        <OrganisationAnalytics
          orgId={orgId}
          orgName={organisation.name}
          open={analyticsOpen}
          onOpenChange={setAnalyticsOpen}
        />
      )}
    </div>
  );
}
