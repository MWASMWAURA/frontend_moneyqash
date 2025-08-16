import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { UserStats } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import Sidebar from "@/components/ui/sidebar";
import MobileNav from "@/components/ui/mobile-nav";
import WithdrawModal from "@/components/withdraw-modal";
import ActivationModal from "@/components/activation-modal";
import TasksContainer from "@/components/tasks/tasks-container";
import { Loader2, TrendingUp, Wallet } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function TasksPage() {
  const { user } = useAuth();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [activationModalOpen, setActivationModalOpen] = useState(false);
  const [withdrawSource, setWithdrawSource] = useState<string>("");
  const [withdrawAmount, setWithdrawAmount] = useState<number>(0);

  const openActivationModal = () => {
    setActivationModalOpen(true);
  };

  const fetchWithCredentials = (url: string) =>
    fetch(url, { credentials: "include" }).then((res) => {
      if (!res.ok) throw new Error("Network response was not ok");
      return res.json();
    });

  const { data: stats, isLoading } = useQuery<UserStats>({
    queryKey: ["/api/user/stats"],
    queryFn: () => fetchWithCredentials("/api/user/stats"),
  });

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

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load tasks data. Please try again later.
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
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-16 lg:pb-8 relative">
            {!user?.isActivated && (
              <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 mb-4">
                    <i className="ri-lock-line text-3xl text-orange-500"></i>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Activate Your Account
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Please visit the Dashboard page to activate your account and
                    start earning.
                  </p>
                  <button
                    onClick={() => (window.location.href = "/")}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    <i className="ri-rocket-line mr-2"></i> Go to Dashboard
                  </button>
                </div>
              </div>
            )}
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <h1 className="text-2xl font-bold">Video Tasks</h1>

                {/* Enhanced Earnings Display */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="text-center">
                    <span className="block text-xs text-gray-500">YouTube</span>
                    <span className="block font-bold text-red-600">
                      {stats.taskEarnings.youtube} Sh
                    </span>
                    <span className="block text-xs text-gray-400">
                      Available: {stats.taskBalances?.youtube || 0} Sh
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="block text-xs text-gray-500">TikTok</span>
                    <span className="block font-bold text-pink-600">
                      {stats.taskEarnings.tiktok} Sh
                    </span>
                    <span className="block text-xs text-gray-400">
                      Available: {stats.taskBalances?.tiktok || 0} Sh
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="block text-xs text-gray-500">
                      Instagram
                    </span>
                    <span className="block font-bold text-purple-600">
                      {stats.taskEarnings.instagram} Sh
                    </span>
                    <span className="block text-xs text-gray-400">
                      Available: {stats.taskBalances?.instagram || 0} Sh
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="block text-xs text-gray-500">Ads</span>
                    <span className="block font-bold text-blue-600">
                      {stats.taskEarnings.ads} Sh
                    </span>
                    <span className="block text-xs text-gray-400">
                      Available: {stats.taskBalances?.ads || 0} Sh
                    </span>
                  </div>
                </div>
              </div>

              {/* Task Balances Overview Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Wallet className="h-5 w-5 mr-2 text-green-600" />
                    Task Earnings Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* YouTube Card */}
                    <div className="bg-red-50 border border-red-100 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <i className="ri-youtube-line text-red-500 mr-2"></i>
                          <span className="font-medium text-red-900">
                            YouTube
                          </span>
                        </div>
                        <TrendingUp className="h-4 w-4 text-red-500" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-sm text-red-600">
                            Total Earned:
                          </span>
                          <span className="text-sm font-semibold text-red-900">
                            {stats.taskEarnings.youtube} Sh
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-red-600">
                            Available:
                          </span>
                          <span className="text-sm font-semibold text-red-900">
                            {stats.taskBalances?.youtube || 0} Sh
                          </span>
                        </div>
                      </div>
                      {(stats.taskBalances?.youtube || 0) >= 600 && (
                        <Button
                          onClick={() =>
                            openWithdrawModal(
                              "youtube",
                              stats.taskBalances?.youtube || 0
                            )
                          }
                          className="w-full mt-3 bg-red-600 hover:bg-red-700 text-xs py-1"
                          size="sm"
                        >
                          Withdraw
                        </Button>
                      )}
                    </div>

                    {/* TikTok Card */}
                    <div className="bg-pink-50 border border-pink-100 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <i className="ri-tiktok-line text-pink-500 mr-2"></i>
                          <span className="font-medium text-pink-900">
                            TikTok
                          </span>
                        </div>
                        <TrendingUp className="h-4 w-4 text-pink-500" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-sm text-pink-600">
                            Total Earned:
                          </span>
                          <span className="text-sm font-semibold text-pink-900">
                            {stats.taskEarnings.tiktok} Sh
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-pink-600">
                            Available:
                          </span>
                          <span className="text-sm font-semibold text-pink-900">
                            {stats.taskBalances?.tiktok || 0} Sh
                          </span>
                        </div>
                      </div>
                      {(stats.taskBalances?.tiktok || 0) >= 600 && (
                        <Button
                          onClick={() =>
                            openWithdrawModal(
                              "tiktok",
                              stats.taskBalances?.tiktok || 0
                            )
                          }
                          className="w-full mt-3 bg-pink-600 hover:bg-pink-700 text-xs py-1"
                          size="sm"
                        >
                          Withdraw
                        </Button>
                      )}
                    </div>

                    {/* Instagram Card */}
                    <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <i className="ri-instagram-line text-purple-500 mr-2"></i>
                          <span className="font-medium text-purple-900">
                            Instagram
                          </span>
                        </div>
                        <TrendingUp className="h-4 w-4 text-purple-500" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-sm text-purple-600">
                            Total Earned:
                          </span>
                          <span className="text-sm font-semibold text-purple-900">
                            {stats.taskEarnings.instagram} Sh
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-purple-600">
                            Available:
                          </span>
                          <span className="text-sm font-semibold text-purple-900">
                            {stats.taskBalances?.instagram || 0} Sh
                          </span>
                        </div>
                      </div>
                      {(stats.taskBalances?.instagram || 0) >= 600 && (
                        <Button
                          onClick={() =>
                            openWithdrawModal(
                              "instagram",
                              stats.taskBalances?.instagram || 0
                            )
                          }
                          className="w-full mt-3 bg-purple-600 hover:bg-purple-700 text-xs py-1"
                          size="sm"
                        >
                          Withdraw
                        </Button>
                      )}
                    </div>

                    {/* Ads Card */}
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <i className="ri-advertisement-line text-blue-500 mr-2"></i>
                          <span className="font-medium text-blue-900">
                            Video Ads
                          </span>
                        </div>
                        <TrendingUp className="h-4 w-4 text-blue-500" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-sm text-blue-600">
                            Total Earned:
                          </span>
                          <span className="text-sm font-semibold text-blue-900">
                            {stats.taskEarnings.ads} Sh
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-blue-600">
                            Available:
                          </span>
                          <span className="text-sm font-semibold text-blue-900">
                            {stats.taskBalances?.ads || 0} Sh
                          </span>
                        </div>
                      </div>
                      {(stats.taskBalances?.ads || 0) >= 600 && (
                        <Button
                          onClick={() =>
                            openWithdrawModal(
                              "ad",
                              stats.taskBalances?.ads || 0
                            )
                          }
                          className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-xs py-1"
                          size="sm"
                        >
                          Withdraw
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Withdrawal Notice */}
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <i className="ri-information-line mr-1"></i>
                      Minimum withdrawal: 600 Sh • Withdrawal fee: 50 Sh
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Tasks Container */}
              <Card>
                <CardHeader>
                  <CardTitle>Complete Tasks to Earn</CardTitle>
                </CardHeader>
                <CardContent className="p-4 md:p-6">
                  <p className="text-gray-500 mb-6">
                    Watch content from different platforms to earn rewards. You
                    can watch up to 2 videos per platform each week. Each video
                    requires watching for at least 10 seconds to earn rewards.
                  </p>

                  <TasksContainer />
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>

      {/* Modals */}
      <WithdrawModal
        isOpen={withdrawModalOpen}
        onClose={() => setWithdrawModalOpen(false)}
        source={withdrawSource}
        amount={withdrawAmount}
      />
      <ActivationModal
        isOpen={activationModalOpen}
        onClose={() => setActivationModalOpen(false)}
      />
    </div>
  );
}
