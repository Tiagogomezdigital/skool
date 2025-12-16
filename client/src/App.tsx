import { useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { CommunityProvider } from "@/contexts/community-context";
import { ErrorBoundary } from "@/components/error-boundary";
import { initializeErrorReporting } from "@/lib/error-reporter";
import NotFound from "@/pages/not-found";
import Layout from "@/components/layout";
import Dashboard from "@/pages/home";
import Courses from "@/pages/courses";
import CourseView from "@/pages/course-view";
import Community from "@/pages/community-v2";
import Login from "@/pages/login";
import Register from "@/pages/register";
import ForgotPassword from "@/pages/forgot-password";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminCommunities from "@/pages/admin/communities";
import AdminCommunityDetail from "@/pages/admin/community-detail";
import AdminCourses from "@/pages/admin/courses";
import AdminCourseDetail from "@/pages/admin/course-detail";
import AdminMedia from "@/pages/admin/media";
import AdminModules from "@/pages/admin/modules";
import AdminSettings from "@/pages/admin/settings";
import InvitePage from "@/pages/invite";
import CourseInvitePage from "@/pages/course-invite";
import PurchasePage from "@/pages/purchase";
import ProfilePage from "@/pages/profile";
import SavedPostsPage from "@/pages/saved-posts";
import NotificationsPage from "@/pages/notifications";
import ChatPage from "@/pages/chat/index";
import ChatDetailPage from "@/pages/chat/[id]";
import { AuthGuard } from "@/components/auth-guard";
import { AdminGuard } from "@/components/admin-guard";
import AdminLayout from "@/components/admin-layout";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={Login} />
      {/* Admin routes */}
      <Route path="/admin/communities/:slug">
        <AuthGuard>
          <AdminGuard>
            <AdminLayout>
              <AdminCommunityDetail />
            </AdminLayout>
          </AdminGuard>
        </AuthGuard>
      </Route>
      <Route path="/admin/communities">
        <AuthGuard>
          <AdminGuard>
            <AdminLayout>
              <AdminCommunities />
            </AdminLayout>
          </AdminGuard>
        </AuthGuard>
      </Route>
      <Route path="/admin/courses/:id">
        <AuthGuard>
          <AdminGuard>
            <AdminLayout>
              <AdminCourseDetail />
            </AdminLayout>
          </AdminGuard>
        </AuthGuard>
      </Route>
      <Route path="/admin/courses">
        <AuthGuard>
          <AdminGuard>
            <AdminLayout>
              <AdminCourses />
            </AdminLayout>
          </AdminGuard>
        </AuthGuard>
      </Route>
      <Route path="/admin/media">
        <AuthGuard>
          <AdminGuard>
            <AdminLayout>
              <AdminMedia />
            </AdminLayout>
          </AdminGuard>
        </AuthGuard>
      </Route>
      <Route path="/admin/modules">
        <AuthGuard>
          <AdminGuard>
            <AdminLayout>
              <AdminModules />
            </AdminLayout>
          </AdminGuard>
        </AuthGuard>
      </Route>
      <Route path="/admin/settings">
        <AuthGuard>
          <AdminGuard>
            <AdminLayout>
              <AdminSettings />
            </AdminLayout>
          </AdminGuard>
        </AuthGuard>
      </Route>
      <Route path="/admin">
        <AuthGuard>
          <AdminGuard>
            <AdminLayout>
              <AdminDashboard />
            </AdminLayout>
          </AdminGuard>
        </AuthGuard>
      </Route>
      {/* Public routes */}
      <Route path="/invite/:token">
        <InvitePage />
      </Route>
      <Route path="/course-invite/:token">
        <CourseInvitePage />
      </Route>
      <Route path="/purchase">
        <PurchasePage />
      </Route>
      
      {/* Rotas de comunidade por slug: /c/:slug/* - rotas explícitas no nível superior */}
      <Route path="/c/:slug/courses/:id">
        <AuthGuard>
          <Layout>
            <CourseView />
          </Layout>
        </AuthGuard>
      </Route>
      <Route path="/c/:slug/courses">
        <AuthGuard>
          <Layout>
            <Courses />
          </Layout>
        </AuthGuard>
      </Route>
      <Route path="/c/:slug/community">
        <AuthGuard>
          <Layout>
            <Community />
          </Layout>
        </AuthGuard>
      </Route>
      <Route path="/c/:slug/profile">
        <AuthGuard>
          <Layout>
            <ProfilePage />
          </Layout>
        </AuthGuard>
      </Route>
      <Route path="/c/:slug/saved">
        <AuthGuard>
          <Layout>
            <SavedPostsPage />
          </Layout>
        </AuthGuard>
      </Route>
      <Route path="/c/:slug/notifications">
        <AuthGuard>
          <Layout>
            <NotificationsPage />
          </Layout>
        </AuthGuard>
      </Route>
      <Route path="/c/:slug/chat/:id">
        <AuthGuard>
          <Layout>
            <ChatDetailPage />
          </Layout>
        </AuthGuard>
      </Route>
      <Route path="/c/:slug/chat">
        <AuthGuard>
          <Layout>
            <ChatPage />
          </Layout>
        </AuthGuard>
      </Route>
      <Route path="/c/:slug">
        <AuthGuard>
          <Layout>
            <Dashboard />
          </Layout>
        </AuthGuard>
      </Route>
      
      {/* Root app routes */}
      <Route>
        <AuthGuard>
          <Layout>
            <Switch>
              {/* Rotas normais (funcionam com ou sem slug no contexto) */}
              <Route path="/" component={Dashboard} />
              <Route path="/courses/:id" component={CourseView} />
              <Route path="/courses" component={Courses} />
              <Route path="/community" component={Community} />
              <Route path="/profile" component={ProfilePage} />
              <Route path="/saved" component={SavedPostsPage} />
              <Route path="/notifications" component={NotificationsPage} />
              <Route path="/chat/:id" component={ChatDetailPage} />
              <Route path="/chat" component={ChatPage} />
              <Route component={NotFound} />
            </Switch>
          </Layout>
        </AuthGuard>
      </Route>
    </Switch>
  );
}

function App() {
  // Inicializar error reporting quando o app carrega
  useEffect(() => {
    initializeErrorReporting();
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <CommunityProvider>
          <Toaster />
          <Router />
        </CommunityProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
