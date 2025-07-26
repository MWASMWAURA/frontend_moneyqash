import { UserStats } from "@shared/schema";

interface AccountCardProps {
  stats: UserStats;
  isActivated: boolean;
  onWithdraw: (source: string, amount: number) => void;
}

export default function AccountCard({ stats, isActivated, onWithdraw }: AccountCardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
      {/* Account Balance Card */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-500">Account Balance</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">
              KSh {stats.accountBalance}
            </h3>
            <p className="text-xs text-gray-500 mt-1">From referrals only</p>
          </div>
          <span className="bg-primary-100 p-3 rounded-full">
            <i className="ri-wallet-3-line text-primary text-xl"></i>
          </span>
        </div>
        <div className="mt-4">
          {isActivated && stats.accountBalance >= 600 ? (
            <button
              onClick={() => onWithdraw("referral", stats.accountBalance)}
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <i className="ri-bank-card-line mr-2"></i> Withdraw
            </button>
          ) : (
            isActivated && (
              <p className="text-xs text-orange-600 mt-1">
                <i className="ri-information-line"></i> Minimum withdrawal amount: KSh 600
              </p>
            )
          )}
        </div>
      </div>

      {/* Total Profits Card */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Profits</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">
              KSh {stats.totalProfit}
            </h3>
            <p className="text-xs text-gray-500 mt-1">All earnings combined</p>
          </div>
          <span className="bg-green-100 p-3 rounded-full">
            <i className="ri-line-chart-line text-green-600 text-xl"></i>
          </span>
        </div>
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Referrals</span>
            <span>KSh {stats.accountBalance}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Tasks</span>
            <span>KSh {stats.totalProfit - stats.accountBalance}</span>
          </div>
        </div>
      </div>

      {/* Referral Stats Card */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-500">Referral Network</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">
              {stats.directReferrals + stats.secondaryReferrals} Users
            </h3>
          </div>
          <span className="bg-blue-100 p-3 rounded-full">
            <i className="ri-user-add-line text-blue-600 text-xl"></i>
          </span>
        </div>
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Direct Referrals</span>
            <span>{stats.directReferrals}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Secondary Referrals</span>
            <span>{stats.secondaryReferrals}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
