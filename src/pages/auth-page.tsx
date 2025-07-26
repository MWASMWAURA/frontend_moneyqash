import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { insertUserSchema } from "@shared/schema.ts";
import { Redirect } from "wouter";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function AuthPage() {
  const { user, registerMutation, loginMutation } = useAuth();
  const [isLogin, setIsLogin] = useState(true);

  // If user is already logged in, redirect to dashboard
  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-50 to-cyan-50">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="mb-6 text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">
              <i className="ri-money-dollar-circle-line text-primary"></i>{" "}
              MoneyQash
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Earn money by completing tasks and referring friends
            </p>
          </div>

          <div className="flex justify-center mb-6">
            <div className="flex rounded-md shadow-sm bg-gray-100 p-1">
              <button
                onClick={() => setIsLogin(true)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  isLogin ? "bg-white shadow-sm" : "text-gray-500"
                }`}
              >
                Login
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  !isLogin ? "bg-white shadow-sm" : "text-gray-500"
                }`}
              >
                Register
              </button>
            </div>
          </div>

          {isLogin ? <LoginForm /> : <RegisterForm />}
        </CardContent>
      </Card>
    </div>
  );
}

function LoginForm() {
  const { loginMutation } = useAuth();

  const loginSchema = z.object({
    username: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
  });

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  function onSubmit(data: z.infer<typeof loginSchema>) {
    loginMutation.mutate(data, {
      onError: (error: any) => {
        if (error.message === "Invalid credentials") {
          toast({
            title: "User not found",
            description: "Please register first to create an account",
            variant: "destructive",
          });
        }
      },
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="username" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={loginMutation.isPending}
        >
          {loginMutation.isPending ? (
            <>
              <span className="mr-2">Signing in</span>
              <i className="ri-loader-4-line animate-spin"></i>
            </>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>
    </Form>
  );
}

function RegisterForm() {
  const { registerMutation } = useAuth();

  const registerSchema = insertUserSchema
    .extend({
      passwordConfirm: z.string().min(1, "Please confirm your password"),
    })
    .refine((data) => data.password === data.passwordConfirm, {
      message: "Passwords don't match",
      path: ["passwordConfirm"],
    });

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      passwordConfirm: "",
      fullName: "",
      phone: "",
    },
  });

  function onSubmit(data: z.infer<typeof registerSchema>) {
    registerMutation.mutate(data, {
      onError: (error: any) => {
        if (error.message === "Username already exists") {
          toast({
            title: "Account exists",
            description: "This username already exists. Please login instead",
            variant: "destructive",
          });
        }
      },
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="username" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="passwordConfirm"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input
                  placeholder="07XX XXX XXX"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={registerMutation.isPending}
        >
          {registerMutation.isPending ? (
            <>
              <span className="mr-2">Creating account</span>
              <i className="ri-loader-4-line animate-spin"></i>
            </>
          ) : (
            "Create Account"
          )}
        </Button>
      </form>
    </Form>
  );
}
