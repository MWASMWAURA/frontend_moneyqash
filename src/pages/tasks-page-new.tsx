import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { UserStats } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import Sidebar from "@/components/ui/sidebar";
import MobileNav from "@/components/ui/mobile-nav";
import WithdrawModal from "@/components/withdraw-modal";
import ActivationModal from "@/components/activation-modal";
import TasksContainer from "@/components/tasks/tasks-container";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

  const { data: stats, isLoading } = useQuery<UserStats>({
    queryKey: ["/api/user/stats"],
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
                    Please visit the Dashboard page to activate your account and start earning.
                  </p>
                  <button
                    onClick={() => window.location.href = '/referrals'}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    <i className="ri-rocket-line mr-2"></i> Go to Referrals
                  </button>
                </div>
              </div>
            )}
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Video Tasks</h1>
                
                <div className="flex space-x-4">
                  <div>
                    <span className="block text-sm text-gray-500">YouTube Earnings</span>
                    <span className="font-bold">{stats.taskEarnings.youtube} Sh</span>
                  </div>
                  <div>
                    <span className="block text-sm text-gray-500">TikTok Earnings</span>
                    <span className="font-bold">{stats.taskEarnings.tiktok} Sh</span>
                  </div>
                  <div>
                    <span className="block text-sm text-gray-500">Instagram Earnings</span>
                    <span className="font-bold">{stats.taskEarnings.instagram} Sh</span>
                  </div>
                  <div>
                    <span className="block text-sm text-gray-500">Ad Earnings</span>
                    <span className="font-bold">{stats.taskEarnings.ads} Sh</span>
                  </div>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Complete Tasks to Earn</CardTitle>
                </CardHeader>
                <CardContent className="p-4 md:p-6">
                  <p className="text-gray-500 mb-6">
                    Watch content from different platforms to earn rewards. You can watch up to 2 videos per platform each week.
                    Each video requires watching for at least 10 seconds to earn rewards.
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