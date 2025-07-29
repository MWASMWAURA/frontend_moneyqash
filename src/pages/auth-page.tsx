import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { baseInsertUserSchema } from "@shared/schema";
import { Redirect } from "wouter";
import { useToast } from "@/hooks/use-toast";
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
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

interface ReferrerInfo {
  id: number;
  username: string;
  fullName: string;
  isActivated: boolean;
}

export default function AuthPage() {
  const { user, registerMutation, loginMutation } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  // Referral code state
  const [referralCode, setReferralCode] = useState<string>("");
  const [referrerInfo, setReferrerInfo] = useState<ReferrerInfo | null>(null);
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [codeValidationMessage, setCodeValidationMessage] =
    useState<string>("");

  // Parse referral code from URL on component mount
  useEffect(() => {
    // Better URL parsing
    const urlParams = new URLSearchParams(window.location.search);
    const codeFromUrl = urlParams.get("code");

    console.log("URL search params:", window.location.search);
    console.log("Code from URL:", codeFromUrl);

    if (codeFromUrl) {
      setReferralCode(codeFromUrl.toUpperCase());
      setIsLogin(false); // Switch to register mode
      validateReferralCode(codeFromUrl.toUpperCase());
    }
  }, []); // Remove location dependency to avoid infinite loops

  // Function to validate referral code
  const validateReferralCode = async (code: string) => {
    console.log("Validating referral code:", code);
    if (!code || code.length < 3) {
      setReferrerInfo(null);
      setCodeValidationMessage("");
      return;
    }
    setIsValidatingCode(true);
    setCodeValidationMessage("");
    try {
      const apiBase = import.meta.env.VITE_API_URL || "";
      const response = await fetch(`${apiBase}/api/validate-referral/${code}`);
      const data = await response.json();
      console.log("Referral code validation response:", data);

      if (data.valid && data.referrer) {
        setReferrerInfo(data.referrer);
        setCodeValidationMessage("Valid referral code!");
      } else {
        setReferrerInfo(null);
        setCodeValidationMessage(data.message || "Invalid referral code");
      }
    } catch (error) {
      console.error("Error validating referral code:", error);
      setReferrerInfo(null);
      setCodeValidationMessage("Error validating referral code");
    } finally {
      setIsValidatingCode(false);
    }
  };

  // Handle referral code input change
  const handleReferralCodeChange = (code: string) => {
    setReferralCode(code.toUpperCase());
    // Debounce validation
    setTimeout(() => {
      validateReferralCode(code.toUpperCase());
    }, 500);
  };

  // If user is already logged in and on /register, show a message instead of redirecting
  if (user && location.startsWith("/register")) {
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
                You are already logged in. Please{" "}
                <a href="/auth" className="text-primary underline">
                  logout
                </a>{" "}
                before registering a new account.Come back to this url and
                refresh.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  // If user is already logged in and not on /register, redirect to dashboard
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
          {isLogin ? (
            <LoginForm />
          ) : (
            <RegisterForm
              referralCode={referralCode}
              onReferralCodeChange={handleReferralCodeChange}
              referrerInfo={referrerInfo}
              isValidatingCode={isValidatingCode}
              codeValidationMessage={codeValidationMessage}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function LoginForm() {
  const { loginMutation } = useAuth();
  const { toast } = useToast();
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

interface RegisterFormProps {
  referralCode: string;
  onReferralCodeChange: (code: string) => void;
  referrerInfo: ReferrerInfo | null;
  isValidatingCode: boolean;
  codeValidationMessage: string;
}

function RegisterForm({
  referralCode,
  onReferralCodeChange,
  referrerInfo,
  isValidatingCode,
  codeValidationMessage,
}: RegisterFormProps) {
  const { registerMutation } = useAuth();
  const { toast } = useToast();
  const registerSchema = baseInsertUserSchema
    .extend({
      passwordConfirm: z.string().min(1, "Please confirm your password"),
      withdrawalPhone: z.string().optional(),
      referralCode: z.string().optional(),
      referrerId: z.number().optional(),
    })
    .refine((data: any) => data.password === data.passwordConfirm, {
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
      withdrawalPhone: "",
      referralCode: referralCode || "", // Initialize with the persistent referral code
      referrerId: undefined,
    },
  });
  // Update form when referralCode changes - with proper cleanup
  useEffect(() => {
    const currentValue = form.getValues("referralCode");
    console.log(
      "Setting referral code in form:",
      referralCode,
      "Current:",
      currentValue
    );

    if (referralCode && referralCode !== currentValue) {
      form.setValue("referralCode", referralCode, {
        shouldValidate: false,
        shouldDirty: true,
        shouldTouch: false,
      });
    }
  }, [referralCode, form]);
  function onSubmit(data: z.infer<typeof registerSchema>) {
    // Only include referralCode if it's valid
    const payload = { ...data } as any;
    if (referralCode && referrerInfo) {
      payload.referralCode = referralCode;
    }
    registerMutation.mutate(payload, {
      onSuccess: () => {
        toast({
          title: "Account created successfully!",
          description: referrerInfo
            ? `You've been referred by ${referrerInfo.fullName}. Activate your account to earn rewards!`
            : "Welcome to MoneyQash!",
        });
      },
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
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="referralCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                Referral Code
                <span className="text-xs text-gray-500">(Optional)</span>
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    placeholder="Enter referral code"
                    {...field}
                    value={field.value || referralCode} // Ensure value is always synced with referralCode
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase();
                      field.onChange(value);
                      onReferralCodeChange(value);
                    }}
                    className="pr-10"
                  />
                  {isValidatingCode && (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                  )}
                  {!isValidatingCode && field.value && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {referrerInfo ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
              </FormControl>
              {/* Referral code validation message */}
              {codeValidationMessage && (
                <div
                  className={`text-xs ${
                    referrerInfo ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {codeValidationMessage}
                </div>
              )}
              {/* Referrer information */}
              {referrerInfo && (
                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-800">
                        Referred by: {referrerInfo.fullName} (@
                        {referrerInfo.username})
                      </p>
                      <p className="text-xs text-green-600">
                        You'll both earn rewards when you activate your account!
                      </p>
                    </div>
                    <Badge
                      variant={
                        referrerInfo.isActivated ? "default" : "secondary"
                      }
                    >
                      {referrerInfo.isActivated ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              )}
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
