import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { UserStats } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface TaskSectionProps {
  stats: UserStats;
  onWithdraw: (source: string, amount: number) => void;
}

interface Task {
  id: number;
  type: string;
  description: string;
  duration: string;
  reward: number;
}

export default function TaskSection({ stats, onWithdraw }: TaskSectionProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("ads");

  // Add debugging
  useEffect(() => {
    console.log("API Base URL:", import.meta.env.VITE_API_URL);
  }, []);

  const {
    data: availableTasks,
    isLoading,
    error,
  } = useQuery<Task[]>({
    queryKey: ["/api/available-tasks"],
    queryFn: async () => {
      console.log("Fetching available tasks...");
      const res = await apiRequest("GET", "/api/available-tasks", {});
      const data = await res.json();
      console.log("Available tasks:", data);
      return data;
    },
  });

  const completeTaskMutation = useMutation({
    mutationFn: async (taskId: number) => {
      console.log("Completing task:", taskId);
      const res = await apiRequest("POST", `/api/tasks/${taskId}/complete`, {});
      return await res.json();
    },
    onSuccess: (data) => {
      console.log("Task completed successfully:", data);
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      toast({
        title: "Task completed!",
        description: "You have earned a reward for completing this task.",
      });
    },
    onError: (error) => {
      console.error("Task completion error:", error);
      toast({
        title: "Failed to complete task",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Show error if API call fails
  if (error) {
    console.error("API Error:", error);
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 p-6">
        <div className="text-center text-red-600">
          <p>Failed to load tasks</p>
          <p className="text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  const handleCompleteTask = (taskId: number) => {
    completeTaskMutation.mutate(taskId);
  };

  const filterTasksByType = (type: string) => {
    if (!availableTasks) return [];
    return availableTasks.filter((task) => task.type === type);
  };

  const getEarningsByType = (type: string): number => {
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

  const getIconForType = (type: string): string => {
    switch (type) {
      case "ad":
        return "ri-advertisement-line";
      case "tiktok":
        return "ri-tiktok-line";
      case "youtube":
        return "ri-youtube-line";
      case "instagram":
        return "ri-instagram-line";
      default:
        return "ri-question-line";
    }
  };

  const getButtonClassForType = (type: string): string => {
    switch (type) {
      case "tiktok":
        return "bg-[#000000] hover:bg-gray-800 focus:ring-black";
      case "youtube":
        return "bg-[#FF0000] hover:bg-red-700 focus:ring-red-500";
      case "instagram":
        return "bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 focus:ring-purple-500";
      default:
        return "bg-primary hover:bg-primary/90 focus:ring-primary";
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

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
      <Tabs defaultValue="ads" onValueChange={setActiveTab}>
        <div className="border-b border-gray-200">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="ads" className="w-1/3 py-4">
              <i className="ri-advertisement-line mr-1"></i>
              <span className="hidden sm:inline">Watch Ads</span>
              <span className="inline sm:hidden">Ads</span>
            </TabsTrigger>
            <TabsTrigger value="tiktok" className="w-1/3 py-4">
              <i className="ri-tiktok-line mr-1"></i>
              <span className="hidden sm:inline">TikTok</span>
              <span className="inline sm:hidden">TikTok</span>
            </TabsTrigger>
            <TabsTrigger value="youtube" className="w-1/3 py-4">
              <i className="ri-youtube-line mr-1"></i>
              <span className="hidden sm:inline">YouTube</span>
              <span className="inline sm:hidden">YT</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {["ads", "tiktok", "youtube"].map((tabValue) => (
          <TabsContent key={tabValue} value={tabValue} className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-lg font-medium text-gray-900">
                  {getTabTitle(tabValue)}
                </h4>
                <p className="text-sm text-gray-500">
                  Earn KSh{" "}
                  {tabValue === "youtube"
                    ? "15"
                    : tabValue === "ads"
                    ? "10"
                    : tabValue === "instagram"
                    ? "7"
                    : "5"}{" "}
                  per{" "}
                  {tabValue === "ads"
                    ? "ad"
                    : tabValue === "tiktok"
                    ? "video"
                    : tabValue === "youtube"
                    ? "video"
                    : "reel"}{" "}
                  watched
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-500">
                  Your Earnings
                </p>
                <p className="text-lg font-bold text-gray-900">
                  KSh {getEarningsByType(tabValue === "ads" ? "ad" : tabValue)}
                </p>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {filterTasksByType(tabValue === "ads" ? "ad" : tabValue).map(
                  (task) => (
                    <div
                      key={task.id}
                      className="bg-gray-50 rounded-lg p-4 mb-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-medium">{task.description}</h5>
                          <p className="text-sm text-gray-500">
                            {task.duration} • KSh {task.reward} reward
                          </p>
                        </div>
                        <Button
                          onClick={() => handleCompleteTask(task.id)}
                          disabled={completeTaskMutation.isPending}
                          className={`inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${getButtonClassForType(
                            task.type
                          )} focus:outline-none focus:ring-2 focus:ring-offset-2`}
                        >
                          {completeTaskMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                          ) : (
                            <i
                              className={`${
                                task.type === "ad"
                                  ? "ri-play-circle-line"
                                  : getIconForType(task.type)
                              } mr-1`}
                            ></i>
                          )}
                          {task.type === "ad"
                            ? "Watch Now"
                            : `Open ${
                                tabValue.charAt(0).toUpperCase() +
                                tabValue.slice(1)
                              }`}
                        </Button>
                      </div>
                    </div>
                  )
                )}
              </>
            )}

            <div className="text-center">
              <Button
                onClick={() =>
                  onWithdraw(
                    tabValue === "ads" ? "ad" : tabValue,
                    getEarningsByType(tabValue === "ads" ? "ad" : tabValue)
                  )
                }
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                disabled={
                  getEarningsByType(tabValue === "ads" ? "ad" : tabValue) < 600
                }
              >
                <i className="ri-bank-card-line mr-2"></i>
                Withdraw {tabValue.charAt(0).toUpperCase() +
                  tabValue.slice(1)}{" "}
                Earnings
              </Button>
              {getEarningsByType(tabValue === "ads" ? "ad" : tabValue) <
                600 && (
                <p className="text-xs text-orange-600 mt-2">
                  <i className="ri-information-line"></i> Minimum withdrawal
                  amount: KSh 600
                </p>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
