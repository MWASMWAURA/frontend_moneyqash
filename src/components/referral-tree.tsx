import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Referral, UserStats } from "@shared/schema";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  TrendingUp,
  Award,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { format } from "date-fns";

interface ReferralTreeProps {
  stats: UserStats;
}

export default function ReferralTree({ stats }: ReferralTreeProps) {
  const [showDetails, setShowDetails] = useState(false);

  // Fetcher with credentials for authenticated endpoints
  const fetchWithCredentials = (url: string) =>
    fetch(url, { credentials: "include" }).then((res) => {
      if (!res.ok) throw new Error("Network response was not ok");
      return res.json();
    });

  const { data: referrals = [], isLoading } = useQuery<Referral[]>({
    queryKey: ["/api/user/referrals"],
    queryFn: () => fetchWithCredentials("/api/user/referrals"),
  });

  // Group referrals by level
  const directReferrals = referrals.filter((ref) => ref.level === 1);
  const secondaryReferrals = referrals.filter((ref) => ref.level === 2);

  // Calculate earnings by level
  const directEarnings = directReferrals.reduce(
    (sum, ref) => sum + ref.amount,
    0
  );
  const secondaryEarnings = secondaryReferrals.reduce(
    (sum, ref) => sum + ref.amount,
    0
  );

  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2 text-blue-600" />
              Referral Network Overview
            </CardTitle>
            <CardDescription>
              Track your referral network and earnings across levels
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center"
          >
            {showDetails ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            {showDetails ? "Hide Details" : "Show Details"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">
                  Level 1 Referrals
                </p>
                <p className="text-2xl font-bold text-blue-900">
                  {directReferrals.length}
                </p>
                <p className="text-xs text-blue-500">Direct referrals</p>
              </div>
              <div className="bg-blue-100 p-2 rounded-full">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="mt-2 text-sm text-blue-700">
              Earned: <span className="font-semibold">{directEarnings} Sh</span>
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">
                  Level 2 Referrals
                </p>
                <p className="text-2xl font-bold text-purple-900">
                  {secondaryReferrals.length}
                </p>
                <p className="text-xs text-purple-500">From your referrals</p>
              </div>
              <div className="bg-purple-100 p-2 rounded-full">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <div className="mt-2 text-sm text-purple-700">
              Earned:{" "}
              <span className="font-semibold">{secondaryEarnings} Sh</span>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">
                  Total Referral Earnings
                </p>
                <p className="text-2xl font-bold text-green-900">
                  {directEarnings + secondaryEarnings} Sh
                </p>
                <p className="text-xs text-green-500">From all levels</p>
              </div>
              <div className="bg-green-100 p-2 rounded-full">
                <Award className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Detailed View */}
        {showDetails && (
          <div className="space-y-6">
            {/* Level 1 Referrals */}
            {directReferrals.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full mr-2">
                    Level 1
                  </span>
                  Direct Referrals ({directReferrals.length})
                </h4>
                <div className="grid gap-3">
                  {directReferrals.map((referral) => (
                    <div
                      key={referral.id}
                      className="bg-gray-50 p-4 rounded-lg border"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="bg-blue-100 p-2 rounded-full">
                            <Users className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {referral.referredUsername}
                            </p>
                            <p className="text-sm text-gray-500">
                              Joined{" "}
                              {format(
                                new Date(referral.createdAt),
                                "MMM dd, yyyy"
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-2">
                            <Badge
                              variant={
                                referral.isActive ? "default" : "secondary"
                              }
                            >
                              {referral.isActive ? "Active" : "Pending"}
                            </Badge>
                            <span className="text-green-600 font-semibold">
                              +{referral.amount} Sh
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Level 2 Referrals */}
            {secondaryReferrals.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded-full mr-2">
                    Level 2
                  </span>
                  Secondary Referrals ({secondaryReferrals.length})
                </h4>
                <div className="grid gap-3">
                  {secondaryReferrals.map((referral) => (
                    <div
                      key={referral.id}
                      className="bg-gray-50 p-4 rounded-lg border border-dashed"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="bg-purple-100 p-2 rounded-full">
                            <TrendingUp className="h-4 w-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {referral.referredUsername}
                            </p>
                            <p className="text-sm text-gray-500">
                              Referred by your referral •{" "}
                              {format(
                                new Date(referral.createdAt),
                                "MMM dd, yyyy"
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-2">
                            <Badge
                              variant={
                                referral.isActive ? "default" : "secondary"
                              }
                            >
                              {referral.isActive ? "Active" : "Pending"}
                            </Badge>
                            <span className="text-purple-600 font-semibold">
                              +{referral.amount} Sh
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* How It Works Section */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-100">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">
                How Second-Level Referrals Work
              </h4>
              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex items-start space-x-3">
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full flex-shrink-0">
                    1
                  </span>
                  <p>
                    You refer someone (Level 1 referral) - you earn 300 Sh for
                    first, 270 Sh for additional
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded-full flex-shrink-0">
                    2
                  </span>
                  <p>
                    Your referral refers someone else (Level 2 referral) - you
                    earn additional commission
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full flex-shrink-0">
                    3
                  </span>
                  <p>
                    Build a network and earn passive income from multiple levels
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {referrals.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <div className="bg-gray-100 p-6 rounded-full mb-4 mx-auto w-16 h-16 flex items-center justify-center">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              No Referrals Yet
            </h3>
            <p>Start building your network by sharing your referral link!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
