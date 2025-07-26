import { useState } from "react";
import { UserStats } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface ReferralSectionProps {
  isActivated: boolean;
  stats: UserStats;
  onActivate: () => void;
}

export default function ReferralSection({
  isActivated,
  stats,
  onActivate,
}: ReferralSectionProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const copyReferralLink = () => {
    navigator.clipboard.writeText(stats.referralLink)
      .then(() => {
        setCopied(true);
        toast({
          title: "Copied!",
          description: "Referral link copied to clipboard",
        });

        // Reset copied state after 2 seconds
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((error) => {
        toast({
          title: "Failed to copy",
          description: "Please try again or copy manually",
          variant: "destructive",
        });
      });
  };

  const shareViaWhatsApp = () => {
    const message = `Join ReferralPro and earn through referrals! Use my link: ${stats.referralLink}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const shareViaOther = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Join ReferralPro',
        text: 'Join ReferralPro and earn through referrals!',
        url: stats.referralLink,
      }).catch((error) => {
        toast({
          title: "Failed to share",
          description: "Please try again or share manually",
          variant: "destructive",
        });
      });
    } else {
      copyReferralLink();
    }
  };

  if (!isActivated) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mb-6">
      <h3 className="text-lg font-medium text-gray-900 mb-3">Your Referral Link</h3>
      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
        <div className="flex-grow">
          <div className="relative">
            <input
              type="text"
              readOnly
              value={stats.referralLink}
              className="block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <button
                onClick={copyReferralLink}
                className="text-primary hover:text-primary/80 focus:outline-none"
              >
                <i className={`${copied ? 'ri-check-line' : 'ri-file-copy-line'} text-lg`}></i>
              </button>
            </div>
          </div>
        </div>
        
      </div>
      <div className="mt-4">
        <div className="p-4 bg-primary-50 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <i className="ri-information-line text-primary"></i>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-primary-800">
                How referrals work
              </h3>
              <div className="mt-2 text-sm text-primary-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li>First direct referral: Earn KSh 300</li>
                  <li>Second direct referral: Earn KSh 150</li>
                  <li>Your referrals earn the same when they refer others</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
