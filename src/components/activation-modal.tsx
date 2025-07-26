import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
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
import { Loader2 } from "lucide-react";

interface ActivationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const formSchema = z.object({
    paymentMethod: z.string().min(1, "Please select a payment method"),
    phoneNumber: z.string().min(10, "Please enter a valid phone number")
      .transform((val) => {
        // Remove any spaces or special characters
        let cleaned = val.replace(/[^0-9]/g, '');
        // If it starts with 0, remove it
        if (cleaned.startsWith('0')) {
          cleaned = cleaned.substring(1);
        }
        // If it doesn't start with 254, add it
        if (!cleaned.startsWith('254')) {
          cleaned = '254' + cleaned;
        }
        return cleaned;
      })
      .refine((val) => /^254[0-9]{9}$/.test(val), {
        message: "Phone number must be in the format 254XXXXXXXXX"
      }),
  });

export default function ActivationModal({ isOpen, onClose }: ActivationModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      paymentMethod: "M-Pesa",
      phoneNumber: "",
    },
  });

  const activationMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const res = await apiRequest("POST", "/api/user/activate", data);
      return await res.json();
    },
    onSuccess: (response, variables) => {
      // 'response' is the JSON data from /api/user/activate
      // 'variables' is the 'data' passed to mutate()
      if (variables.paymentMethod === 'M-Pesa') {
        // For M-Pesa, the backend only confirmed STK push initiation.
        // The "Payment initiated" toast is already shown in onSubmit.
        // We don't show "Account activated!" here.
        // We also don't invalidate user queries yet.
        // Actual activation confirmation will come via the M-Pesa callback to the backend,
        // and the frontend would typically be updated via WebSockets or polling.
        console.log("STK Push initiated successfully via backend:", response);
      } else {
        // For other payment methods (if any were fully implemented for activation)
        // this might be the place to show "Account activated!"
        // For now, this path isn't fully fleshed out.
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
        queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
        toast({
          title: "Action processed!", // Generic message for non-Mpesa
          description: "The request was processed successfully.",
        });
      }
      onClose(); // Close modal in both cases
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Activation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    if (data.paymentMethod === 'M-Pesa') {
      // Phone number formatting is now handled by zod schema
      activationMutation.mutate(data);

      toast({
        title: "Payment initiated",
        description: "Please check your phone for the STK push prompt",
      });
    } else {
      activationMutation.mutate(data);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <i className="ri-rocket-line text-primary mr-2"></i>
            Activate Your Account
          </DialogTitle>
          <DialogDescription>
            To unlock your referral link and start earning, you need to activate your account for a one-time fee of KSh 500.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="mt-4 bg-gray-50 p-4 rounded-md">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Activation Fee</span>
                <span className="text-sm font-medium text-gray-900">KSh 500</span>
              </div>
              <p className="text-xs text-gray-500">
                This is a one-time payment that gives you lifetime access to the referral program.
              </p>
            </div>

            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method</FormLabel>
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

            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number (for M-Pesa)</FormLabel>
                  <FormControl>
                    <Input 
                      type="tel" 
                      placeholder="e.g. 2547XXXXXXXX" 
                      {...field} 
                    />
                  </FormControl>
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
                disabled={activationMutation.isPending}
              >
                {activationMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing
                  </>
                ) : (
                  "Pay Now"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}