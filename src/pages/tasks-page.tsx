import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { UserStats, Task, AvailableTask } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

// Extended task type for UI with optional disabled properties
type ExtendedTask = (AvailableTask | Task) & {
  disabled?: boolean;
  disabledReason?: string;
};
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Sidebar from "@/components/ui/sidebar";
import MobileNav from "@/components/ui/mobile-nav";
import WithdrawModal from "@/components/withdraw-modal";
import TasksContainer from "@/components/tasks/tasks-container";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { endpoints } from "@/lib/api";
import { apiRequest } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";

export default function TasksPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [withdrawSource, setWithdrawSource] = useState<string>("");
  const [withdrawAmount, setWithdrawAmount] = useState<number>(0);
  const [activeTab, setActiveTab] = useState("ads");
  const [playingVideo, setPlayingVideo] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [contentCompleted, setContentCompleted] = useState<
    Record<number, boolean>
  >({});
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchWithCredentials = (url: string) =>
    fetch(url, { credentials: "include" }).then((res) => {
      if (!res.ok) throw new Error("Network response was not ok");
      return res.json();
    });

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

  // Get available tasks
  const {
    data: availableTasks,
    isLoading: availableTasksLoading,
    error: availableTasksError,
  } = useQuery<AvailableTask[]>({
    queryKey: ["/api/available-tasks"],
    queryFn: () => fetchWithCredentials("/api/available-tasks"),
    retry: 3,
    staleTime: 60000, // Cache for 1 minute instead of 0
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Get user tasks
  const {
    data: userTasks,
    isLoading: userTasksLoading,
    error: userTasksError,
  } = useQuery<Task[]>({
    queryKey: ["/api/user/tasks", user?.id], // Include user ID in cache key
    queryFn: () => fetchWithCredentials("/api/user/tasks"),
    retry: 3,
    staleTime: 30000, // Cache for 30 seconds instead of 0
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Check if user is new (has no completed tasks)
  const isNewUser =
    !userTasks ||
    userTasks.length === 0 ||
    userTasks.every((task) => !task.completed);

  const isLoading = statsLoading || availableTasksLoading || userTasksLoading;
  const tasksError = statsError || availableTasksError || userTasksError;
  const hasError = tasksError !== undefined;

  const completeTaskMutation = useMutation({
    mutationFn: async (taskId: number) => {
      const res = await apiRequest("POST", `/api/tasks/${taskId}/complete`, {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      toast({
        title: "Task completed!",
        description: "You have earned a reward for completing this task.",
      });
      setContentCompleted({
        ...contentCompleted,
        [playingVideo as number]: true,
      });
      setPlayingVideo(null);
      setCountdown(0);
    },
    onError: (error) => {
      toast({
        title: "Failed to complete task",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const openWithdrawModal = (source: string, amount?: number) => {
    // Use task balance if amount not provided
    const withdrawableAmount = amount || getTaskBalanceByType(source);
    setWithdrawSource(source);
    setWithdrawAmount(withdrawableAmount);
    setWithdrawModalOpen(true);
  };

  useEffect(() => {
    // Clean up timer on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (playingVideo !== null && countdown > 0) {
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [playingVideo, countdown]);

  const startVideoTimer = (taskId: number) => {
    setPlayingVideo(taskId);
    setCountdown(10); // 10 seconds countdown
  };

  const handleVideoEnded = () => {
    if (playingVideo !== null && countdown === 0) {
      completeTaskMutation.mutate(playingVideo);
    }
  };

  const filterTasksByType = (type: string): ExtendedTask[] => {
    if (!availableTasks || !userTasks) return [];

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const weeklyLimit = 2;

    // Get available tasks of this type
    const available = availableTasks.filter((task) => task.type === type);

    // Get user's completed tasks of this type
    const completed = userTasks.filter(
      (task) => task.type === type && task.completed
    );

    // For new users, show all available tasks - no restrictions
    if (isNewUser) {
      console.log(
        `[DEBUG] New user detected, showing ${available.length} available tasks of type: ${type}`
      );
      return available;
    }

    // Find tasks completed this week (for weekly limit check)
    const completedThisWeek = completed.filter((task) => {
      if (!task.completedAt) return false;
      const completedDate = new Date(task.completedAt);
      return completedDate >= weekAgo;
    });

    // Find tasks in cooldown period (completed within 2 weeks)
    const tasksInCooldown = completed.filter((task) => {
      if (!task.completedAt) return false;
      const completedDate = new Date(task.completedAt);
      return completedDate >= twoWeeksAgo;
    });

    // Get tasks that are NOT in cooldown (available to watch again)
    const availableTasksNotInCooldown = available.filter((availableTask) => {
      return !tasksInCooldown.some(
        (completedTask) => completedTask.availableTaskId === availableTask.id
      );
    });

    // If weekly limit reached, show only completed tasks and tasks not in cooldown
    if (completedThisWeek.length >= weeklyLimit) {
      // User can still see tasks but can't complete new ones this week
      const disabledTasks: ExtendedTask[] = availableTasksNotInCooldown.map(
        (task) => ({
          ...task,
          disabled: true,
          disabledReason: `Weekly limit reached (${weeklyLimit} tasks per week)`,
        })
      );

      return [...completed, ...disabledTasks];
    }

    // Show available tasks (not in cooldown) + completed tasks
    return [...availableTasksNotInCooldown, ...completed];
  };

  const getEarningsByType = (type: string): number => {
    if (!stats) return 0;

    switch (type) {
      case "ad":
        return stats.taskEarnings.ads;
      case "tiktok":
        return stats.taskEarnings.tiktok;
      case "youtube":
        return stats.taskEarnings.youtube;
      case "instagram":
        return stats.taskEarnings.instagram;
      default:
        return 0;
    }
  };

  // New function to get task balances (withdrawable amounts)
  const getTaskBalanceByType = (type: string): number => {
    if (!stats?.taskBalances) return 0;

    switch (type) {
      case "ad":
        return stats.taskBalances.ads;
      case "tiktok":
        return stats.taskBalances.tiktok;
      case "youtube":
        return stats.taskBalances.youtube;
      case "instagram":
        return stats.taskBalances.instagram;
      default:
        return 0;
    }
  };

  const getTabTitle = (type: string): string => {
    switch (type) {
      case "ads":
        return "Watch Ads";
      case "tiktok":
        return "TikTok";
      case "youtube":
        return "YouTube";
      case "instagram":
        return "Instagram";
      default:
        return type;
    }
  };

  // YouTube and TikTok video IDs for embedding
  const videoSources: Record<string, string[]> = {
    tiktok: [
      "https://www.tiktok.com/embed/7118919736255810822",
      "https://www.tiktok.com/embed/7156867532731331866",
    ],
    youtube: [
      "https://www.youtube.com/embed/jNQXAC9IVRw",
      "https://www.youtube.com/embed/dQw4w9WgXcQ",
    ],
    instagram: [
      "https://www.instagram.com/p/CukvDC5MMcA/embed",
      "https://www.instagram.com/p/CvjsYYSMB2Y/embed",
    ],
    ad: ["/videos/ad1.mp4", "/videos/ad2.mp4"],
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {tasksError instanceof Error
              ? tasksError.message
              : "Failed to load tasks data. Please try again later."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!stats || !availableTasks) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertTitle>No Tasks Available</AlertTitle>
          <AlertDescription>
            No tasks are currently available. Please check back later.
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
            <div className="space-y-6">
              <h1 className="text-2xl font-bold">Tasks</h1>

              {/* Debug Info - Remove in production */}
              {process.env.NODE_ENV === "development" && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm">
                  <strong>Debug Info:</strong>
                  <br />
                  Is New User: {isNewUser.toString()}
                  <br />
                  User Tasks Count: {userTasks?.length || 0}
                  <br />
                  Available Tasks Count: {availableTasks?.length || 0}
                  <br />
                  User ID: {user?.id}
                  <br />
                  Stats Loaded: {stats ? "Yes" : "No"}
                </div>
              )}

              {/* Enhanced Task Earnings Summary
              {stats && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <i className="ri-wallet-3-line mr-2 text-green-600"></i>
                      Task Earnings Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <i className="ri-advertisement-line text-blue-500 text-2xl mb-2"></i>
                        <p className="text-sm text-gray-600">Video Ads</p>
                        <p className="font-bold text-blue-700">
                          {stats.taskEarnings.ads} Sh
                        </p>
                        <p className="text-xs text-green-600">
                          Available: {stats.taskBalances?.ads || 0} Sh
                        </p>
                      </div>
                      <div className="text-center p-3 bg-red-50 rounded-lg">
                        <i className="ri-youtube-line text-red-500 text-2xl mb-2"></i>
                        <p className="text-sm text-gray-600">YouTube</p>
                        <p className="font-bold text-red-700">
                          {stats.taskEarnings.youtube} Sh
                        </p>
                        <p className="text-xs text-green-600">
                          Available: {stats.taskBalances?.youtube || 0} Sh
                        </p>
                      </div>
                      <div className="text-center p-3 bg-pink-50 rounded-lg">
                        <i className="ri-tiktok-line text-pink-500 text-2xl mb-2"></i>
                        <p className="text-sm text-gray-600">TikTok</p>
                        <p className="font-bold text-pink-700">
                          {stats.taskEarnings.tiktok} Sh
                        </p>
                        <p className="text-xs text-green-600">
                          Available: {stats.taskBalances?.tiktok || 0} Sh
                        </p>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <i className="ri-instagram-line text-purple-500 text-2xl mb-2"></i>
                        <p className="text-sm text-gray-600">Instagram</p>
                        <p className="font-bold text-purple-700">
                          {stats.taskEarnings.instagram} Sh
                        </p>
                        <p className="text-xs text-green-600">
                          Available: {stats.taskBalances?.instagram || 0} Sh
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )} */}

              <Card>
                <CardHeader>
                  <CardTitle>Complete Tasks to Earn</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500 mb-4">
                    Watch content from different platforms to earn rewards. You
                    can watch up to 2 videos per platform each week.
                  </p>

                  <Tabs
                    defaultValue="ads"
                    onValueChange={setActiveTab}
                    className="w-full"
                  >
                    <div className="border-b border-gray-200">
                      <TabsList className="w-full justify-start">
                        <TabsTrigger value="ads" className="w-1/4 py-4">
                          <i className="ri-advertisement-line mr-1"></i>
                          <span className="hidden sm:inline">Watch Ads</span>
                          <span className="inline sm:hidden">Ads</span>
                        </TabsTrigger>
                        <TabsTrigger value="tiktok" className="w-1/4 py-4">
                          <i className="ri-tiktok-line mr-1"></i>
                          <span className="hidden sm:inline">TikTok</span>
                          <span className="inline sm:hidden">TikTok</span>
                        </TabsTrigger>
                        <TabsTrigger value="youtube" className="w-1/4 py-4">
                          <i className="ri-youtube-line mr-1"></i>
                          <span className="hidden sm:inline">YouTube</span>
                          <span className="inline sm:hidden">YT</span>
                        </TabsTrigger>
                        {/* <TabsTrigger value="instagram" className="w-1/4 py-4">
                          <i className="ri-instagram-line mr-1"></i>
                          <span className="hidden sm:inline">Instagram</span>
                          <span className="inline sm:hidden">IG</span>
                        </TabsTrigger> */}
                      </TabsList>
                    </div>

                    {/* Ads Tab */}
                    <TabsContent value="ads" className="p-4">
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">
                            Watch Ads
                          </h4>
                          <p className="text-sm text-gray-500">
                            Earn KSh 10 per ad watched
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="space-y-1">
                            <div>
                              <p className="text-xs font-medium text-gray-500">
                                Total Earnings
                              </p>
                              <p className="text-sm font-bold text-blue-600">
                                KSh {getEarningsByType("ad")}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-500">
                                Available Balance
                              </p>
                              <p className="text-lg font-bold text-green-600">
                                KSh {getTaskBalanceByType("ad")}
                              </p>
                            </div>
                            {getTaskBalanceByType("ad") >= 600 && (
                              <Button
                                onClick={() => openWithdrawModal("ad")}
                                className="text-xs py-1 px-2 bg-blue-600 hover:bg-blue-700"
                                size="sm"
                              >
                                Withdraw
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {filterTasksByType("ad").map((task, index) => (
                          <Card key={task.id} className="overflow-hidden">
                            <div className="relative">
                              {playingVideo === task.id ? (
                                <>
                                  <video
                                    ref={videoRef}
                                    className="w-full h-60 object-cover"
                                    autoPlay
                                    controls={false}
                                    onEnded={handleVideoEnded}
                                    src={
                                      videoSources.ad[
                                        index % videoSources.ad.length
                                      ]
                                    }
                                  />
                                  {countdown > 0 && (
                                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white">
                                      <p className="text-lg font-bold mb-2">
                                        Watch for {countdown} seconds
                                      </p>
                                      <Progress
                                        value={(10 - countdown) * 10}
                                        className="w-1/2 mb-2"
                                      />
                                      <p className="text-sm">to earn KSh 10</p>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div className="bg-gray-100 w-full h-60 flex items-center justify-center">
                                  <i className="ri-advertisement-line text-6xl text-gray-300"></i>
                                </div>
                              )}
                            </div>
                            <CardContent className="p-4">
                              <h5 className="font-medium mb-1">
                                {task.description}
                              </h5>
                              <p className="text-sm text-gray-500 mb-3">
                                {task.duration} • KSh {task.reward} reward
                              </p>

                              {(task as ExtendedTask).disabled ? (
                                <div className="w-full">
                                  <Button disabled className="w-full">
                                    <i className="ri-lock-line mr-1"></i>
                                    Weekly Limit Reached
                                  </Button>
                                  <p className="text-xs text-orange-600 mt-1 text-center">
                                    {(task as ExtendedTask).disabledReason}
                                  </p>
                                </div>
                              ) : contentCompleted[task.id] ? (
                                <Button disabled className="w-full">
                                  <i className="ri-check-line mr-1"></i>{" "}
                                  Completed
                                </Button>
                              ) : playingVideo === task.id ? (
                                <Button
                                  disabled={countdown > 0}
                                  className="w-full"
                                  onClick={handleVideoEnded}
                                >
                                  {countdown > 0 ? (
                                    <>Watching ({countdown}s)</>
                                  ) : (
                                    <>Claim Reward</>
                                  )}
                                </Button>
                              ) : (
                                <Button
                                  onClick={() => startVideoTimer(task.id)}
                                  disabled={playingVideo !== null}
                                  className="w-full"
                                >
                                  <i className="ri-play-circle-line mr-1"></i>{" "}
                                  Watch Now
                                </Button>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      <div className="text-center mt-6">
                        <Button
                          onClick={() => openWithdrawModal("ad")}
                          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          disabled={getTaskBalanceByType("ad") < 600}
                        >
                          <i className="ri-bank-card-line mr-2"></i>
                          Withdraw Ad Balance (KSh {getTaskBalanceByType("ad")})
                        </Button>
                        {getTaskBalanceByType("ad") < 600 && (
                          <p className="text-xs text-orange-600 mt-2">
                            <i className="ri-information-line"></i> Minimum
                            withdrawal amount: KSh 600. Available: KSh{" "}
                            {getTaskBalanceByType("ad")}
                          </p>
                        )}
                      </div>
                    </TabsContent>

                    {/* TikTok Tab */}
                    <TabsContent value="tiktok" className="p-4">
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">
                            TikTok Videos
                          </h4>
                          <p className="text-sm text-gray-500">
                            Earn KSh 15 per video watched
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="space-y-1">
                            <div>
                              <p className="text-xs font-medium text-gray-500">
                                Total Earnings
                              </p>
                              <p className="text-sm font-bold text-pink-600">
                                KSh {getEarningsByType("tiktok")}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-500">
                                Available Balance
                              </p>
                              <p className="text-lg font-bold text-green-600">
                                KSh {getTaskBalanceByType("tiktok")}
                              </p>
                            </div>
                            {getTaskBalanceByType("tiktok") >= 600 && (
                              <Button
                                onClick={() => openWithdrawModal("tiktok")}
                                className="text-xs py-1 px-2 bg-pink-600 hover:bg-pink-700"
                                size="sm"
                              >
                                Withdraw
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {filterTasksByType("tiktok").map((task, index) => (
                          <Card key={task.id} className="overflow-hidden">
                            <div className="relative h-96">
                              {playingVideo === task.id ? (
                                <>
                                  <iframe
                                    className="w-full h-full"
                                    src={
                                      videoSources.tiktok[
                                        index % videoSources.tiktok.length
                                      ]
                                    }
                                    allowFullScreen
                                  ></iframe>
                                  {countdown > 0 && (
                                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white">
                                      <p className="text-lg font-bold mb-2">
                                        Watch for {countdown} seconds
                                      </p>
                                      <Progress
                                        value={(10 - countdown) * 10}
                                        className="w-1/2 mb-2"
                                      />
                                      <p className="text-sm">to earn KSh 5</p>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div className="bg-gray-100 w-full h-full flex items-center justify-center">
                                  <i className="ri-tiktok-line text-6xl text-gray-300"></i>
                                </div>
                              )}
                            </div>
                            <CardContent className="p-4">
                              <h5 className="font-medium mb-1">
                                {task.description}
                              </h5>
                              <p className="text-sm text-gray-500 mb-3">
                                {task.duration} • KSh {task.reward} reward
                              </p>

                              {(task as ExtendedTask).disabled ? (
                                <div className="w-full">
                                  <Button disabled className="w-full">
                                    <i className="ri-lock-line mr-1"></i>
                                    Weekly Limit Reached
                                  </Button>
                                  <p className="text-xs text-orange-600 mt-1 text-center">
                                    {(task as ExtendedTask).disabledReason}
                                  </p>
                                </div>
                              ) : contentCompleted[task.id] ? (
                                <Button disabled className="w-full">
                                  <i className="ri-check-line mr-1"></i>{" "}
                                  Completed
                                </Button>
                              ) : playingVideo === task.id ? (
                                <Button
                                  disabled={countdown > 0}
                                  className="w-full"
                                  onClick={handleVideoEnded}
                                >
                                  {countdown > 0 ? (
                                    <>Watching ({countdown}s)</>
                                  ) : (
                                    <>Claim Reward</>
                                  )}
                                </Button>
                              ) : (
                                <Button
                                  onClick={() => startVideoTimer(task.id)}
                                  disabled={playingVideo !== null}
                                  className="w-full bg-black hover:bg-gray-800"
                                >
                                  <i className="ri-tiktok-line mr-1"></i> Watch
                                  Now
                                </Button>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      <div className="text-center mt-6">
                        <Button
                          onClick={() => openWithdrawModal("tiktok")}
                          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          disabled={getTaskBalanceByType("tiktok") < 600}
                        >
                          <i className="ri-bank-card-line mr-2"></i>
                          Withdraw TikTok Balance (KSh{" "}
                          {getTaskBalanceByType("tiktok")})
                        </Button>
                        {getTaskBalanceByType("tiktok") < 600 && (
                          <p className="text-xs text-orange-600 mt-2">
                            <i className="ri-information-line"></i> Minimum
                            withdrawal amount: KSh 600. Available: KSh{" "}
                            {getTaskBalanceByType("tiktok")}
                          </p>
                        )}
                      </div>
                    </TabsContent>

                    {/* YouTube Tab */}
                    <TabsContent value="youtube" className="p-4">
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">
                            YouTube Videos
                          </h4>
                          <p className="text-sm text-gray-500">
                            Earn KSh 20 per video watched
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="space-y-1">
                            <div>
                              <p className="text-xs font-medium text-gray-500">
                                Total Earnings
                              </p>
                              <p className="text-sm font-bold text-red-600">
                                KSh {getEarningsByType("youtube")}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-500">
                                Available Balance
                              </p>
                              <p className="text-lg font-bold text-green-600">
                                KSh {getTaskBalanceByType("youtube")}
                              </p>
                            </div>
                            {getTaskBalanceByType("youtube") >= 600 && (
                              <Button
                                onClick={() => openWithdrawModal("youtube")}
                                className="text-xs py-1 px-2 bg-red-600 hover:bg-red-700"
                                size="sm"
                              >
                                Withdraw
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {filterTasksByType("youtube").map((task, index) => (
                          <Card key={task.id} className="overflow-hidden">
                            <div className="relative">
                              {playingVideo === task.id ? (
                                <>
                                  <iframe
                                    className="w-full h-60"
                                    src={`${
                                      videoSources.youtube[
                                        index % videoSources.youtube.length
                                      ]
                                    }?autoplay=1`}
                                    allowFullScreen
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  ></iframe>
                                  {countdown > 0 && (
                                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white">
                                      <p className="text-lg font-bold mb-2">
                                        Watch for {countdown} seconds
                                      </p>
                                      <Progress
                                        value={(10 - countdown) * 10}
                                        className="w-1/2 mb-2"
                                      />
                                      <p className="text-sm">to earn KSh 15</p>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div className="bg-gray-100 w-full h-60 flex items-center justify-center">
                                  <i className="ri-youtube-line text-6xl text-gray-300"></i>
                                </div>
                              )}
                            </div>
                            <CardContent className="p-4">
                              <h5 className="font-medium mb-1">
                                {task.description}
                              </h5>
                              <p className="text-sm text-gray-500 mb-3">
                                {task.duration} • KSh {task.reward} reward
                              </p>

                              {(task as ExtendedTask).disabled ? (
                                <div className="w-full">
                                  <Button disabled className="w-full">
                                    <i className="ri-lock-line mr-1"></i>
                                    Weekly Limit Reached
                                  </Button>
                                  <p className="text-xs text-orange-600 mt-1 text-center">
                                    {(task as ExtendedTask).disabledReason}
                                  </p>
                                </div>
                              ) : contentCompleted[task.id] ? (
                                <Button disabled className="w-full">
                                  <i className="ri-check-line mr-1"></i>{" "}
                                  Completed
                                </Button>
                              ) : playingVideo === task.id ? (
                                <Button
                                  disabled={countdown > 0}
                                  className="w-full"
                                  onClick={handleVideoEnded}
                                >
                                  {countdown > 0 ? (
                                    <>Watching ({countdown}s)</>
                                  ) : (
                                    <>Claim Reward</>
                                  )}
                                </Button>
                              ) : (
                                <Button
                                  onClick={() => startVideoTimer(task.id)}
                                  disabled={playingVideo !== null}
                                  className="w-full bg-red-600 hover:bg-red-700"
                                >
                                  <i className="ri-youtube-line mr-1"></i> Watch
                                  Now
                                </Button>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      <div className="text-center mt-6">
                        <Button
                          onClick={() => openWithdrawModal("youtube")}
                          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          disabled={getTaskBalanceByType("youtube") < 600}
                        >
                          <i className="ri-bank-card-line mr-2"></i>
                          Withdraw YouTube Balance (KSh{" "}
                          {getTaskBalanceByType("youtube")})
                        </Button>
                        {getTaskBalanceByType("youtube") < 600 && (
                          <p className="text-xs text-orange-600 mt-2">
                            <i className="ri-information-line"></i> Minimum
                            withdrawal amount: KSh 600. Available: KSh{" "}
                            {getTaskBalanceByType("youtube")}
                          </p>
                        )}
                      </div>
                    </TabsContent>

                    {/* Instagram Tab */}
                    <TabsContent value="instagram" className="p-4">
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">
                            Instagram Content
                          </h4>
                          <p className="text-sm text-gray-500">
                            Earn KSh 12 per content watched
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="space-y-1">
                            <div>
                              <p className="text-xs font-medium text-gray-500">
                                Total Earnings
                              </p>
                              <p className="text-sm font-bold text-purple-600">
                                KSh {getEarningsByType("instagram")}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-500">
                                Available Balance
                              </p>
                              <p className="text-lg font-bold text-green-600">
                                KSh {getTaskBalanceByType("instagram")}
                              </p>
                            </div>
                            {getTaskBalanceByType("instagram") >= 600 && (
                              <Button
                                onClick={() => openWithdrawModal("instagram")}
                                className="text-xs py-1 px-2 bg-purple-600 hover:bg-purple-700"
                                size="sm"
                              >
                                Withdraw
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {filterTasksByType("instagram").map((task, index) => (
                          <Card key={task.id} className="overflow-hidden">
                            <div className="relative h-96">
                              {playingVideo === task.id ? (
                                <>
                                  <iframe
                                    className="w-full h-full"
                                    src={
                                      videoSources.instagram[
                                        index % videoSources.instagram.length
                                      ]
                                    }
                                    allowFullScreen
                                  ></iframe>
                                  {countdown > 0 && (
                                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white">
                                      <p className="text-lg font-bold mb-2">
                                        Watch for {countdown} seconds
                                      </p>
                                      <Progress
                                        value={(10 - countdown) * 10}
                                        className="w-1/2 mb-2"
                                      />
                                      <p className="text-sm">to earn KSh 7</p>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div className="bg-gray-100 w-full h-full flex items-center justify-center">
                                  <i className="ri-instagram-line text-6xl text-gray-300"></i>
                                </div>
                              )}
                            </div>
                            <CardContent className="p-4">
                              <h5 className="font-medium mb-1">
                                {task.description}
                              </h5>
                              <p className="text-sm text-gray-500 mb-3">
                                {task.duration} • KSh {task.reward} reward
                              </p>

                              {(task as ExtendedTask).disabled ? (
                                <div className="w-full">
                                  <Button disabled className="w-full">
                                    <i className="ri-lock-line mr-1"></i>
                                    Weekly Limit Reached
                                  </Button>
                                  <p className="text-xs text-orange-600 mt-1 text-center">
                                    {(task as ExtendedTask).disabledReason}
                                  </p>
                                </div>
                              ) : contentCompleted[task.id] ? (
                                <Button disabled className="w-full">
                                  <i className="ri-check-line mr-1"></i>{" "}
                                  Completed
                                </Button>
                              ) : playingVideo === task.id ? (
                                <Button
                                  disabled={countdown > 0}
                                  className="w-full"
                                  onClick={handleVideoEnded}
                                >
                                  {countdown > 0 ? (
                                    <>Watching ({countdown}s)</>
                                  ) : (
                                    <>Claim Reward</>
                                  )}
                                </Button>
                              ) : (
                                <Button
                                  onClick={() => startVideoTimer(task.id)}
                                  disabled={playingVideo !== null}
                                  className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600"
                                >
                                  <i className="ri-instagram-line mr-1"></i>{" "}
                                  Watch Now
                                </Button>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      <div className="text-center mt-6">
                        <Button
                          onClick={() => openWithdrawModal("instagram")}
                          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          disabled={getTaskBalanceByType("instagram") < 600}
                        >
                          <i className="ri-bank-card-line mr-2"></i>
                          Withdraw Instagram Balance (KSh{" "}
                          {getTaskBalanceByType("instagram")})
                        </Button>
                        {getTaskBalanceByType("instagram") < 600 && (
                          <p className="text-xs text-orange-600 mt-2">
                            <i className="ri-information-line"></i> Minimum
                            withdrawal amount: KSh 600. Available: KSh{" "}
                            {getTaskBalanceByType("instagram")}
                          </p>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
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
