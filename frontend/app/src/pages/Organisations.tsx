import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Plus, 
  Search, 
  MoreHorizontal,
  Building2,
  Users,
  FileCheck,
  ArrowUpDown
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMemo, useState } from "react";
import { useOrganisationCreatedEvents } from "@/hooks/use-attendance-events";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useSuiClient } from "@mysten/dapp-kit";
import { useQuery, useQueries } from "@tanstack/react-query";
import { CONFIG } from "@/config";

type StatusFilter = "all" | "active" | "inactive";
type OrgStatus = "active" | "inactive" | "checking" | "unknown";
type SortOption = 
  | "name-asc" 
  | "name-desc" 
  | "created-newest" 
  | "created-oldest" 
  | "students-most" 
  | "students-least" 
  | "records-most" 
  | "records-least";

export default function Organisations() {
  const account = useCurrentAccount();
  const client = useSuiClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortOption, setSortOption] = useState<SortOption>("name-asc");
  const { data: createdEvents, isLoading: isLoadingOrgs, error } = useOrganisationCreatedEvents(200);

  // Fetch all student events (without orgId filter to get all events for counting)
  const { data: allStudentEvents } = useQuery({
    queryKey: ["events", "StudentRegisteredEvent", "all", CONFIG.PACKAGE_ID],
    queryFn: async () => {
      if (!CONFIG.PACKAGE_ID) return [];
      const res = await client.queryEvents({
        query: { MoveEventType: `${CONFIG.PACKAGE_ID}::events::StudentRegisteredEvent` },
        limit: 1000,
        order: "descending",
      });
      return (res.data || []).map((e) => e.parsedJson as any);
    },
    enabled: !!CONFIG.PACKAGE_ID,
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  // Fetch all attendance events (without orgId filter to get all events for counting)
  const { data: allAttendanceEvents } = useQuery({
    queryKey: ["events", "AttendanceRecordedEvent", "all", CONFIG.PACKAGE_ID],
    queryFn: async () => {
      if (!CONFIG.PACKAGE_ID) return [];
      const res = await client.queryEvents({
        query: { MoveEventType: `${CONFIG.PACKAGE_ID}::events::AttendanceRecordedEvent` },
        limit: 1000,
        order: "descending",
      });
      return (res.data || []).map((e) => e.parsedJson as any);
    },
    enabled: !!CONFIG.PACKAGE_ID,
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  // Filter orgs owned by connected wallet
  // Only show organisations if wallet is connected
  const userOrgIds = useMemo(() => {
    if (!createdEvents || !account?.address) return [];
    return createdEvents
      .filter((e) => e.owner === account.address)
      .map((e) => e.organisation);
  }, [createdEvents, account?.address]);

  // Fetch organisation objects in parallel to get subscription status
  const orgQueries = useQueries({
    queries: userOrgIds.map((orgId) => ({
      queryKey: ["object", "AttendanceOrganisation", orgId],
      queryFn: async () => {
        try {
          const res = await client.getObject({
            id: orgId,
            options: { showContent: true },
          });
          const fields = (res.data?.content as any)?.fields;
          if (!fields) return null;
          return { orgId, fields };
        } catch (error) {
          console.error(`Error fetching org ${orgId}:`, error);
          return null;
        }
      },
      enabled: !!orgId,
      staleTime: 60_000, // Keep data fresh for 1 minute
      gcTime: 300_000, // Keep in cache for 5 minutes (formerly cacheTime)
      refetchInterval: 30_000,
      retry: 3, // Retry 3 times on failure
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
      refetchOnWindowFocus: false, // Don't refetch on window focus to avoid unnecessary requests
    })),
  });

  // Compute counts per organisation using useMemo
  const organisations = useMemo(() => {
    if (!createdEvents) return [];

    // Filter orgs owned by connected wallet
    const userOrgs = createdEvents.filter((e) => 
      account?.address ? e.owner === account.address : true
    );

    // Create maps for efficient counting
    const studentCountByOrg = new Map<string, number>();
    const recordCountByOrg = new Map<string, number>();

    // Count students per organisation
    (allStudentEvents || []).forEach((event) => {
      const orgId = event.organisation;
      studentCountByOrg.set(orgId, (studentCountByOrg.get(orgId) || 0) + 1);
    });

    // Count records per organisation
    (allAttendanceEvents || []).forEach((event) => {
      const orgId = event.organisation;
      recordCountByOrg.set(orgId, (recordCountByOrg.get(orgId) || 0) + 1);
    });

    // Create a map of orgId -> subscription status from fetched objects
    // Track loading and error states per organisation
    const statusByOrg = new Map<string, OrgStatus>();
    const queryMap = new Map<string, typeof orgQueries[0]>();
    
    // Map queries by orgId for easy lookup
    orgQueries.forEach((query, index) => {
      if (userOrgIds[index]) {
        queryMap.set(userOrgIds[index], query);
      }
    });

    // Determine status for each organisation
    userOrgs.forEach((e) => {
      const orgId = e.organisation;
      const query = queryMap.get(orgId);
      
      if (!query) {
        statusByOrg.set(orgId, "unknown");
        return;
      }

      // If query is loading and we have no cached data, show "checking"
      if (query.isLoading && !query.data) {
        statusByOrg.set(orgId, "checking");
        return;
      }

      // If query has error and no cached data, show "unknown"
      if (query.isError && !query.data) {
        statusByOrg.set(orgId, "unknown");
        return;
      }

      // If we have data (even if stale), use it
      if (query.data?.fields) {
        const subscription = query.data.fields.subscription?.fields;
        if (subscription) {
          const expiry = Number(subscription.expiry_timestamp);
          const now = Date.now();
          const isActive = expiry > now && subscription.is_active;
          statusByOrg.set(orgId, isActive ? "active" : "inactive");
        } else {
          // No subscription data means inactive
          statusByOrg.set(orgId, "inactive");
        }
      } else if (query.isLoading) {
        // Still loading but might have stale data
        statusByOrg.set(orgId, "checking");
      } else {
        // No data and not loading - unknown state
        statusByOrg.set(orgId, "unknown");
      }
    });

    // Map organisations with counts, creation date, and real subscription status
    return userOrgs.map((e) => {
      const orgId = e.organisation;
      // Get status from map, default to "unknown" if not found
      const status = statusByOrg.get(orgId) ?? "unknown";
      
      return {
        id: orgId,
        name: e.name,
        status: status as OrgStatus,
        students: studentCountByOrg.get(orgId) || 0,
        records: recordCountByOrg.get(orgId) || 0,
        created: e.timestampMs ? new Date(e.timestampMs).toISOString() : undefined,
      };
    });
  }, [createdEvents, allStudentEvents, allAttendanceEvents, account?.address, orgQueries]);

  // Filter and sort organisations
  const filteredOrganisations = useMemo(() => {
    let filtered = organisations;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((org) =>
        org.name.toLowerCase().includes(query)
      );
    }

    // Apply status filter (exclude "checking" and "unknown" from filter)
    if (statusFilter !== "all") {
      filtered = filtered.filter((org) => {
        // Only filter by active/inactive, show checking/unknown in all views
        if (org.status === "checking" || org.status === "unknown") {
          return true;
        }
        return org.status === statusFilter;
      });
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortOption) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "created-newest":
          if (!a.created && !b.created) return 0;
          if (!a.created) return 1;
          if (!b.created) return -1;
          return new Date(b.created).getTime() - new Date(a.created).getTime();
        case "created-oldest":
          if (!a.created && !b.created) return 0;
          if (!a.created) return 1;
          if (!b.created) return -1;
          return new Date(a.created).getTime() - new Date(b.created).getTime();
        case "students-most":
          return b.students - a.students;
        case "students-least":
          return a.students - b.students;
        case "records-most":
          return b.records - a.records;
        case "records-least":
          return a.records - b.records;
        default:
          return 0;
      }
    });

    return sorted;
  }, [organisations, searchQuery, statusFilter, sortOption]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Organisations</h1>
          <p className="text-muted-foreground">Manage your registered organisations</p>
        </div>
        <Button asChild>
          <Link to="/organisations/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Organisation
          </Link>
        </Button>
      </div>

      {!account ? (
        <Card className="border-border">
          <CardContent className="p-4 text-sm text-muted-foreground">
            Connect your wallet to load your organisations from Sui.
          </CardContent>
        </Card>
      ) : null}

      {error ? (
        <Card className="border-border">
          <CardContent className="p-4 text-sm text-destructive">
            {(error as Error).message}
          </CardContent>
        </Card>
      ) : null}

      {/* Search and Filters */}
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Search organisations..." 
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  {statusFilter === "all" ? "All Status" : statusFilter === "active" ? "Active" : "Inactive"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setStatusFilter("all")}>
                  All Status
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("active")}>
                  Active
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("inactive")}>
                  Inactive
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <ArrowUpDown className="mr-2 h-4 w-4" />
                  Sort
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSortOption("name-asc")}>
                  Name (A-Z)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOption("name-desc")}>
                  Name (Z-A)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOption("created-newest")}>
                  Created (Newest)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOption("created-oldest")}>
                  Created (Oldest)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOption("students-most")}>
                  Students (Most)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOption("students-least")}>
                  Students (Least)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOption("records-most")}>
                  Records (Most)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOption("records-least")}>
                  Records (Least)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[300px]">Organisation</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Students</TableHead>
              <TableHead className="text-right">Records</TableHead>
              <TableHead className="text-right">Created</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(isLoadingOrgs || orgQueries.some((q) => q.isLoading)) ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground">
                  Loading organisations...
                </TableCell>
              </TableRow>
            ) : null}

            {!isLoadingOrgs && organisations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground">
                  No organisations found. Create one to get started.
                </TableCell>
              </TableRow>
            ) : null}

            {!isLoadingOrgs && organisations.length > 0 && filteredOrganisations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground">
                  No organisations found matching "{searchQuery}". Try a different search term.
                </TableCell>
              </TableRow>
            ) : null}

            {filteredOrganisations.map((org) => (
              <TableRow key={org.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell>
                  <Link to={`/organisations/${org.id}`} className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <span className="font-medium text-foreground">{org.name}</span>
                  </Link>
                </TableCell>
                <TableCell>
                  {org.status === "checking" ? (
                    <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30">
                      <span className="inline-block w-2 h-2 rounded-full bg-yellow-500 animate-pulse mr-1.5" />
                      Checking...
                    </Badge>
                  ) : org.status === "unknown" ? (
                    <Badge variant="secondary" className="bg-gray-500/20 text-gray-600 dark:text-gray-400 border-gray-500/30">
                      Unknown
                    </Badge>
                  ) : (
                    <Badge 
                      variant={
                        org.status === "active" ? "default" : "destructive"
                      }
                      className={org.status === "active" ? "bg-primary" : ""}
                    >
                      {org.status === "active" ? "active" : "inactive"}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    {org.students.toLocaleString()}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <FileCheck className="h-4 w-4 text-muted-foreground" />
                    {org.records.toLocaleString()}
                  </div>
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {org.created ? new Date(org.created).toLocaleDateString(undefined, { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  }) : "—"}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link to={`/organisations/${org.id}`}>View Details</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem disabled>Edit</DropdownMenuItem>
                      <DropdownMenuItem disabled className="text-destructive">Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
