import { Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy, useEffect, memo } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AdminRoute from "@/components/auth/AdminRoute";
import OrganizerRoute from "@/components/auth/OrganizerRoute";
import CheckInRedirect from "@/components/common/CheckInRedirect";
import AppLayout from "@/components/layout/AppLayout";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  TextPageSkeleton,
  FAQPageSkeleton,
  ListingPageSkeleton,
  TaskListingSkeleton,
  DetailPageSkeleton,
  DashboardPageSkeleton,
  ContactPageSkeleton,
  EventsPageSkeleton,
  LeaderboardPageSkeleton,
  HomePageSkeleton,
} from "@/components/common/PageSkeletons";

// Lazy load pages for better code splitting
const Index = lazy(() => import("@/pages/Index"));
const Materials = lazy(() => import("@/pages/Materials"));
const MaterialDetail = lazy(() => import("@/pages/MaterialDetail"));
const Books = lazy(() => import("@/pages/Books"));
const BookDetail = lazy(() => import("@/pages/BookDetail"));
const Leaderboard = lazy(() => import("@/pages/Leaderboard"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Onboarding = lazy(() => import("@/pages/Onboarding"));
const Profile = lazy(() => import("@/pages/Profile"));
const EditProfile = lazy(() => import("@/pages/EditProfile"));
const Admin = lazy(() => import("@/pages/Admin"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const UploadMaterial = lazy(() => import("@/pages/UploadMaterial"));
const ListBook = lazy(() => import("@/pages/ListBook"));
const PrivacyPolicy = lazy(() => import("@/pages/PrivacyPolicy"));
const Terms = lazy(() => import("@/pages/Terms"));
const RefundPolicy = lazy(() => import("@/pages/RefundPolicy"));
const LegalDisclaimer = lazy(() => import("@/pages/LegalDisclaimer"));
const CookiePolicy = lazy(() => import("@/pages/CookiePolicy"));
const Contact = lazy(() => import("@/pages/Contact"));
const AboutUs = lazy(() => import("@/pages/AboutUs"));
const FAQ = lazy(() => import("@/pages/FAQ"));
const Events = lazy(() => import("@/pages/Events"));
const EventDetail = lazy(() => import("@/pages/EventDetail"));
const CreateEvent = lazy(() => import("@/pages/CreateEvent"));
const OrganizerDashboard = lazy(() => import("@/pages/OrganizerDashboard"));
const MyTickets = lazy(() => import("@/pages/MyTickets"));
const BecomeOrganizer = lazy(() => import("@/pages/BecomeOrganizer"));
const EditEvent = lazy(() => import("@/pages/EditEvent"));
const Projects = lazy(() => import("@/pages/Projects"));
const CreateProject = lazy(() => import("@/pages/CreateProject"));
const ProjectDetail = lazy(() => import("@/pages/ProjectDetail"));
const EventCheckIn = lazy(() => import("@/pages/EventCheckIn"));
const Settings = lazy(() => import("@/pages/Settings"));
const MyBooks = lazy(() => import("@/pages/MyBooks"));
const FastRegister = lazy(() => import("@/pages/FastRegister"));
const Colleges = lazy(() => import("@/pages/Colleges"));
const OrganizerOnboarding = lazy(() => import("@/pages/OrganizerOnboarding"));
const OrganizerProfile = lazy(() => import("@/pages/OrganizerProfile"));
const EditOrganizerProfile = lazy(() => import("@/pages/EditOrganizerProfile"));

// Preload critical pages after initial render
const preloadCriticalPages = () => {
  // Preload most commonly visited pages
  import("@/pages/Dashboard");
  import("@/pages/Materials");
  import("@/pages/Events");
  import("@/pages/EventDetail");
  import("@/pages/Books");
};

// Memoized skeleton wrappers for route-specific loading
const HomeSkeleton = memo(() => <HomePageSkeleton />);
const MaterialsSkeleton = memo(() => <ListingPageSkeleton />);
const BooksSkeleton = memo(() => <ListingPageSkeleton />);
const EventsSkeleton = memo(() => <EventsPageSkeleton />);
const ProjectsSkeleton = memo(() => <TaskListingSkeleton />);

const DetailSkeleton = memo(() => <DetailPageSkeleton />);
const TextSkeleton = memo(() => <TextPageSkeleton />);
const FAQSkeleton = memo(() => <FAQPageSkeleton />);
const ContactSkeleton = memo(() => <ContactPageSkeleton />);
const LeaderboardSkeleton = memo(() => <LeaderboardPageSkeleton />);
const DashboardSkeleton = memo(() => <DashboardPageSkeleton />);

// Minimal loading for non-critical pages
const MinimalLoader = () => null;

export const AnimatedRoutes = () => {
  // Preload critical pages after initial mount
  useEffect(() => {
    // Use requestIdleCallback if available, otherwise setTimeout
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(preloadCriticalPages);
    } else {
      setTimeout(preloadCriticalPages, 1000);
    }
  }, []);

  return (
    <Routes>
      {/* Landing page - no layout wrapper needed */}
      <Route path="/" element={
        <Suspense fallback={<HomeSkeleton />}>
          <Index />
        </Suspense>
      } />

      {/* Public pages with persistent AppLayout (Header/Footer) */}
      <Route element={<AppLayout />}>
        <Route path="/materials" element={
          <Suspense fallback={<MaterialsSkeleton />}><Materials /></Suspense>
        } />
        <Route path="/materials/:materialId" element={
          <Suspense fallback={<DetailSkeleton />}><MaterialDetail /></Suspense>
        } />
        <Route path="/books" element={
          <Suspense fallback={<BooksSkeleton />}><Books /></Suspense>
        } />
        <Route path="/books/:bookId" element={
          <Suspense fallback={<DetailSkeleton />}><BookDetail /></Suspense>
        } />
        <Route path="/events" element={
          <Suspense fallback={<EventsSkeleton />}><Events /></Suspense>
        } />
        <Route path="/events/:eventId" element={
          <Suspense fallback={<DetailSkeleton />}><EventDetail /></Suspense>
        } />
        <Route path="/projects" element={
          <Suspense fallback={<ProjectsSkeleton />}><Projects /></Suspense>
        } />
        <Route path="/projects/:projectId" element={
          <Suspense fallback={<DetailSkeleton />}><ProjectDetail /></Suspense>
        } />
        <Route path="/leaderboard" element={
          <Suspense fallback={<LeaderboardSkeleton />}><Leaderboard /></Suspense>
        } />
        <Route path="/become-organizer" element={
          <Suspense fallback={<TextSkeleton />}><BecomeOrganizer /></Suspense>
        } />
        <Route path="/profile/:userId" element={
          <Suspense fallback={<DetailSkeleton />}><Profile /></Suspense>
        } />
        {/* Legal pages */}
        <Route path="/privacy-policy" element={
          <Suspense fallback={<TextSkeleton />}><PrivacyPolicy /></Suspense>
        } />
        <Route path="/terms" element={
          <Suspense fallback={<TextSkeleton />}><Terms /></Suspense>
        } />
        <Route path="/refund-policy" element={
          <Suspense fallback={<TextSkeleton />}><RefundPolicy /></Suspense>
        } />
        <Route path="/legal-disclaimer" element={
          <Suspense fallback={<TextSkeleton />}><LegalDisclaimer /></Suspense>
        } />
        <Route path="/cookie-policy" element={
          <Suspense fallback={<TextSkeleton />}><CookiePolicy /></Suspense>
        } />
        <Route path="/contact" element={
          <Suspense fallback={<ContactSkeleton />}><Contact /></Suspense>
        } />
        <Route path="/faq" element={
          <Suspense fallback={<FAQSkeleton />}><FAQ /></Suspense>
        } />
        <Route path="/about-us" element={
          <Suspense fallback={<TextSkeleton />}><AboutUs /></Suspense>
        } />
        <Route path="/colleges" element={
          <Suspense fallback={<ListingPageSkeleton />}><Colleges /></Suspense>
        } />
        {/* Organizer Profile - Public */}
        <Route path="/o/:slugOrId" element={
          <Suspense fallback={<DetailSkeleton />}><OrganizerProfile /></Suspense>
        } />
        <Route path="/organizer/:slugOrId" element={
          <Suspense fallback={<DetailSkeleton />}><OrganizerProfile /></Suspense>
        } />
      </Route>

      {/* Dashboard pages with persistent DashboardLayout (Sidebar) */}
      <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={
          <Suspense fallback={<DashboardSkeleton />}><Dashboard /></Suspense>
        } />
        <Route path="/profile" element={
          <Suspense fallback={<DetailSkeleton />}><Profile /></Suspense>
        } />
        <Route path="/profile/edit" element={
          <Suspense fallback={<TextSkeleton />}><EditProfile /></Suspense>
        } />
        <Route path="/settings" element={
          <Suspense fallback={<TextSkeleton />}><Settings /></Suspense>
        } />
        <Route path="/my-events" element={
          <Suspense fallback={<ListingPageSkeleton />}><MyTickets /></Suspense>
        } />
        <Route path="/upload-material" element={
          <Suspense fallback={<TextSkeleton />}><UploadMaterial /></Suspense>
        } />
        <Route path="/sell-book" element={
          <Suspense fallback={<TextSkeleton />}><ListBook /></Suspense>
        } />
        <Route path="/projects/create" element={
          <Suspense fallback={<TextSkeleton />}><CreateProject /></Suspense>
        } />
        {/* Legacy dashboard routes */}
        <Route path="/dashboard/upload-material" element={
          <Suspense fallback={<TextSkeleton />}><UploadMaterial /></Suspense>
        } />
        <Route path="/dashboard/list-book" element={
          <Suspense fallback={<TextSkeleton />}><ListBook /></Suspense>
        } />
        <Route path="/dashboard/my-books" element={
          <Suspense fallback={<ListingPageSkeleton />}><MyBooks /></Suspense>
        } />
        <Route path="/dashboard/my-tickets" element={<Navigate to="/my-events" replace />} />
      </Route>

      {/* Organizer Dashboard - standalone layout (has its own sidebar) */}
      <Route path="/organizer" element={
        <OrganizerRoute>
          <Suspense fallback={<DashboardSkeleton />}><OrganizerDashboard /></Suspense>
        </OrganizerRoute>
      } />
      <Route path="/organizer/dashboard" element={<Navigate to="/organizer" replace />} />

      {/* Create Event - open to all logged-in users */}
      <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route path="/organizer/create-event" element={
          <Suspense fallback={<TextSkeleton />}><CreateEvent /></Suspense>
        } />
      </Route>

      {/* Other organizer pages with DashboardLayout - PROTECTED with OrganizerRoute */}
      <Route element={<OrganizerRoute><DashboardLayout /></OrganizerRoute>}>
        <Route path="/organizer/edit-event/:eventId" element={
          <Suspense fallback={<TextSkeleton />}><EditEvent /></Suspense>
        } />
        <Route path="/organizer/check-in/:eventId" element={
          <Suspense fallback={<DashboardSkeleton />}><EventCheckIn /></Suspense>
        } />
        <Route path="/organizer/edit-profile" element={
          <Suspense fallback={<TextSkeleton />}><EditOrganizerProfile /></Suspense>
        } />
        {/* Volunteer check-in route - same component, different path */}
        <Route path="/events/:eventId/check-in" element={
          <Suspense fallback={<DashboardSkeleton />}><EventCheckIn /></Suspense>
        } />
      </Route>

      {/* Admin with DashboardLayout - PROTECTED with AdminRoute */}
      <Route element={<AdminRoute><DashboardLayout /></AdminRoute>}>
        <Route path="/admin" element={
          <Suspense fallback={<DashboardSkeleton />}><Admin /></Suspense>
        } />
      </Route>

      {/* Onboarding - special case */}
      <Route path="/onboarding" element={
        <ProtectedRoute skipOnboarding>
          <Suspense fallback={<TextSkeleton />}><Onboarding /></Suspense>
        </ProtectedRoute>
      } />

      {/* Organizer Onboarding - must complete before creating events */}
      <Route path="/organizer/onboarding" element={
        <ProtectedRoute>
          <Suspense fallback={<TextSkeleton />}><OrganizerOnboarding /></Suspense>
        </ProtectedRoute>
      } />

      {/* Fast Registration - Flow A */}
      <Route path="/register/:eventId" element={
        <Suspense fallback={<TextSkeleton />}><FastRegister /></Suspense>
      } />

      {/* Check-in redirect */}
      <Route path="/checkin/:token" element={<CheckInRedirect />} />

      {/* 404 */}
      <Route path="*" element={
        <Suspense fallback={<MinimalLoader />}><NotFound /></Suspense>
      } />
    </Routes>
  );
};
