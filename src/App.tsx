import { Refine, Authenticated } from "@refinedev/core";
import {
  ThemedLayoutV2,
  useNotificationProvider,
  ErrorComponent,
} from "@refinedev/antd";
import "@refinedev/antd/dist/reset.css";
import { BrowserRouter, Route, Routes, Outlet, Navigate } from "react-router-dom";
import routerBindings, {
  DocumentTitleHandler,
  NavigateToResource,
  UnsavedChangesNotifier,
} from "@refinedev/react-router-v6";
import { App as AntdApp, ConfigProvider, theme, Spin } from "antd";
import {
  UserOutlined,
  HomeOutlined,
  ProjectOutlined,
  FlagOutlined,
  RocketOutlined,
  ReadOutlined,
  DollarOutlined,
  DashboardOutlined,
  AuditOutlined,
} from "@ant-design/icons";

import { authProvider } from "./authProvider";
import { dataProvider } from "./dataProvider";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { PendingCountProvider } from "./context/PendingCountContext";
import { CustomSider } from "./components/layout/CustomSider";
import { CustomHeader } from "./components/layout/CustomHeader";

// Pages
import { LoginPage } from "./pages/login";
import { VerifyOtpPage } from "./pages/login/VerifyOtp";
import { DashboardPage } from "./pages/dashboard";
import { UserList } from "./pages/users/list";
import { UserShow } from "./pages/users/show";
import { UserEdit } from "./pages/users/edit";
import { UserCreate } from "./pages/users/create";
import { ListingList } from "./pages/listings/list";
import { ListingShow } from "./pages/listings/show";
import { ListingCreate } from "./pages/listings/create";
import { PendingListingList } from "./pages/listings/pending";
import { ProjectList } from "./pages/projects/list";
import { ProjectShow } from "./pages/projects/show";
import { ProjectCreate } from "./pages/projects/create";
import { ReportList } from "./pages/reports/list";
import { PromotionList } from "./pages/promotions/list";
import { BlogList } from "./pages/blog/list";
import { BlogCreate } from "./pages/blog/create";
import { BlogEdit } from "./pages/blog/edit";
import { TransactionList } from "./pages/transactions/list";
import { LicenseList } from "./pages/licenses/list";

const FullPageSpinner = () => (
  <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
    <Spin size="large" tip="Loading…" />
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <ConfigProvider
        theme={{
          algorithm: theme.defaultAlgorithm,
          token: { colorPrimary: "#1677ff", borderRadius: 6 },
        }}
      >
        <AntdApp>
          <ErrorBoundary>
            <PendingCountProvider>
              <Refine
                routerProvider={routerBindings}
                dataProvider={dataProvider}
                authProvider={authProvider}
                notificationProvider={useNotificationProvider}
                resources={[
                  {
                    name: "dashboard",
                    list: "/dashboard",
                    meta: { label: "Dashboard", icon: <DashboardOutlined /> },
                  },
                  {
                    name: "users",
                    list: "/users",
                    show: "/users/:id",
                    edit: "/users/:id/edit",
                    create: "/users/create",
                    meta: { label: "Users", icon: <UserOutlined /> },
                  },
                  {
                    name: "listings",
                    list: "/listings",
                    show: "/listings/:id",
                    create: "/listings/create",
                    meta: { label: "Listings", icon: <HomeOutlined /> },
                  },
                  {
                    name: "projects",
                    list: "/projects",
                    show: "/projects/:id",
                    create: "/projects/create",
                    meta: { label: "Projects", icon: <ProjectOutlined /> },
                  },
                  {
                    name: "reports",
                    list: "/reports",
                    meta: { label: "Reports", icon: <FlagOutlined /> },
                  },
                  {
                    name: "promotions",
                    list: "/promotions",
                    meta: { label: "Promotions", icon: <RocketOutlined /> },
                  },
                  {
                    name: "blog",
                    list: "/blog",
                    create: "/blog/create",
                    edit: "/blog/:id/edit",
                    meta: { label: "Blog", icon: <ReadOutlined /> },
                  },
                  {
                    name: "transactions",
                    list: "/transactions",
                    meta: { label: "Transactions", icon: <DollarOutlined /> },
                  },
                  {
                    // رخص الإعلانات العقارية — Property Advertisement Licenses
                    name: "licenses",
                    list: "/licenses",
                    meta: { label: "Licenses", icon: <AuditOutlined /> },
                  },
                ]}
                options={{ syncWithLocation: true, warnWhenUnsavedChanges: true }}
              >
                <Routes>
                  {/* Public */}
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/verify-otp" element={<VerifyOtpPage />} />

                  {/* Protected */}
                  <Route
                    element={
                      <Authenticated
                        key="authenticated-inner"
                        fallback={<Navigate to="/login" replace />}
                        loading={<FullPageSpinner />}
                      >
                        <ThemedLayoutV2
                          Sider={() => <CustomSider />}
                          Header={() => <CustomHeader />}
                        >
                          <ErrorBoundary>
                            <Outlet />
                          </ErrorBoundary>
                        </ThemedLayoutV2>
                      </Authenticated>
                    }
                  >
                    <Route index element={<NavigateToResource resource="dashboard" />} />
                    <Route path="/dashboard" element={<DashboardPage />} />

                    {/* Users */}
                    <Route path="/users" element={<UserList />} />
                    <Route path="/users/create" element={<UserCreate />} />
                    <Route path="/users/:id" element={<UserShow />} />
                    <Route path="/users/:id/edit" element={<UserEdit />} />

                    {/* Listings — /pending BEFORE /:id to avoid param clash */}
                    <Route path="/listings/pending" element={<PendingListingList />} />
                    <Route path="/listings/create" element={<ListingCreate />} />
                    <Route path="/listings" element={<ListingList />} />
                    <Route path="/listings/:id" element={<ListingShow />} />

                    {/* Projects */}
                    <Route path="/projects/create" element={<ProjectCreate />} />
                    <Route path="/projects" element={<ProjectList />} />
                    <Route path="/projects/:id" element={<ProjectShow />} />

                    <Route path="/reports" element={<ReportList />} />
                    <Route path="/promotions" element={<PromotionList />} />
                    <Route path="/blog" element={<BlogList />} />
                    <Route path="/blog/create" element={<BlogCreate />} />
                    <Route path="/blog/:id/edit" element={<BlogEdit />} />
                    <Route path="/transactions" element={<TransactionList />} />
                    <Route path="/licenses" element={<LicenseList />} />
                    <Route path="*" element={<ErrorComponent />} />
                  </Route>
                </Routes>

                <UnsavedChangesNotifier />
                <DocumentTitleHandler />
              </Refine>
            </PendingCountProvider>
          </ErrorBoundary>
        </AntdApp>
      </ConfigProvider>
    </BrowserRouter>
  );
}

export default App;
