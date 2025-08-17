import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

// Fetcher with credentials for authenticated endpoints
const fetchWithCredentials = (url: string) =>
  fetch(url, {
    credentials: "include",
    cache: "no-store",
    headers: {
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
  }).then((res) => {
    if (!res.ok) throw new Error("Network response was not ok");
    return res.json();
  });
import { useAuth } from "@/hooks/use-auth";
import Sidebar from "@/components/ui/sidebar";
import MobileNav from "@/components/ui/mobile-nav";
import WithdrawModal from "@/components/withdraw-modal";
import { Loader2, TrendingUp, DollarSign, Clock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserStats, Earning, Withdrawal } from "@shared/schema";
import { format } from "date-fns";
import { endpoints } from "@/lib/api";
import EarningsSummary from "@/components/earnings-summary";

export default function EarningsPage() {
  const { user } = useAuth();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [withdrawSource, setWithdrawSource] = useState<string>("");
  const [withdrawAmount, setWithdrawAmount] = useState<number>(0);
  const [earningsFilter, setEarningsFilter] = useState<string>("all");

  // Handle withdraw modal
  const handleWithdraw = async () => {
    if (!withdrawSource || withdrawAmount <= 0) return;
    try {
      const response = await fetch(endpoints.user.withdraw, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify({
          source: withdrawSource,
          amount: withdrawAmount,
          paymentMethod: "M-Pesa", // Default payment method
          phoneNumber: user?.phone || "", // Use user's phone or empty string
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Withdrawal failed");
      }
      setWithdrawModalOpen(false);
      // Refresh data after successful withdrawal
      window.location.reload();
    } catch (error) {
      console.error("Error withdrawing:", error);
    }
  };

  // Get user stats
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
  } = useQuery<UserStats>({
    queryKey: ["/api/user/stats"],
    queryFn: () => fetchWithCredentials("/api/user/stats"),
    retry: 3,
    staleTime: 30000,
  });

  // Get earnings history - Updated to handle new structured response
  const {
    data: earningsData,
    isLoading: earningsLoading,
    error: earningsError,
  } = useQuery<{
    earnings: {
      referral: Earning[];
      ads: Earning[];
      youtube: Earning[];
      tiktok: Earning[];
      instagram: Earning[];
      all: Earning[];
    };
    totals: {
      referral: number;
      ads: number;
      youtube: number;
      tiktok: number;
      instagram: number;
      total: number;
    };
  }>({
    queryKey: ["/api/user/earnings"],
    queryFn: () => fetchWithCredentials("/api/user/earnings"),
    retry: 3,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  const earnings = earningsData?.earnings?.all || [];

  // Get withdrawals history
  const {
    data: withdrawals = [],
    isLoading: withdrawalsLoading,
    error: withdrawalsError,
  } = useQuery<Withdrawal[]>({
    queryKey: ["/api/user/withdrawals"],
    queryFn: () => fetchWithCredentials("/api/user/withdrawals"),
    retry: 3,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  const isLoading = statsLoading || earningsLoading || withdrawalsLoading;
  const hasError = statsError || earningsError || withdrawalsError;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertTitle>Error Loading Data</AlertTitle>
          <AlertDescription>
            {statsError?.message ||
              earningsError?.message ||
              withdrawalsError?.message ||
              "Failed to load earnings data. Please try again later."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertTitle>No Data Available</AlertTitle>
          <AlertDescription>
            Failed to load user stats. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const openWithdrawModal = (source: string, amount: number) => {
    setWithdrawSource(source);
    setWithdrawAmount(amount);
    setWithdrawModalOpen(true);
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return format(new Date(date), "MMM dd, yyyy");
  };

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
            <div className="space-y-6">
              <h1 className="text-2xl font-bold">Earnings & Withdrawals</h1>

              {/* Earnings Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Account Balance</CardDescription>
                    <CardTitle className="text-2xl">
                      {stats.accountBalance} Sh
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground flex items-center">
                      <DollarSign className="h-4 w-4 mr-1 text-green-500" />
                      Referral Earnings
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Ads Earnings</CardDescription>
                    <CardTitle className="text-2xl">
                      {stats.taskBalances?.ads || 0} Sh
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground flex items-center">
                      <TrendingUp className="h-4 w-4 mr-1 text-blue-500" />
                      Available for Withdrawal
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Total Earned: {stats.taskEarnings.ads} Sh
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Social Media Earnings</CardDescription>
                    <CardTitle className="text-2xl">
                      {(stats.taskBalances?.tiktok || 0) +
                        (stats.taskBalances?.youtube || 0) +
                        (stats.taskBalances?.instagram || 0)}{" "}
                      Sh
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground flex items-center">
                      <TrendingUp className="h-4 w-4 mr-1 text-purple-500" />
                      Available for Withdrawal
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Total Earned:{" "}
                      {stats.taskEarnings.tiktok +
                        stats.taskEarnings.youtube +
                        stats.taskEarnings.instagram}{" "}
                      Sh
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total Profit</CardDescription>
                    <CardTitle className="text-2xl">
                      {stats.totalProfit} Sh
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground flex items-center">
                      <TrendingUp className="h-4 w-4 mr-1 text-green-500" />
                      All Earnings Combined
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Withdrawal Buttons - Updated to use taskBalances */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button
                  onClick={() =>
                    openWithdrawModal("referral", stats.accountBalance)
                  }
                  disabled={stats.accountBalance < 600}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  Withdraw Referral Earnings
                  <div className="text-xs opacity-80 mt-1">
                    Available: {stats.accountBalance} Sh
                  </div>
                </Button>
                <Button
                  onClick={() =>
                    openWithdrawModal("ad", stats.taskBalances?.ads || 0)
                  }
                  disabled={(stats.taskBalances?.ads || 0) < 600}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Withdraw Ad Earnings
                  <div className="text-xs opacity-80 mt-1">
                    Available: {stats.taskBalances?.ads || 0} Sh
                  </div>
                </Button>
                <Button
                  onClick={() =>
                    openWithdrawModal("tiktok", stats.taskBalances?.tiktok || 0)
                  }
                  disabled={(stats.taskBalances?.tiktok || 0) < 600}
                  className="w-full bg-pink-600 hover:bg-pink-700"
                >
                  Withdraw TikTok Earnings
                  <div className="text-xs opacity-80 mt-1">
                    Available: {stats.taskBalances?.tiktok || 0} Sh
                  </div>
                </Button>
                <Button
                  onClick={() =>
                    openWithdrawModal(
                      "youtube",
                      stats.taskBalances?.youtube || 0
                    )
                  }
                  disabled={(stats.taskBalances?.youtube || 0) < 600}
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  Withdraw YouTube Earnings
                  <div className="text-xs opacity-80 mt-1">
                    Available: {stats.taskBalances?.youtube || 0} Sh
                  </div>
                </Button>
              </div>

              {/* Minimum Withdrawal Notice */}
              <Alert>
                <AlertTitle>Withdrawal Information</AlertTitle>
                <AlertDescription>
                  Minimum withdrawal amount is 600 Shillings. A fee of 50
                  Shillings is charged for each withdrawal.
                </AlertDescription>
              </Alert>

              {/* Enhanced Earnings Summary */}
              <EarningsSummary
                earnings={earnings}
                earningsData={earningsData}
                stats={stats}
              />

              {/* Tabs for Transaction History */}
              <Tabs defaultValue="earnings" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="earnings">Earnings History</TabsTrigger>
                  <TabsTrigger value="withdrawals">
                    Withdrawals History
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="earnings" className="mt-4">
                  <Card>
                    <CardHeader>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                          <CardTitle>Earnings History</CardTitle>
                          <CardDescription>
                            Your complete history of earnings from all sources
                          </CardDescription>
                        </div>
                        <div className="flex items-center space-x-2">
                          <label className="text-sm font-medium">Filter:</label>
                          <select
                            value={earningsFilter}
                            onChange={(e) => setEarningsFilter(e.target.value)}
                            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                          >
                            <option value="all">All Earnings</option>
                            <option value="referral">Referral Only</option>
                            <option value="tasks">Tasks Only</option>
                            <option value="ads">Ads Only</option>
                            <option value="youtube">YouTube Only</option>
                            <option value="tiktok">TikTok Only</option>
                            <option value="instagram">Instagram Only</option>
                          </select>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {!earnings || earnings.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <div className="bg-gray-100 p-6 rounded-full mb-4 mx-auto w-16 h-16 flex items-center justify-center">
                            <TrendingUp className="w-8 h-8 text-gray-400" />
                          </div>
                          <h3 className="text-lg font-medium text-gray-700 mb-2">
                            No Earnings Yet
                          </h3>
                          <p>
                            You haven't earned any money yet. Complete tasks or
                            refer users to start earning!
                          </p>
                          {/* Debug info */}
                          <div className="mt-4 text-xs text-gray-400 space-y-1">
                            <div>
                              Debug: Earnings length: {earnings?.length || 0}
                            </div>
                            <div>
                              EarningsData:{" "}
                              {earningsData ? "Present" : "Missing"}
                            </div>
                            {earningsData && (
                              <div>
                                All earnings:{" "}
                                {JSON.stringify(
                                  earningsData.earnings?.all?.slice(0, 2) || []
                                )}
                              </div>
                            )}
                            <div>Stats loaded: {stats ? "Yes" : "No"}</div>
                            <div>User: {user?.username || "Not logged in"}</div>
                          </div>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b bg-gray-50">
                                <th className="text-left py-3 px-2 font-semibold">
                                  Date
                                </th>
                                <th className="text-left py-3 px-2 font-semibold">
                                  Source
                                </th>
                                <th className="text-left py-3 px-2 font-semibold">
                                  Description
                                </th>
                                <th className="text-left py-3 px-2 font-semibold">
                                  Type
                                </th>
                                <th className="text-right py-3 px-2 font-semibold">
                                  Amount
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {Array.isArray(earnings) &&
                                earnings
                                  .filter((earning) => {
                                    if (earningsFilter === "all") return true;
                                    if (earningsFilter === "tasks")
                                      return earning.source !== "referral";
                                    if (earningsFilter === "ads")
                                      return earning.source === "ad";
                                    return earning.source === earningsFilter;
                                  })
                                  .map((earning) => {
                                    const isReferral =
                                      earning.source === "referral";
                                    const sourceIcon = isReferral
                                      ? "ri-user-add-line"
                                      : "ri-play-circle-line";
                                    const sourceColor = isReferral
                                      ? "text-purple-600"
                                      : "text-blue-600";
                                    const sourceBadge = isReferral
                                      ? "bg-purple-100 text-purple-800"
                                      : "bg-blue-100 text-blue-800";

                                    return (
                                      <tr
                                        key={earning.id}
                                        className="border-b hover:bg-gray-50"
                                      >
                                        <td className="py-3 px-2">
                                          <div className="flex items-center">
                                            <Clock className="h-4 w-4 mr-2 text-gray-500" />
                                            <span className="text-sm">
                                              {formatDate(earning.createdAt)}
                                            </span>
                                          </div>
                                        </td>
                                        <td className="py-3 px-2">
                                          <div className="flex items-center">
                                            <i
                                              className={`${sourceIcon} ${sourceColor} mr-2`}
                                            ></i>
                                            <span className="capitalize font-medium">
                                              {earning.source === "ad"
                                                ? "Ads"
                                                : earning.source}
                                            </span>
                                          </div>
                                        </td>
                                        <td className="py-3 px-2">
                                          <span className="text-sm text-gray-600">
                                            {earning.description ||
                                              (isReferral
                                                ? "Referral Commission"
                                                : earning.source === "ad"
                                                ? "Advertisement Task Completed"
                                                : `${
                                                    earning.source
                                                      .charAt(0)
                                                      .toUpperCase() +
                                                    earning.source.slice(1)
                                                  } Task Completed`)}
                                          </span>
                                        </td>
                                        <td className="py-3 px-2">
                                          <span
                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${sourceBadge}`}
                                          >
                                            {isReferral ? "Referral" : "Task"}
                                          </span>
                                        </td>
                                        <td className="py-3 px-2 text-right font-semibold text-green-600">
                                          +{earning.amount} Sh
                                        </td>
                                      </tr>
                                    );
                                  })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="withdrawals" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Withdrawal History</CardTitle>
                      <CardDescription>
                        Track all your withdrawal requests and their status
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {withdrawals.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <div className="bg-gray-100 p-6 rounded-full mb-4 mx-auto w-16 h-16 flex items-center justify-center">
                            <DollarSign className="w-8 h-8 text-gray-400" />
                          </div>
                          <h3 className="text-lg font-medium text-gray-700 mb-2">
                            No Withdrawals Yet
                          </h3>
                          <p>
                            You haven't made any withdrawal requests yet. Start
                            earning and withdraw when you reach the minimum
                            amount!
                          </p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b bg-gray-50">
                                <th className="text-left py-3 px-2 font-semibold">
                                  Date
                                </th>
                                <th className="text-left py-3 px-2 font-semibold">
                                  Amount
                                </th>
                                <th className="text-left py-3 px-2 font-semibold">
                                  Source
                                </th>
                                <th className="text-left py-3 px-2 font-semibold">
                                  Status
                                </th>
                                <th className="text-left py-3 px-2 font-semibold">
                                  Phone
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {withdrawals.map((withdrawal: any) => (
                                <tr
                                  key={withdrawal.id}
                                  className="border-b hover:bg-gray-50"
                                >
                                  <td className="py-3 px-2">
                                    <div className="flex items-center">
                                      <Clock className="h-4 w-4 mr-2 text-gray-500" />
                                      <span className="text-sm">
                                        {formatDate(withdrawal.createdAt)}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-3 px-2">
                                    <span className="font-semibold">
                                      {withdrawal.amount} Sh
                                    </span>
                                  </td>
                                  <td className="py-3 px-2">
                                    <span className="capitalize">
                                      {withdrawal.source === "ad"
                                        ? "Ads"
                                        : withdrawal.source}
                                    </span>
                                  </td>
                                  <td className="py-3 px-2">
                                    <span
                                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        withdrawal.status === "completed"
                                          ? "bg-green-100 text-green-800"
                                          : withdrawal.status === "processing"
                                          ? "bg-yellow-100 text-yellow-800"
                                          : withdrawal.status === "failed"
                                          ? "bg-red-100 text-red-800"
                                          : "bg-gray-100 text-gray-800"
                                      }`}
                                    >
                                      {withdrawal.statusDescription ||
                                        withdrawal.status}
                                    </span>
                                  </td>
                                  <td className="py-3 px-2 text-sm text-gray-600">
                                    {withdrawal.phoneNumber}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </div>

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
