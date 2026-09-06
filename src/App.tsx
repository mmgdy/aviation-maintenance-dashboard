import { Suspense } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { DefaultProviders } from "./components/providers/default.tsx";
import LocaleWrapper from "./components/providers/locale-wrapper.tsx";
import AppLayout from "./components/layout/app-layout.tsx";
import { SAVED_OR_DEFAULT_LOCALE, setLocaleInPath } from "./i18n.ts";
import "./i18n.ts";
import AuthCallback from "./pages/auth/Callback.tsx";
import DashboardPage from "./pages/dashboard/page.tsx";
import RegionsPage from "./pages/regions/page.tsx";
import SiteDetailPage from "./pages/regions/site-detail-page.tsx";
import EngineersPage from "./pages/engineers/page.tsx";
import LicensingPage from "./pages/licensing/page.tsx";
import EquipmentPage from "./pages/equipment/page.tsx";
import InventoryPage from "./pages/inventory/page.tsx";
import AccessPage from "./pages/access/page.tsx";
import NotFound from "./pages/NotFound.tsx";

// Landing params (eg ?ref=, ?utm_source=, ?token=) arrive on `/` and are read by pages
// rendered under /:lng, so the root redirect must carry search and hash across.
function RootRedirect() {
  const location = useLocation();
  return (
    <Navigate
      to={setLocaleInPath(SAVED_OR_DEFAULT_LOCALE, "/", location.search, location.hash)}
      replace
    />
  );
}

export default function App() {
  return (
    <DefaultProviders>
      <BrowserRouter>
        <Suspense fallback={<div></div>}>
          <Routes>
            {/* Root: redirect to saved/default locale */}
            <Route path="/" element={<RootRedirect />} />

            {/* Non-localized routes (auth, webhooks, etc.) */}
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* All localized routes under /:lng */}
            <Route
              path="/:lng"
              element={
                <LocaleWrapper>
                  <Outlet />
                </LocaleWrapper>
              }
            >
              <Route element={<AppLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="regions" element={<RegionsPage />} />
                <Route path="regions/:siteId" element={<SiteDetailPage />} />
                <Route path="engineers" element={<EngineersPage />} />
                <Route path="licensing" element={<LicensingPage />} />
                <Route path="equipment" element={<EquipmentPage />} />
                <Route path="inventory" element={<InventoryPage />} />
                <Route path="access" element={<AccessPage />} />
              </Route>
              {/* ADD ALL OTHER ROUTES HERE */}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </DefaultProviders>
  );
}
