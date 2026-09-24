import { Suspense, lazy, useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import { AdminAuthProvider, RequireAdmin } from "@/components/admin/AdminAuth";
import { ServerWakeNotice } from "@/components/admin/ServerWakeNotice";

// Everything under /admin lives in this chunk, so public visitors never
// download the admin sign-in, API client or pages.
const AdminLogin = lazy(() => import("@/pages/admin/AdminLogin"));
const pages = {
  Layout: () => import("@/pages/admin/AdminLayout"),
  Dashboard: () => import("@/pages/admin/AdminDashboard"),
  Leads: () => import("@/pages/admin/AdminLeads"),
  Submissions: () => import("@/pages/admin/AdminSubmissions"),
  Content: () => import("@/pages/admin/AdminContent"),
  ContentEditor: () => import("@/pages/admin/AdminContentEditor"),
  Settings: () => import("@/pages/admin/AdminSettings"),
  Events: () => import("@/pages/admin/AdminEvents"),
  Migrate: () => import("@/pages/admin/AdminMigrate"),
  Website: () => import("@/pages/admin/AdminWebsite"),
};
const AdminLayout = lazy(pages.Layout);
const AdminDashboard = lazy(pages.Dashboard);
const AdminLeads = lazy(pages.Leads);
const AdminSubmissions = lazy(pages.Submissions);
const AdminContent = lazy(pages.Content);
const AdminContentEditor = lazy(pages.ContentEditor);
const AdminSettings = lazy(pages.Settings);
const AdminEvents = lazy(pages.Events);
const AdminMigrate = lazy(pages.Migrate);
const AdminWebsite = lazy(pages.Website);

// Fetch the other admin pages while the browser is idle, one at a time, so
// switching tabs later never waits on the network.
const prefetchAdmin = () => {
  const run = () => Object.values(pages).reduce((p, load) => p.then(() => load().catch(() => {})), Promise.resolve());
  if ("requestIdleCallback" in window) window.requestIdleCallback(run, { timeout: 4000 });
  else setTimeout(run, 2000);
};

export default function AdminApp() {
  useEffect(prefetchAdmin, []);
  return (
    <AdminAuthProvider>
      <Suspense fallback={<div className="min-h-screen bg-muted/30" aria-busy="true" />}>
        <Routes>
          <Route path="login" element={<AdminLogin />} />
          <Route element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
            <Route index element={<AdminDashboard />} />
            <Route path="leads" element={<AdminLeads />} />
            <Route path="inbox" element={<AdminSubmissions />} />
            <Route path="content" element={<AdminContent />} />
            <Route path="content/new" element={<AdminContentEditor />} />
            <Route path="content/:id" element={<AdminContentEditor />} />
            <Route path="events" element={<AdminEvents />} />
            <Route path="migrate" element={<AdminMigrate />} />
            <Route path="website" element={<AdminWebsite />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
        </Routes>
      </Suspense>
      <ServerWakeNotice />
    </AdminAuthProvider>
  );
}
