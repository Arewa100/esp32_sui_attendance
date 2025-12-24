import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Skeleton } from "@/components/ui/skeleton";
import Settings from "./pages/Settings";

// Lazy load pages for code splitting
const Landing = lazy(() => import("./pages/Landing"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Organisations = lazy(() => import("./pages/Organisations"));
const OrganisationDetail = lazy(() => import("./pages/OrganisationDetail"));
const CreateOrganisation = lazy(() => import("./pages/CreateOrganisation"));
const RegisterStudent = lazy(() => import("./pages/RegisterStudent"));
const NotFound = lazy(() => import("./pages/NotFound"));
const DashboardLayout = lazy(() => import("./components/layout/DashboardLayout"));

// Keep legacy routes working (existing app paths)
const WelcomePage = lazy(() => import("./pages/WelcomePage"));
const MyOrganisationsPage = lazy(() => import("./pages/MyOrganisationsPage"));
const CreateOrganisationPage = lazy(() => import("./pages/CreateOrganisationPage"));
const OrganisationDashboardPage = lazy(() => import("./pages/OrganisationDashboardPage"));
const RegisterStudentPage = lazy(() => import("./pages/RegisterStudentPage"));
const SubscriptionPage = lazy(() => import("./pages/SubscriptionPage"));

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-8">
    <div className="w-full max-w-4xl space-y-4">
      <Skeleton className="h-12 w-64" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  </div>
);

export default function App() {
  return (
    <TooltipProvider>
      <Toaster />
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Lovable routes */}
          <Route path="/" element={<Landing />} />
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/organisations" element={<Organisations />} />
            <Route path="/organisations/new" element={<CreateOrganisation />} />
            <Route path="/organisations/:id" element={<OrganisationDetail />} />
            <Route path="/organisations/:id/register" element={<RegisterStudent />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          {/* Legacy routes (so existing deep links still work) */}
          <Route path="/welcome" element={<WelcomePage />} />
          <Route path="/orgs" element={<MyOrganisationsPage />} />
          <Route path="/orgs/new" element={<CreateOrganisationPage />} />
          <Route path="/orgs/:orgObjectId" element={<OrganisationDashboardPage />} />
          <Route path="/orgs/:orgObjectId/students/new" element={<RegisterStudentPage />} />
          <Route path="/orgs/:orgObjectId/subscription" element={<SubscriptionPage />} />

          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </Suspense>
    </TooltipProvider>
  );
}



