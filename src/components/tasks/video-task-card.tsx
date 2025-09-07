import { useState, useRef, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Clock, Check, AlertTriangle, CalendarClock, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { AvailableTask, Task } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow, addDays, isPast, parseISO } from "date-fns";

interface VideoTaskCardProps {
  task: AvailableTask;
  onComplete: () => void;
  maxTasksReached: boolean;
}

export default function VideoTaskCard({
  task,
  onComplete,
  maxTasksReached,
}: VideoTaskCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeWatched, setTimeWatched] = useState(0);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const timerRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLIFrameElement>(null);
  const { toast } = useToast();

  // Fetch completed tasks of this type to check cooldown
  const { data: userTasks, isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/user/tasks"],
  });

  // Check if this task type is on cooldown (was completed in the last two weeks)
  const isCooldownActive = () => {
    if (!userTasks) return false;

    // Find the most recent completed task of this type
    const recentTask = userTasks
      .filter((t) => t.type === task.type && t.completedAt !== null)
      .sort((a, b) => {
        // Sort by completedAt in descending order (most recent first)
        const dateA = a.completedAt ? new Date(a.completedAt) : new Date(0);
        const dateB = b.completedAt ? new Date(b.completedAt) : new Date(0);
        return dateB.getTime() - dateA.getTime();
      })[0];

    if (!recentTask || !recentTask.completedAt) return false;

    // Check if the task was completed less than two weeks ago
    const completedDate = new Date(recentTask.completedAt);
    const cooldownEndDate = addDays(completedDate, 14); // Two-week cooldown

    return !isPast(cooldownEndDate);
  };

  // Calculate when the cooldown will end
  const getCooldownEndDate = () => {
    if (!userTasks) return null;

    const recentTask = userTasks
      .filter((t) => t.type === task.type && t.completedAt !== null)
      .sort((a, b) => {
        const dateA = a.completedAt ? new Date(a.completedAt) : new Date(0);
        const dateB = b.completedAt ? new Date(b.completedAt) : new Date(0);
        return dateB.getTime() - dateA.getTime();
      })[0];

    if (!recentTask || !recentTask.completedAt) return null;

    const completedDate = new Date(recentTask.completedAt);
    return addDays(completedDate, 14); // Two-week cooldown
  };

  // Format the cooldown time remaining
  const getCooldownTimeRemaining = () => {
    const endDate = getCooldownEndDate();
    if (!endDate) return "";

    return formatDistanceToNow(endDate, { addSuffix: true });
  };

  // Check if the task is on cooldown
  const cooldownActive = isCooldownActive();

  // Required watch time in seconds (10 seconds)
  const requiredWatchTime = 10;

  // Clear timer when component unmounts
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
  }, []);

  // Start watching the video
  const startWatching = () => {
    if (cooldownActive) {
      toast({
        title: "Task on cooldown",
        description: `You can watch this video again ${getCooldownTimeRemaining()}.`,
        variant: "destructive",
      });
      return;
    }

    if (maxTasksReached) {
      toast({
        title: "Weekly limit reached",
        description:
          "You've reached the maximum tasks for this category this week.",
        variant: "destructive",
      });
      return;
    }

    setIsPlaying(true);

    // Start timer to track watched time
    timerRef.current = window.setInterval(() => {
      setTimeWatched((prev) => {
        const newTime = prev + 1;

        // If reached required watch time, clear timer and mark as completed
        if (newTime >= requiredWatchTime && !hasCompleted) {
          if (timerRef.current) {
            window.clearInterval(timerRef.current);
          }
          setHasCompleted(true);
        }

        return newTime;
      });
    }, 1000);
  };

  // Claim reward after completing the task
  const claimReward = async () => {
    if (!hasCompleted) return;

    setIsLoading(true);

    try {
      // Create a new task
      const response = await apiRequest("POST", "/api/tasks", {
        availableTaskId: task.id,
        type: task.type,
        amount: task.reward,
        description: task.description,
        duration: task.duration,
        reward: task.reward,
      });

      const createdTask = await response.json();

      // Complete the task
      await apiRequest("POST", `/api/tasks/${createdTask.id}/complete`);

      // Show success toast
      toast({
        title: "Task completed!",
        description: `You earned ${task.reward} shillings for watching.`,
        variant: "default",
      });

      // Reset state
      setIsPlaying(false);
      setTimeWatched(0);
      setHasCompleted(false);

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/tasks"] });

      // Call the onComplete callback
      onComplete();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to claim reward. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get video embed URL based on task type
  const getVideoEmbedUrl = () => {
    const adVideos = [
      "https://www.youtube.com/embed/QY7Xj08CkNc", // Example ad video 1
      "https://www.youtube.com/embed/dQw4w9WgXcQ", // Example ad video 2
      "https://www.youtube.com/embed/jNQXAC9IVRw", // Example ad video 3
    ];

    switch (task.type) {
      case "youtube":
        return "https://www.youtube.com/embed/dQw4w9WgXcQ"; // Example YouTube video
      case "tiktok":
        return "https://www.tiktok.com/embed/v2/7037537360220437766"; // Example TikTok video
      case "instagram":
        return "https://www.instagram.com/p/CrD4McgsZzo/embed"; // Example Instagram post
      case "ad":
        // Cycle through ad videos based on task ID
        const adIndex = (task.id - 1) % adVideos.length;
        return adVideos[adIndex];
      default:
        return "";
    }
  };

  // Calculate progress percentage
  const progressPercentage = Math.min(
    (timeWatched / requiredWatchTime) * 100,
    100
  );

  return (
    <Card className="w-full overflow-hidden shadow-md hover:shadow-lg transition-shadow">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-800 text-white">
        <CardTitle className="flex items-center gap-2 text-xl">
          {task.type === "youtube" && "YouTube Video"}
          {task.type === "tiktok" && "TikTok Video"}
          {task.type === "instagram" && "Instagram Reel"}
          {task.type === "ad" && "Advertisement"}
        </CardTitle>
        <CardDescription className="text-slate-200">
          {task.description} • Earn {task.reward} Shillings
        </CardDescription>
      </CardHeader>

      <CardContent className="p-4">
        {!isPlaying ? (
          <div className="bg-slate-100 rounded-md p-12 flex flex-col items-center justify-center space-y-4">
            <div className="text-4xl text-slate-400">
              {task.type === "youtube" && "▶️ YouTube"}
              {task.type === "tiktok" && "🎵 TikTok"}
              {task.type === "instagram" && "📱 Instagram"}
              {task.type === "ad" && "🎬 Advertisement"}
            </div>

            {cooldownActive ? (
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2 text-amber-600">
                  <Lock size={20} />
                  <span className="font-medium">Unavailable</span>
                </div>
                <p className="text-center text-slate-500">
                  You've already completed this task.
                </p>
                {/* <div className="flex items-center gap-2 text-slate-500 mt-2">
                  <CalendarClock size={16} />
                  <span className="text-sm">Two-week cooldown period</span>
                </div> */}
              </div>
            ) : (
              <>
                <p className="text-center text-slate-500">
                  Click Start to watch and earn {task.reward} shillings
                </p>
                {maxTasksReached && (
                  <div className="flex items-center gap-2 text-amber-600 mt-2">
                    <AlertTriangle size={16} />
                    <span className="text-sm">Weekly limit reached</span>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="aspect-video w-full">
            <iframe
              ref={videoRef}
              src={getVideoEmbedUrl()}
              className="w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        )}

        {isPlaying && !hasCompleted && (
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm text-slate-600">
              <span className="flex items-center gap-1">
                <Clock size={14} />
                Watching: {timeWatched}s / {requiredWatchTime}s
              </span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        )}

        {hasCompleted && (
          <div className="mt-4 flex items-center justify-between">
            <span className="flex items-center gap-1 text-green-600 font-medium">
              <Check size={18} />
              Watched for {requiredWatchTime} seconds
            </span>
            <span className="text-sm text-slate-500">100%</span>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between p-4 bg-slate-50">
        {!isPlaying ? (
          cooldownActive ? (
            <Button variant="outline" className="w-full" disabled>
              <CalendarClock className="w-4 h-4 mr-2" />
              Try again later
            </Button>
          ) : (
            <Button
              onClick={startWatching}
              className="w-full"
              disabled={maxTasksReached}
            >
              Start Watching
            </Button>
          )
        ) : !hasCompleted ? (
          <Button variant="outline" className="w-full" disabled>
            Keep watching... ({timeWatched}s / {requiredWatchTime}s)
          </Button>
        ) : (
          <Button onClick={claimReward} className="w-full" disabled={isLoading}>
            {isLoading ? "Processing..." : "Claim Reward"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
