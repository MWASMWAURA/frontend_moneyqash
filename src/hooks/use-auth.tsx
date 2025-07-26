import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import {
  insertUserSchema,
  User as SelectUser,
  InsertUser,
} from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, RegisterData>;
};

type LoginData = Pick<InsertUser, "username" | "password">;

interface RegisterData extends InsertUser {
  passwordConfirm?: string;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | null, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      console.log("Attempting login..."); // Debug log
      const res = await apiRequest("POST", "/api/login", credentials);
      const data = await res.json();
      console.log("Login response:", data); // Debug log
      return data;
    },
    onSuccess: (user: SelectUser) => {
      console.log("Login successful:", user); // Debug log
      queryClient.setQueryData(["/api/user"], user);
      // Invalidate other user-related queries
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      setLocation("/");
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.fullName || user.username}!`,
      });
    },
    onError: (error: Error) => {
      console.error("Login error:", error); // Debug log
      toast({
        title: "Login failed",
        description: error.message || "Unable to login. Please try again.",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      console.log("Attempting registration..."); // Debug log
      // Remove passwordConfirm from data before sending to server
      const { passwordConfirm, ...credentials } = data;
      const res = await apiRequest("POST", "/api/register", credentials);
      const responseData = await res.json();
      console.log("Registration response:", responseData); // Debug log
      return responseData;
    },
    onSuccess: (user: SelectUser) => {
      console.log("Registration successful:", user); // Debug log
      queryClient.setQueryData(["/api/user"], user);
      // Invalidate other user-related queries
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      setLocation("/");
      toast({
        title: "Registration successful",
        description: `Welcome, ${user.fullName || user.username}!`,
      });
    },
    onError: (error: Error) => {
      console.error("Registration error:", error); // Debug log
      toast({
        title: "Registration failed",
        description: error.message || "Unable to register. Please try again.",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      console.log("Attempting logout..."); // Debug log
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      console.log("Logout successful"); // Debug log
      queryClient.setQueryData(["/api/user"], null);
      // Clear all cached data on logout
      queryClient.clear();
      setLocation("/auth");
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    },
    onError: (error: Error) => {
      console.error("Logout error:", error); // Debug log
      // Even if logout fails on server, clear local data
      queryClient.setQueryData(["/api/user"], null);
      queryClient.clear();
      setLocation("/auth");
      toast({
        title: "Logged out",
        description: "You have been logged out locally.",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
