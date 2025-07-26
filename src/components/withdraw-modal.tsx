import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  source: string;
  amount: number;
}

export default function WithdrawModal({
  isOpen,
  onClose,
  source,
  amount,
}: WithdrawModalProps) {
  const { toast } = useToast();
  const [maxAmount, setMaxAmount] = useState(amount);
  const [formattedSource, setFormattedSource] = useState("");
  const [useRegisteredPhone, setUseRegisteredPhone] = useState(true);

  // Define a type for our user to ensure phone exists
  type UserWithPhone = {
    id: number;
    username: string;
    fullName: string | null;
    phone: string | null;
    withdrawalPhone: string | null;
    accountBalance: number;
    isActivated: boolean;
  };

  // Get user data to access the phone number
  const { data: userData } = useQuery({
    queryKey: ["/api/user"],
  });
  
  // Cast user data to our type
  const user = userData as UserWithPhone | undefined;

  useEffect(() => {
    setMaxAmount(amount);
    
    // Format source for display
    if (source === "referral") {
      setFormattedSource("Referral");
    } else if (source === "ad") {
      setFormattedSource("Ad");
    } else if (source === "tiktok") {
      setFormattedSource("TikTok");
    } else if (source === "youtube") {
      setFormattedSource("YouTube");
    } else if (source === "instagram") {
      setFormattedSource("Instagram");
    }
  }, [source, amount]);

  const formSchema = z.object({
    amount: z.number()
      .min(600, "Minimum withdrawal amount is KSh 600")
      .max(maxAmount, `Maximum amount you can withdraw is KSh ${maxAmount}`),
    paymentMethod: z.string().min(1, "Please select a payment method"),
    phoneNumber: z.string().min(10, "Please enter a valid phone number"),
    useRegisteredPhone: z.boolean().optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: maxAmount >= 600 ? maxAmount : 600,
      paymentMethod: "M-Pesa",
      phoneNumber: user?.phone || "",
      useRegisteredPhone: true,
    },
  });

  // Update form values when props change
  useEffect(() => {
    form.setValue("amount", maxAmount >= 600 ? maxAmount : 600);
    
    // Set phone number to user's registered number if option is selected
    if (useRegisteredPhone && user?.phone) {
      form.setValue("phoneNumber", user.phone);
    }
  }, [maxAmount, form, user, useRegisteredPhone]);

  // Handle checkbox change
  const handleRegisteredPhoneChange = (checked: boolean) => {
    setUseRegisteredPhone(checked);
    if (checked && user?.phone) {
      form.setValue("phoneNumber", user.phone);
    } else {
      form.setValue("phoneNumber", "");
    }
  };

  const withdrawMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const res = await apiRequest("POST", "/api/withdrawals", {
        ...data,
        source: source,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      toast({
        title: "Withdrawal successful!",
        description: "Your funds are being processed. A fee of KSh 50 was deducted.",
      });
      onClose();
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Withdrawal failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    withdrawMutation.mutate(data);
  }

  if (amount < 600) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <i className="ri-bank-card-line text-green-600 mr-2"></i>
            Withdraw {formattedSource} Earnings
          </DialogTitle>
          <DialogDescription>
            You can withdraw your earnings to your preferred payment method. A fee of KSh 50 will be deducted from your withdrawal.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="mt-4 bg-gray-50 p-4 rounded-md">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Available Balance</span>
                <span className="text-sm font-medium text-gray-900">KSh {maxAmount}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Withdrawal Fee</span>
                <span className="text-sm font-medium text-gray-900">KSh 50</span>
              </div>
              <div className="border-t border-gray-200 pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">You Will Receive</span>
                  <span className="text-sm font-bold text-gray-900">
                    KSh {(form.watch("amount") || 0) - 50}
                  </span>
                </div>
              </div>
            </div>

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Withdrawal Amount</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <div className="flex items-center">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">KSh</span>
                        </div>
                        <Input
                          type="number"
                          className="pl-12"
                          min={600}
                          max={maxAmount}
                          {...field}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            field.onChange(isNaN(value) ? 0 : value);
                          }}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          className="absolute right-0 px-3 text-xs text-primary hover:text-primary/80 font-medium"
                          onClick={() => form.setValue("amount", maxAmount)}
                        >
                          Max
                        </Button>
                      </div>
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Withdrawal Method</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="M-Pesa">M-Pesa</SelectItem>
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                      <SelectItem value="PayPal">PayPal</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {user?.phone && (
              <div className="flex items-center space-x-2 my-4">
                <Checkbox 
                  id="useRegisteredPhone" 
                  checked={useRegisteredPhone}
                  onCheckedChange={handleRegisteredPhoneChange}
                />
                <label
                  htmlFor="useRegisteredPhone"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Use my registered phone number
                </label>
              </div>
            )}

            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number (for M-Pesa)</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="e.g. 07XX XXX XXX"
                      {...field}
                      disabled={useRegisteredPhone && user?.phone ? true : false}
                    />
                  </FormControl>
                  <FormDescription>
                    {useRegisteredPhone && user?.phone 
                      ? "Using your registered phone number"
                      : "Enter the phone number to receive your withdrawal"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="flex sm:justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-green-600 hover:bg-green-700"
                disabled={withdrawMutation.isPending}
              >
                {withdrawMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing
                  </>
                ) : (
                  "Withdraw Funds"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
