import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

// Fetcher with credentials for authenticated endpoints
const fetchWithCredentials = (url: string) =>
  fetch(url, { credentials: 'include' }).then(res => {
    if (!res.ok) throw new Error('Network response was not ok');
    return res.json();
  });
import { useAuth } from "@/hooks/use-auth";
import Sidebar from "@/components/ui/sidebar";
import MobileNav from "@/components/ui/mobile-nav";
import WithdrawModal from "@/components/withdraw-modal";
import { Loader2, TrendingUp, DollarSign, Clock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserStats, Earning, Withdrawal } from "@shared/schema";
import { format } from "date-fns";
import { endpoints } from "@/lib/api";

export default function EarningsPage() {
  const { user } = useAuth();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [withdrawSource, setWithdrawSource] = useState<string>("");
  const [withdrawAmount, setWithdrawAmount] = useState<number>(0);

  // Handle withdraw modal
  const handleWithdraw = async () => {
    if (!withdrawSource || withdrawAmount <= 0) return;
    try {
      const response = await fetch(endpoints.user.withdraw, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({
          source: withdrawSource,
          amount: withdrawAmount
        })
      });
      if (!response.ok) {
        throw new Error('Withdrawal failed');
      }
      setWithdrawModalOpen(false);
      // Refresh data after successful withdrawal
      window.location.reload();
    } catch (error) {
      console.error('Error withdrawing:', error);
    }
  };

  // Get user stats
  const { data: stats, isLoading: statsLoading } = useQuery<UserStats>({
    queryKey: ["/api/user/stats"],
    queryFn: () => fetchWithCredentials("/api/user/stats"),
  });

  // Get earnings history
  const { data: earnings = [], isLoading: earningsLoading } = useQuery<Earning[]>({
    queryKey: ["/api/user/earnings"],
    queryFn: () => fetchWithCredentials("/api/user/earnings"),
  });

  // Get withdrawals history
  const { data: withdrawals = [], isLoading: withdrawalsLoading } = useQuery<Withdrawal[]>({
    queryKey: ["/api/user/withdrawals"],
    queryFn: () => fetchWithCredentials("/api/user/withdrawals"),
  });

  const isLoading = statsLoading || earningsLoading || withdrawalsLoading;

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load user stats. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Loader2 className="h-8 w-8 animate-spin" />
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
    return format(new Date(date), 'MMM dd, yyyy');
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
                    <CardTitle className="text-2xl">{stats.accountBalance} Sh</CardTitle>
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
                    <CardTitle className="text-2xl">{stats.taskEarnings.ads} Sh</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground flex items-center">
                      <TrendingUp className="h-4 w-4 mr-1 text-blue-500" />
                      Video Ad Rewards
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Social Media Earnings</CardDescription>
                    <CardTitle className="text-2xl">
                      {stats.taskEarnings.tiktok + stats.taskEarnings.youtube + stats.taskEarnings.instagram} Sh
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground flex items-center">
                      <TrendingUp className="h-4 w-4 mr-1 text-purple-500" />
                      TikTok, YouTube, Instagram
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total Profit</CardDescription>
                    <CardTitle className="text-2xl">{stats.totalProfit} Sh</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground flex items-center">
                      <TrendingUp className="h-4 w-4 mr-1 text-green-500" />
                      All Earnings Combined
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Withdrawal Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button 
                  onClick={() => openWithdrawModal("referral", stats.accountBalance)}
                  disabled={stats.accountBalance < 600}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  Withdraw Referral Earnings
                </Button>
                <Button 
                  onClick={() => openWithdrawModal("ad", stats.taskEarnings.ads)}
                  disabled={stats.taskEarnings.ads < 600}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Withdraw Ad Earnings
                </Button>
                <Button 
                  onClick={() => openWithdrawModal("tiktok", stats.taskEarnings.tiktok)}
                  disabled={stats.taskEarnings.tiktok < 600}
                  className="w-full bg-pink-600 hover:bg-pink-700"
                >
                  Withdraw TikTok Earnings
                </Button>
                <Button 
                  onClick={() => openWithdrawModal("youtube", stats.taskEarnings.youtube)}
                  disabled={stats.taskEarnings.youtube < 600}
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  Withdraw YouTube Earnings
                </Button>
              </div>

              {/* Minimum Withdrawal Notice */}
              <Alert>
                <AlertTitle>Withdrawal Information</AlertTitle>
                <AlertDescription>
                  Minimum withdrawal amount is 600 Shillings. A fee of 50 Shillings is charged for each withdrawal.
                </AlertDescription>
              </Alert>

              {/* Tabs for Transaction History */}
              <Tabs defaultValue="earnings" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="earnings">Earnings History</TabsTrigger>
                  <TabsTrigger value="withdrawals">Withdrawals History</TabsTrigger>
                </TabsList>
                
                <TabsContent value="earnings" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Earnings History</CardTitle>
                      <CardDescription>
                        Your complete history of earnings from all sources
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {Array.isArray(earnings) && earnings.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          You haven't earned any money yet. Complete tasks or refer users to earn.
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-3 px-2">Date</th>
                                <th className="text-left py-3 px-2">Source</th>
                                <th className="text-left py-3 px-2">Description</th>
                                <th className="text-right py-3 px-2">Amount</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Array.isArray(earnings) && earnings.map((earning) => (
                                <tr key={earning.id} className="border-b hover:bg-gray-50">
                                  <td className="py-3 px-2">
                                    <div className="flex items-center">
                                      <Clock className="h-4 w-4 mr-2 text-gray-500" />
                                      {formatDate(earning.createdAt)}
                                    </div>
                                  </td>
                                  <td className="py-3 px-2 capitalize">{earning.source}</td>
                                  <td className="py-3 px-2">{earning.description || `Earnings from ${earning.source}`}</td>
                                  <td className="py-3 px-2 text-right font-medium text-green-600">+{earning.amount} Sh</td>
                                </tr>
                              ))}
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
                      <CardTitle>Withdrawals History</CardTitle>
                      <CardDescription>
                        Your complete history of withdrawals to payment methods
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {Array.isArray(withdrawals) && withdrawals.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          You haven't made any withdrawals yet. Accumulate at least 600 Shillings to withdraw.
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-3 px-2">Date</th>
                                <th className="text-left py-3 px-2">Source</th>
                                <th className="text-left py-3 px-2">Method</th>
                                <th className="text-left py-3 px-2">Status</th>
                                <th className="text-right py-3 px-2">Amount</th>
                                <th className="text-right py-3 px-2">Fee</th>
                                <th className="text-right py-3 px-2">Net</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Array.isArray(withdrawals) && withdrawals.map((withdrawal) => (
                                <tr key={withdrawal.id} className="border-b hover:bg-gray-50">
                                  <td className="py-3 px-2">
                                    <div className="flex items-center">
                                      <Clock className="h-4 w-4 mr-2 text-gray-500" />
                                      {formatDate(withdrawal.createdAt)}
                                    </div>
                                  </td>
                                  <td className="py-3 px-2 capitalize">{withdrawal.source}</td>
                                  <td className="py-3 px-2">{withdrawal.paymentMethod}</td>
                                  <td className="py-3 px-2">
                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                      withdrawal.status === 'completed' 
                                        ? 'bg-green-100 text-green-800' 
                                        : withdrawal.status === 'pending'
                                          ? 'bg-yellow-100 text-yellow-800'
                                          : 'bg-red-100 text-red-800'
                                    }`}>
                                      {withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                                    </span>
                                  </td>
                                  <td className="py-3 px-2 text-right">{withdrawal.amount} Sh</td>
                                  <td className="py-3 px-2 text-right text-red-600">-{withdrawal.fee} Sh</td>
                                  <td className="py-3 px-2 text-right font-medium">{withdrawal.amount - withdrawal.fee} Sh</td>
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

      {/* Withdrawal Modal */}
      <WithdrawModal
        isOpen={withdrawModalOpen}
        onClose={() => setWithdrawModalOpen(false)}
        source={withdrawSource}
        amount={withdrawAmount}
      />
    </div>
  );
}