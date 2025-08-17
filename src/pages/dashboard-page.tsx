import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { UserStats } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import Sidebar from "@/components/ui/sidebar";
import MobileNav from "@/components/ui/mobile-nav";
import AccountCard from "@/components/dashboard/account-card";
import ReferralSection from "@/components/dashboard/referral-section";
import TaskSection from "@/components/dashboard/task-section";
import AnalyticsChart from "@/components/dashboard/analytics-chart";
import ActivationModal from "@/components/activation-modal";
import WithdrawModal from "@/components/withdraw-modal";
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getApiUrl, endpoints } from "@/lib/api";

// Fetcher with credentials for authenticated endpoints
const fetchWithCredentials = (url: string) => {
  const fullUrl = getApiUrl(url);
  return fetch(fullUrl, {
    credentials: "include",
    cache: "no-store",
    headers: {
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
  }).then((res) => {
    if (!res.ok) {
      throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
    }
    return res.json();
  });
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [activationModalOpen, setActivationModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [withdrawSource, setWithdrawSource] = useState<string>("");
  const [withdrawAmount, setWithdrawAmount] = useState<number>(0);

  const {
    data: stats,
    isLoading,
    error,
    refetch: refetchStats,
  } = useQuery<UserStats>({
    queryKey: [endpoints.user.stats],
    queryFn: () => fetchWithCredentials(endpoints.user.stats),
    refetchInterval: 30000, // Refresh every 30 seconds
    retry: 3,
    staleTime: 30000,
    enabled: !!user, // Only run query if user is authenticated
  });

  const openActivationModal = () => {
    setActivationModalOpen(true);
  };

  const openWithdrawModal = (source: string, amount: number) => {
    setWithdrawSource(source);
    setWithdrawAmount(amount);
    setWithdrawModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !stats) {
    console.error("Dashboard data error:", error);
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load dashboard data.{" "}
            {error?.message || "Please try again later."}
            <br />
            <div className="mt-2 space-x-2">
              <button
                onClick={() => refetchStats()}
                className="text-sm underline hover:no-underline"
              >
                Retry
              </button>
              <button
                onClick={() => window.location.reload()}
                className="text-sm underline hover:no-underline"
              >
                Refresh page
              </button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <MobileNav
        showMobileMenu={showMobileMenu}
        setShowMobileMenu={setShowMobileMenu}
      />

      <div className="flex h-screen overflow-hidden">
        {/* Sidebar for larger screens */}
        <Sidebar />

        {/* Main content */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Main content area */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-16 lg:pb-8">
            {/* Welcome/Status Card */}
            <div className="mb-6 bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Welcome, {user?.fullName || user?.username}
                  </h2>
                  <p className="text-gray-500 mt-1">
                    {user?.isActivated
                      ? "Your account is activated"
                      : "Your account is not activated yet"}
                  </p>
                </div>
                <div className="mt-4 sm:mt-0">
                  {!user?.isActivated ? (
                    <button
                      onClick={openActivationModal}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    >
                      <i className="ri-rocket-line mr-2"></i> Activate Account
                    </button>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      <i className="ri-check-line mr-1"></i> Account Active
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Account Cards */}
            <AccountCard
              stats={stats}
              isActivated={user?.isActivated || false}
              onWithdraw={openWithdrawModal}
            />

            {/* Referral Section */}
            <ReferralSection
              isActivated={user?.isActivated || false}
              stats={stats}
              onActivate={openActivationModal}
            />

            {/* Analytics Section */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Earnings Analytics
              </h3>
              <div className="h-[250px] w-full">
                <AnalyticsChart stats={stats} />
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Activation Modal */}
      <ActivationModal
        isOpen={activationModalOpen}
        onClose={() => setActivationModalOpen(false)}
      />

      {/* Withdraw Modal */}
      <WithdrawModal
        isOpen={withdrawModalOpen}
        onClose={() => setWithdrawModalOpen(false)}
        source={withdrawSource}
        amount={withdrawAmount}
      />
    </div>
  );
}
