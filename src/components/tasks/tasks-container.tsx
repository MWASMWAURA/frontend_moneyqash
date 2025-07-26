import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VideoTaskCard from "./video-task-card";
import { Loader2 } from "lucide-react";
import { AvailableTask } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function TasksContainer() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  
  // Get tasks completed from localStorage to persist between page navigations
  const getInitialCompletedTasks = () => {
    const saved = localStorage.getItem('completedTasks');
    return saved ? JSON.parse(saved) : {
      ad: 0,
      tiktok: 0,
      youtube: 0
    };
  };
  
  const [completedTasks, setCompletedTasks] = useState<Record<string, number>>(getInitialCompletedTasks());
  
  // Check if user is activated
  useEffect(() => {
    if (user && !user.isActivated) {
      toast({
        title: "Account not activated",
        description: "You need to activate your account to access tasks. Go to the referrals page to activate.",
        variant: "destructive"
      });
      navigate("/referrals");
    }
  }, [user, navigate, toast]);
  
  // Save to localStorage whenever completedTasks changes
  useEffect(() => {
    localStorage.setItem('completedTasks', JSON.stringify(completedTasks));
  }, [completedTasks]);
  
  // Get all available tasks
  const { data: availableTasks, isLoading } = useQuery<AvailableTask[]>({
    queryKey: ["/api/available-tasks"],
  });
  
  // Get user stats for checking task limits
  const { data: userStats } = useQuery({
    queryKey: ["/api/user/stats"],
  });
  
  // Handle task completion
  const handleTaskCompleted = (taskType: string) => {
    setCompletedTasks(prev => ({
      ...prev,
      [taskType]: prev[taskType as keyof typeof prev] + 1
    }));
  };
  
  // Check if user has reached max tasks (2 per type)
  const hasReachedMaxTasks = (taskType: string) => {
    const maxTasksPerType = 2; // Maximum 2 tasks per type per week
    return completedTasks[taskType as keyof typeof completedTasks] >= maxTasksPerType;
  };
  
  // Filter tasks by type
  const getTasksByType = (type: string) => {
    if (!availableTasks) return [];
    return availableTasks.filter(task => task.type === type);
  };
  
  // Organize tasks by type
  const adTasks = getTasksByType('ad');
  const tiktokTasks = getTasksByType('tiktok');
  const youtubeTasks = getTasksByType('youtube');
  
  if (isLoading) {
    return (
      <div className="w-full flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="w-full">
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="all">All Tasks</TabsTrigger>
          <TabsTrigger value="ads">Ads</TabsTrigger>
          <TabsTrigger value="tiktok">TikTok</TabsTrigger>
          <TabsTrigger value="youtube">YouTube</TabsTrigger>
        </TabsList>
        
        {/* All Tasks */}
        <TabsContent value="all" className="space-y-8">
          {adTasks.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-4">Advertisements</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {adTasks.map(task => (
                  <VideoTaskCard
                    key={task.id}
                    task={task}
                    onComplete={() => handleTaskCompleted('ad')}
                    maxTasksReached={hasReachedMaxTasks('ad')}
                  />
                ))}
              </div>
            </div>
          )}
          
          {tiktokTasks.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-4">TikTok Videos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tiktokTasks.map(task => (
                  <VideoTaskCard
                    key={task.id}
                    task={task}
                    onComplete={() => handleTaskCompleted('tiktok')}
                    maxTasksReached={hasReachedMaxTasks('tiktok')}
                  />
                ))}
              </div>
            </div>
          )}
          
          {youtubeTasks.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-4">YouTube Videos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {youtubeTasks.map(task => (
                  <VideoTaskCard
                    key={task.id}
                    task={task}
                    onComplete={() => handleTaskCompleted('youtube')}
                    maxTasksReached={hasReachedMaxTasks('youtube')}
                  />
                ))}
              </div>
            </div>
          )}
          

        </TabsContent>
        
        {/* Ads */}
        <TabsContent value="ads">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {adTasks.map(task => (
              <VideoTaskCard
                key={task.id}
                task={task}
                onComplete={() => handleTaskCompleted('ad')}
                maxTasksReached={hasReachedMaxTasks('ad')}
              />
            ))}
          </div>
        </TabsContent>
        
        {/* TikTok */}
        <TabsContent value="tiktok">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tiktokTasks.map(task => (
              <VideoTaskCard
                key={task.id}
                task={task}
                onComplete={() => handleTaskCompleted('tiktok')}
                maxTasksReached={hasReachedMaxTasks('tiktok')}
              />
            ))}
          </div>
        </TabsContent>
        
        {/* YouTube */}
        <TabsContent value="youtube">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {youtubeTasks.map(task => (
              <VideoTaskCard
                key={task.id}
                task={task}
                onComplete={() => handleTaskCompleted('youtube')}
                maxTasksReached={hasReachedMaxTasks('youtube')}
              />
            ))}
          </div>
        </TabsContent>
        

      </Tabs>
    </div>
  );
}