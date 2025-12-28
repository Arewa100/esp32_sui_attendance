import React, { useMemo, useState, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { sanitizeErrorMessage } from "@/utils/error-handler";
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
  Check,
  Smartphone,
  Trash2
} from "lucide-react";
import { useOrganisationObject, useStudentsByIds } from "@/hooks/use-attendance-objects";
import { useAttendanceRecordedEvents, useStudentRegisteredEvents, useSubscriptionRenewedEvents, useDeviceRegisteredEvents, useDeviceHeartbeatEvents, type DeviceRegisteredEvent } from "@/hooks/use-attendance-events";
import { useSubscriptionStatus } from "@/hooks/use-subscription-status";
import SubscribeButton from "@/components/SubscribeButton";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";

export default function OrganisationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [attendanceSearchQuery, setAttendanceSearchQuery] = useState("");
  
  // Debounce search queries to reduce filtering operations
  const debouncedStudentSearch = useDebounce(studentSearchQuery, 300);
  const debouncedAttendanceSearch = useDebounce(attendanceSearchQuery, 300);

  const orgId = id;
  const { data: orgData, isLoading: orgLoading, error: orgError } = useOrganisationObject(orgId);
  const studentIds = orgData?.fields?.students ?? [];
  const { data: studentsFromObjects, isLoading: isLoadingStudents } = useStudentsByIds(studentIds);
  const { data: studentsFromEvents } = useStudentRegisteredEvents(orgId, 500);
  const { data: attendanceEvents, isLoading: isLoadingAttendance } = useAttendanceRecordedEvents(orgId, 500);
  const { data: subscriptionEvents } = useSubscriptionRenewedEvents(orgId, 100);
  const { data: subscriptionStatus } = useSubscriptionStatus(orgId);
  const { data: deviceRegisteredEvents } = useDeviceRegisteredEvents(orgId, 500);
  const { data: deviceHeartbeatEvents } = useDeviceHeartbeatEvents(orgId, 500);

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

  // Filter students based on search query (using debounced query)
  const filteredStudents = useMemo(() => {
    if (!debouncedStudentSearch.trim()) {
      return students;
    }
    
    const query = debouncedStudentSearch.toLowerCase().trim();
    return students.filter((student) => {
      return (
        student.name.toLowerCase().includes(query) ||
        student.cardId.toLowerCase().includes(query) ||
        student.department.toLowerCase().includes(query)
      );
    });
  }, [students, debouncedStudentSearch]);

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
    if (!debouncedAttendanceSearch.trim()) {
      return attendanceRecords;
    }
    
    const query = debouncedAttendanceSearch.toLowerCase().trim();
    return attendanceRecords.filter((record) => {
      return (
        record.student.toLowerCase().includes(query) ||
        record.type.toLowerCase().includes(query) ||
        record.timestampFormatted.toLowerCase().includes(query) ||
        record.txHash.toLowerCase().includes(query)
      );
    });
  }, [attendanceRecords, debouncedAttendanceSearch]);

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
  const handleCopyHash = useCallback(async (hash: string) => {
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
  }, [toast]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs sm:text-sm overflow-x-auto">
        <Link to="/organisations" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 min-h-[44px] flex-shrink-0">
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Organisations</span>
          <span className="sm:hidden">Orgs</span>
        </Link>
        <span className="text-muted-foreground flex-shrink-0">/</span>
        <span className="text-foreground truncate">{organisation.name}</span>
      </div>

      {orgError ? (
        <Card className="border-border">
          <CardContent className="p-4 text-sm text-destructive">
            {useMemo(() => sanitizeErrorMessage(orgError), [orgError])}
          </CardContent>
        </Card>
      ) : null}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
          <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl bg-primary/10 flex-shrink-0">
            <Building2 className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">{organisation.name}</h1>
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
            <div className="text-xs sm:text-sm text-muted-foreground mt-1">
              {orgLoading ? (
                <Skeleton className="h-4 w-32 sm:w-48 inline-block" />
              ) : (
                <>
                  <span className="hidden sm:inline">On-chain organisation</span>
                  <span className="sm:hidden">On-chain</span>
                  {" "}
                  {subscriptionStatus?.isActive ? (
                    <>• <span className="hidden sm:inline">Subscription active until </span>{subscriptionStatus.expiryTimestamp ? new Date(subscriptionStatus.expiryTimestamp).toLocaleDateString() : ""}</>
                  ) : subscriptionStatus?.expiryTimestamp ? (
                    <>• <span className="hidden sm:inline">Expired </span>{new Date(subscriptionStatus.expiryTimestamp).toLocaleDateString()}</>
                  ) : subscriptionStatus !== undefined ? (
                    <>• No subscription</>
                  ) : null}
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
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
          <Button asChild size="sm" className="md:h-11 w-full sm:w-auto text-xs sm:text-sm">
            <Link to={`/organisations/${id}/register`}>
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Register Student</span>
              <span className="sm:hidden">Add Student</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted w-full sm:w-auto">
          <TabsTrigger value="overview" className="min-h-[44px] text-xs sm:text-sm">Overview</TabsTrigger>
          <TabsTrigger value="students" className="min-h-[44px] text-xs sm:text-sm">Students</TabsTrigger>
          <TabsTrigger value="attendance" className="min-h-[44px] text-xs sm:text-sm">Attendance</TabsTrigger>
          <TabsTrigger value="devices" className="min-h-[44px] text-xs sm:text-sm">Devices</TabsTrigger>
          <TabsTrigger value="settings" className="min-h-[44px] text-xs sm:text-sm">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
          {/* Stats */}
          <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4">
            <Card className="border-border">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xl sm:text-2xl font-bold text-foreground truncate">{organisation.students.toLocaleString()}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Total Students</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                    <FileCheck className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xl sm:text-2xl font-bold text-foreground truncate">{organisation.records.toLocaleString()}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Total Records</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xl sm:text-2xl font-bold text-foreground truncate">
                      {orgLoading ? (
                        <Skeleton className="h-7 sm:h-8 w-12 sm:w-16" />
                      ) : (
                        `${avgAttendance.toFixed(1)}%`
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Avg Attendance</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xl sm:text-2xl font-bold text-foreground truncate">
                      {orgLoading ? (
                        <Skeleton className="h-7 sm:h-8 w-12 sm:w-16" />
                      ) : (
                        todayCheckIns.toLocaleString()
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Today's Check-ins</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="border-border">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">Recent Attendance</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {/* Desktop Table */}
              <div className="hidden md:block px-4 sm:px-6 pb-4 sm:pb-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[120px]">Student</TableHead>
                      <TableHead className="min-w-[80px]">Type</TableHead>
                      <TableHead className="min-w-[160px]">Timestamp</TableHead>
                      <TableHead className="min-w-[120px]">Transaction</TableHead>
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
                          <TableCell className="font-medium text-sm sm:text-base">{record.student}</TableCell>
                          <TableCell>
                            <Badge variant={record.type === "check-in" ? "default" : "secondary"} className={record.type === "check-in" ? "bg-primary" : ""}>
                              {record.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs sm:text-sm">{record.timestampFormatted}</TableCell>
                          <TableCell>
                            <button
                              onClick={() => handleCopyHash(record.txHash)}
                              className="group relative inline-flex items-center gap-1.5 text-xs px-2 py-2 rounded font-mono transition-opacity cursor-pointer min-h-[44px] hover:opacity-80"
                              title="Click to copy full hash"
                            >
                              <span className="hidden sm:inline">{record.txHash.slice(0, 8)}...</span>
                              <span className="sm:hidden">{record.txHash.slice(0, 4)}...</span>
                              {copiedHash === record.txHash ? (
                                <Check className="h-4 w-4 text-green-500" />
                              ) : (
                                <Copy className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                              )}
                            </button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3 p-4">
                {attendanceRecords.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No recent attendance records
                  </div>
                ) : (
                  attendanceRecords.slice(0, 5).map((record) => (
                    <Card key={record.id} className="border-border">
                      <CardContent className="p-4 space-y-3">
                        <h3 className="font-medium text-base text-foreground">{record.student}</h3>
                        <div className="flex items-center justify-between pt-2 border-t">
                          <span className="text-xs font-medium text-muted-foreground">Type</span>
                          <Badge variant={record.type === "check-in" ? "default" : "secondary"} className={record.type === "check-in" ? "bg-primary" : ""}>
                            {record.type}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground">Timestamp</span>
                          <span className="text-sm text-muted-foreground">{record.timestampFormatted}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground">Transaction</span>
                          <button
                            onClick={() => handleCopyHash(record.txHash)}
                            className="group relative inline-flex items-center gap-1.5 text-xs px-2 py-2 rounded font-mono transition-opacity cursor-pointer min-h-[44px] hover:opacity-80"
                            title="Click to copy full hash"
                          >
                            {record.txHash.slice(0, 4)}...
                            {copiedHash === record.txHash ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
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
            <CardContent className="p-0">
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto -mx-4 sm:mx-0">
                <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[120px]">Name</TableHead>
                        <TableHead className="min-w-[100px]">Card ID</TableHead>
                        <TableHead className="min-w-[100px]">Department</TableHead>
                        <TableHead className="min-w-[140px]">Last Seen</TableHead>
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
                                className="h-10 w-10 md:h-11 md:w-11 min-w-[44px]"
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
                </div>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3 p-4">
                {(orgLoading || isLoadingStudents) ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <Card key={idx} className="border-border">
                      <CardContent className="p-4 space-y-3">
                        <Skeleton className="h-5 w-32" />
                        <div className="flex items-center justify-between pt-2 border-t">
                          <span className="text-xs text-muted-foreground">Card ID</span>
                          <Skeleton className="h-5 w-24" />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Department</span>
                          <Skeleton className="h-4 w-20" />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Last Seen</span>
                          <Skeleton className="h-4 w-28" />
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : filteredStudents.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    {students.length === 0 
                      ? "No students registered yet" 
                      : `No students found matching "${studentSearchQuery}"`}
                  </div>
                ) : (
                  filteredStudents.map((student) => (
                    <Card
                      key={student.id}
                      className="border-border cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => navigate(`/organisations/${orgId}/students/${student.id}`)}
                    >
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-base text-foreground">{student.name}</h3>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 min-h-[44px] min-w-[44px]"
                            asChild
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Link to={`/organisations/${orgId}/students/${student.id}`}>
                              <User className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t">
                          <span className="text-xs font-medium text-muted-foreground">Card ID</span>
                          <code className="text-xs bg-muted px-2 py-1 rounded font-mono">{student.cardId}</code>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground">Department</span>
                          <span className="text-sm">{student.department}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground">Last Seen</span>
                          <span className="text-sm text-muted-foreground">{student.lastSeen}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                <div className="relative flex-1 w-full sm:max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    placeholder="Search records..." 
                    className="pl-9 min-h-[44px]" 
                    value={attendanceSearchQuery}
                    onChange={(e) => setAttendanceSearchQuery(e.target.value)}
                  />
                </div>
                <Button 
                  variant="default" 
                  size="sm"
                  className="md:h-11 w-full sm:w-auto text-xs sm:text-sm"
                  onClick={() => navigate(`/organisations/${id}/analytics`)}
                >
                  <BarChart3 className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">View Analytics</span>
                  <span className="sm:hidden">Analytics</span>
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-border">
            <CardContent className="p-0">
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto -mx-4 sm:mx-0">
                <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[120px]">Student</TableHead>
                        <TableHead className="min-w-[80px]">Type</TableHead>
                        <TableHead className="min-w-[160px]">Timestamp</TableHead>
                        <TableHead className="min-w-[120px]">Transaction Hash</TableHead>
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
                              : `No records found matching "${debouncedAttendanceSearch}"`}
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
                                className="group relative inline-flex items-center gap-1.5 text-xs px-2 py-2 rounded font-mono transition-opacity cursor-pointer min-h-[44px] hover:opacity-80"
                                title="Click to copy full hash"
                              >
                                <span className="hidden sm:inline">{record.txHash.slice(0, 8)}...</span>
                                <span className="sm:hidden">{record.txHash.slice(0, 4)}...</span>
                                {copiedHash === record.txHash ? (
                                  <Check className="h-4 w-4 text-green-500" />
                                ) : (
                                  <Copy className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                )}
                              </button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3 p-4">
                {(orgLoading || isLoadingAttendance) ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <Card key={idx} className="border-border">
                      <CardContent className="p-4 space-y-3">
                        <Skeleton className="h-5 w-32" />
                        <div className="flex items-center justify-between pt-2 border-t">
                          <span className="text-xs text-muted-foreground">Type</span>
                          <Skeleton className="h-5 w-20 rounded-full" />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Timestamp</span>
                          <Skeleton className="h-4 w-36" />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Transaction</span>
                          <Skeleton className="h-5 w-24" />
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : filteredAttendanceRecords.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    {attendanceRecords.length === 0 
                      ? "No attendance records found" 
                      : `No records found matching "${attendanceSearchQuery}"`}
                  </div>
                ) : (
                  filteredAttendanceRecords.map((record) => (
                    <Card key={record.id} className="border-border">
                      <CardContent className="p-4 space-y-3">
                        <h3 className="font-medium text-base text-foreground">{record.student}</h3>
                        <div className="flex items-center justify-between pt-2 border-t">
                          <span className="text-xs font-medium text-muted-foreground">Type</span>
                          <Badge variant={record.type === "check-in" ? "default" : "secondary"} className={record.type === "check-in" ? "bg-primary" : ""}>
                            {record.type}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground">Timestamp</span>
                          <span className="text-sm text-muted-foreground">{record.timestampFormatted}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground">Transaction</span>
                          <button
                            onClick={() => handleCopyHash(record.txHash)}
                            className="group relative inline-flex items-center gap-1.5 text-xs px-2 py-2 rounded font-mono transition-opacity cursor-pointer min-h-[44px] hover:opacity-80"
                            title="Click to copy full hash"
                          >
                            <span className="hidden sm:inline">{record.txHash.slice(0, 8)}...</span>
                            <span className="sm:hidden">{record.txHash.slice(0, 4)}...</span>
                            {copiedHash === record.txHash ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Devices Tab */}
        <TabsContent value="devices" className="space-y-6 mt-6">
          <Card className="border-border">
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <CardTitle className="text-base sm:text-lg">Registered Devices</CardTitle>
                <Button asChild size="sm" className="w-full sm:w-auto md:h-11 text-xs sm:text-sm">
                  <Link to={`/organisations/${id}/register-device`}>
                    <Plus className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Register Device</span>
                    <span className="sm:hidden">Add Device</span>
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Desktop Table */}
              <div className="hidden md:block px-4 sm:px-6 pb-4 sm:pb-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[150px]">Device ID</TableHead>
                      <TableHead className="min-w-[80px]">Status</TableHead>
                      <TableHead className="min-w-[160px]">Last Heartbeat</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!deviceRegisteredEvents || deviceRegisteredEvents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          No devices registered yet. Register a device to get started.
                        </TableCell>
                      </TableRow>
                    ) : (() => {
                    // Get unique devices from registration events
                    const uniqueDevices = new Map<string, DeviceRegisteredEvent>();
                    (deviceRegisteredEvents ?? []).forEach((event) => {
                      if (!uniqueDevices.has(event.device_id)) {
                        uniqueDevices.set(event.device_id, event);
                      }
                    });

                    // Get latest heartbeat for each device
                    const deviceHeartbeats = new Map<string, number>();
                    (deviceHeartbeatEvents ?? []).forEach((event) => {
                      const timestamp = Number(event.timestamp);
                      const existing = deviceHeartbeats.get(event.device_id);
                      if (!existing || timestamp > existing) {
                        deviceHeartbeats.set(event.device_id, timestamp);
                      }
                    });

                    // Calculate device health status (device is "alive" if heartbeat within last 2 hours)
                    const DEVICE_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 hours
                    const now = Date.now();

                    return Array.from(uniqueDevices.values()).map((deviceEvent) => {
                      const lastHeartbeat = deviceHeartbeats.get(deviceEvent.device_id);
                      const isAlive = lastHeartbeat ? (now - lastHeartbeat) < DEVICE_TIMEOUT_MS : false;
                      const lastHeartbeatFormatted = lastHeartbeat 
                        ? new Date(lastHeartbeat).toLocaleString()
                        : "Never";

                      return (
                        <TableRow key={deviceEvent.device_id}>
                          <TableCell className="font-mono font-medium">{deviceEvent.device_id}</TableCell>
                          <TableCell>
                            <Badge variant={isAlive ? "default" : "destructive"} className={isAlive ? "bg-green-500 hover:bg-green-600" : ""}>
                              {isAlive ? "Online" : "Offline"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{lastHeartbeatFormatted}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                // TODO: Implement unregister functionality
                                toast({
                                  title: "Unregister Device",
                                  description: "Device unregistration is coming soon.",
                                  variant: "default",
                                });
                              }}
                              disabled
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    });
                  })()}
                </TableBody>
              </Table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3 p-4">
                {!deviceRegisteredEvents || deviceRegisteredEvents.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No devices registered yet. Register a device to get started.
                  </div>
                ) : (() => {
                  // Get unique devices from registration events
                  const uniqueDevices = new Map<string, DeviceRegisteredEvent>();
                  (deviceRegisteredEvents ?? []).forEach((event) => {
                    if (!uniqueDevices.has(event.device_id)) {
                      uniqueDevices.set(event.device_id, event);
                    }
                  });

                  // Get latest heartbeat for each device
                  const deviceHeartbeats = new Map<string, number>();
                  (deviceHeartbeatEvents ?? []).forEach((event) => {
                    const timestamp = Number(event.timestamp);
                    const existing = deviceHeartbeats.get(event.device_id);
                    if (!existing || timestamp > existing) {
                      deviceHeartbeats.set(event.device_id, timestamp);
                    }
                  });

                  // Calculate device health status
                  const DEVICE_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 hours
                  const now = Date.now();

                  return Array.from(uniqueDevices.values()).map((deviceEvent) => {
                    const lastHeartbeat = deviceHeartbeats.get(deviceEvent.device_id);
                    const isAlive = lastHeartbeat ? (now - lastHeartbeat) < DEVICE_TIMEOUT_MS : false;
                    const lastHeartbeatFormatted = lastHeartbeat 
                      ? new Date(lastHeartbeat).toLocaleString()
                      : "Never";

                    return (
                      <Card key={deviceEvent.device_id} className="border-border">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="font-mono font-medium text-sm text-foreground break-all flex-1">{deviceEvent.device_id}</h3>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="md:h-11 md:min-w-[44px] flex-shrink-0"
                              onClick={() => {
                                toast({
                                  title: "Unregister Device",
                                  description: "Device unregistration is coming soon.",
                                  variant: "default",
                                });
                              }}
                              disabled
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t">
                            <span className="text-xs font-medium text-muted-foreground">Status</span>
                            <Badge variant={isAlive ? "default" : "destructive"} className={isAlive ? "bg-green-500 hover:bg-green-600" : ""}>
                              {isAlive ? "Online" : "Offline"}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground">Last Heartbeat</span>
                            <span className="text-sm text-muted-foreground">{lastHeartbeatFormatted}</span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  });
                })()}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
          {/* Subscription Management */}
          <Card className="border-border">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">Subscription Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
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
              <Button variant="destructive" disabled className="w-full sm:w-auto md:h-11 text-xs sm:text-sm">
                <span className="hidden sm:inline">Delete Organisation (Coming Soon)</span>
                <span className="sm:hidden">Delete (Coming Soon)</span>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}