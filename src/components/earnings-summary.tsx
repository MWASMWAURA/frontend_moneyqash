import { useMemo } from "react";
import { Earning, UserStats } from "@shared/schema";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { TrendingUp, Users, Play, DollarSign } from "lucide-react";

interface EarningsSummaryProps {
  earnings: Earning[];
  earningsData?: {
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
  };
  stats: UserStats;
}

export default function EarningsSummary({
  earnings,
  earningsData,
  stats,
}: EarningsSummaryProps) {
  // Use backend-calculated totals if available, otherwise calculate manually
  const earningsBreakdown = useMemo(() => {
    if (earningsData?.totals) {
      // Use backend-calculated totals
      return {
        referral: earningsData.totals.referral,
        tasks:
          earningsData.totals.ads +
          earningsData.totals.youtube +
          earningsData.totals.tiktok +
          earningsData.totals.instagram,
        ads: earningsData.totals.ads,
        youtube: earningsData.totals.youtube,
        tiktok: earningsData.totals.tiktok,
        instagram: earningsData.totals.instagram,
        total: earningsData.totals.total,
      };
    }

    // Fallback to manual calculation
    if (!Array.isArray(earnings)) return null;

    const breakdown = {
      referral: 0,
      tasks: 0,
      ads: 0,
      youtube: 0,
      tiktok: 0,
      instagram: 0,
      total: 0,
    };

    earnings.forEach((earning) => {
      const amount = earning.amount || 0;
      breakdown.total += amount;

      if (earning.source === "referral") {
        breakdown.referral += amount;
      } else {
        breakdown.tasks += amount;
        if (earning.source === "ad") breakdown.ads += amount;
        else if (earning.source === "youtube") breakdown.youtube += amount;
        else if (earning.source === "tiktok") breakdown.tiktok += amount;
        else if (earning.source === "instagram") breakdown.instagram += amount;
      }
    });

    return breakdown;
  }, [earnings, earningsData]);

  // Calculate percentages
  const getPercentage = (amount: number, total: number) => {
    return total > 0 ? Math.round((amount / total) * 100) : 0;
  };

  if (!earningsBreakdown) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* Earnings Sources Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
            Earnings Breakdown
          </CardTitle>
          <CardDescription>
            Your earnings distribution across different sources
          </CardDescription>
        </CardHeader>
        <CardContent>
          {earningsBreakdown.total === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <DollarSign className="mx-auto h-12 w-12 text-gray-300 mb-3" />
              <p className="text-sm">No earnings to display yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Referral Earnings */}
              {earningsBreakdown.referral > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-purple-100 p-2 rounded-full">
                      <Users className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        Referral Commissions
                      </p>
                      <p className="text-sm text-gray-500">
                        {getPercentage(
                          earningsBreakdown.referral,
                          earningsBreakdown.total
                        )}
                        % of total earnings
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-purple-600">
                      {earningsBreakdown.referral} Sh
                    </p>
                  </div>
                </div>
              )}

              {/* Task Earnings */}
              {earningsBreakdown.tasks > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <Play className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        Task Completions
                      </p>
                      <p className="text-sm text-gray-500">
                        {getPercentage(
                          earningsBreakdown.tasks,
                          earningsBreakdown.total
                        )}
                        % of total earnings
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-blue-600">
                      {earningsBreakdown.tasks} Sh
                    </p>
                  </div>
                </div>
              )}

              {/* Progress bars for visual representation */}
              <div className="space-y-2 mt-4">
                <div className="relative">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="flex h-2 rounded-full overflow-hidden">
                      {earningsBreakdown.referral > 0 && (
                        <div
                          className="bg-purple-500"
                          style={{
                            width: `${getPercentage(
                              earningsBreakdown.referral,
                              earningsBreakdown.total
                            )}%`,
                          }}
                        ></div>
                      )}
                      {earningsBreakdown.tasks > 0 && (
                        <div
                          className="bg-blue-500"
                          style={{
                            width: `${getPercentage(
                              earningsBreakdown.tasks,
                              earningsBreakdown.total
                            )}%`,
                          }}
                        ></div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>0 Sh</span>
                  <span>{earningsBreakdown.total} Sh</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Task Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Play className="h-5 w-5 mr-2 text-green-600" />
            Task Performance
          </CardTitle>
          <CardDescription>
            Earnings from different types of tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Ad Tasks */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-sm font-medium text-gray-700">
                  Video Ads
                </span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {stats.taskEarnings.ads} Sh
              </span>
            </div>

            {/* YouTube Tasks */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-sm font-medium text-gray-700">
                  YouTube
                </span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {stats.taskEarnings.youtube} Sh
              </span>
            </div>

            {/* TikTok Tasks */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 rounded-full bg-pink-500"></div>
                <span className="text-sm font-medium text-gray-700">
                  TikTok
                </span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {stats.taskEarnings.tiktok} Sh
              </span>
            </div>

            {/* Instagram Tasks
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"></div>
                <span className="text-sm font-medium text-gray-700">
                  Instagram
                </span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {stats.taskEarnings.instagram} Sh
              </span>
            </div> */}

            {/* Total Task Earnings */}
            <div className="border-t pt-3 mt-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">
                  Total Task Earnings
                </span>
                <span className="text-lg font-bold text-green-600">
                  {stats.taskEarnings.ads +
                    stats.taskEarnings.youtube +
                    stats.taskEarnings.tiktok +
                    stats.taskEarnings.instagram}{" "}
                  Sh
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
