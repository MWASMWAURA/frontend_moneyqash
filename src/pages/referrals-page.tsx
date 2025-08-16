import { useQuery } from "@tanstack/react-query";
import { UserStats, Referral, User } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import Sidebar from "@/components/ui/sidebar";
import MobileNav from "@/components/ui/mobile-nav";
import { useState } from "react";
import { Loader2, Users, Copy, Check, Share2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import ReferralTree from "@/components/referral-tree";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function ReferralsPage() {
  const { user } = useAuth();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const fetchWithCredentials = (url: string) =>
    fetch(url, { credentials: "include" }).then((res) => {
      if (!res.ok) throw new Error("Network response was not ok");
      return res.json();
    });

  const { data: stats, isLoading: statsLoading } = useQuery<UserStats>({
    queryKey: ["/api/user/stats"],
    queryFn: () => fetchWithCredentials("/api/user/stats"),
  });

  const { data: referrals = [], isLoading: referralsLoading } = useQuery<
    Referral[]
  >({
    queryKey: ["/api/user/referrals"],
    queryFn: () => fetchWithCredentials("/api/user/referrals"),
  });

  const isLoading = statsLoading || referralsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Failed to load stats</div>
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
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h1 className="text-2xl font-bold">Referral Program</h1>
              </div>

              {/* Referral Info Card */}
              <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-none shadow-md">
                <CardHeader>
                  <CardTitle className="text-xl text-gray-800">
                    How It Works
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-3">
                    <div className="flex flex-col items-center text-center p-4 bg-white rounded-lg shadow-sm">
                      <div className="bg-blue-100 p-3 rounded-full mb-3">
                        <Share2 className="h-6 w-6 text-blue-600" />
                      </div>
                      <h3 className="font-medium mb-2">1. Share Your Link</h3>
                      <p className="text-sm text-gray-600">
                        Share your unique referral link with friends and on
                        social media.
                      </p>
                    </div>

                    <div className="flex flex-col items-center text-center p-4 bg-white rounded-lg shadow-sm">
                      <div className="bg-green-100 p-3 rounded-full mb-3">
                        <Users className="h-6 w-6 text-green-600" />
                      </div>
                      <h3 className="font-medium mb-2">2. Friends Join</h3>
                      <p className="text-sm text-gray-600">
                        When they sign up using your link, they become your
                        referrals.
                      </p>
                    </div>

                    <div className="flex flex-col items-center text-center p-4 bg-white rounded-lg shadow-sm">
                      <div className="bg-purple-100 p-3 rounded-full mb-3">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-6 w-6 text-purple-600"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
                          <path d="M12 18V6" />
                        </svg>
                      </div>
                      <h3 className="font-medium mb-2">3. Earn Rewards</h3>
                      <p className="text-sm text-gray-600">
                        Earn 300 Sh for your first referral, and 150 Sh from
                        level 2 referrals.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Enhanced Referral Tree Component */}
              <ReferralTree stats={stats} />

              {/* Referral Link Notice */}
              <Card>
                <CardHeader>
                  <CardTitle>Activate Your Account</CardTitle>
                  <CardDescription>
                    Please visit the Dashboard page to activate your account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
                    <p className="text-blue-800 mb-4">
                      To access your referral link and start earning, please
                      visit the Dashboard page to activate your account for a
                      one-time fee of KSh 500.
                    </p>
                    <Button
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => (window.location.href = "/")}
                    >
                      Go to Dashboard Page
                    </Button>
                  </div>

                  <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-md">
                    <h3 className="text-sm font-medium text-blue-800 mb-2">
                      Earning Structure:
                    </h3>
                    <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
                      <li>
                        First direct referral:{" "}
                        <span className="font-semibold">300 Shillings</span>
                      </li>
                      <li>
                        Level 2 referrals (when your referrals refer others):{" "}
                        <span className="font-semibold">
                          150 Shillings each
                        </span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Referrals List */}
              <Card>
                <CardHeader>
                  <CardTitle>Your Referrals</CardTitle>
                  <CardDescription>
                    People who have signed up using your referral link
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {referrals.length === 0 ? (
                    <div className="text-center py-8 flex flex-col items-center text-gray-500">
                      <div className="bg-gray-100 p-6 rounded-full mb-4">
                        <Users className="w-10 h-10 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-700 mb-2">
                        No Referrals Yet
                      </h3>
                      <p className="max-w-md text-gray-500">
                        You haven't referred anyone yet. Share your referral
                        link with friends and on social media to start earning!
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Username</TableHead>
                            <TableHead>Date Joined</TableHead>
                            <TableHead>Level</TableHead>
                            <TableHead>Activated</TableHead>
                            <TableHead className="text-right">
                              Earnings
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {referrals.map((referral) => (
                            <TableRow key={referral.id}>
                              <TableCell className="font-medium">
                                {referral.referredUsername}
                              </TableCell>
                              <TableCell>
                                {format(
                                  new Date(referral.createdAt),
                                  "MMM dd, yyyy"
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    referral.level === 1
                                      ? "default"
                                      : "secondary"
                                  }
                                >
                                  Level {referral.level}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {referral.isActive ? (
                                  <span className="text-green-600 font-semibold">
                                    Yes
                                  </span>
                                ) : (
                                  <span className="text-gray-500">Not yet</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <span className="font-semibold text-green-600">
                                  {referral.isActive
                                    ? `+${referral.amount} Sh`
                                    : "Pending"}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
