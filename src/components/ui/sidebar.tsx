import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";

export default function Sidebar() {
  const { logoutMutation } = useAuth();
  const [location] = useLocation();

  const isActive = (path: string) => {
    return location === path;
  };

  const navItems = [
    {
      label: "Dashboard",
      icon: "ri-dashboard-line",
      path: "/",
    },
    {
      label: "My Referrals",
      icon: "ri-user-add-line",
      path: "/referrals",
    },
    {
      label: "Earnings",
      icon: "ri-money-dollar-circle-line",
      path: "/earnings",
    },
    {
      label: "Tasks",
      icon: "ri-task-line",
      path: "/tasks",
    },
    {
      label: "Settings",
      icon: "ri-settings-line",
      path: "/settings",
    },
  ];

  return (
    <div className="hidden lg:flex lg:flex-shrink-0">
      <div className="flex flex-col w-64 bg-white border-r border-gray-200">
        <div className="flex items-center justify-center h-16 flex-shrink-0 px-4 bg-white">
          <h1 className="text-xl font-bold text-primary bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            <i className="ri-money-dollar-circle-line mr-1"></i> MoneyQash
          </h1>
        </div>
        <div className="flex flex-col flex-grow overflow-y-auto">
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navItems.map((item) => (
              <Link 
                key={item.path} 
                href={item.path}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  isActive(item.path)
                    ? "text-primary bg-primary-50 hover:bg-primary-100"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <i className={`${item.icon} mr-3 text-lg`}></i>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={() => logoutMutation.mutate()}
              className="flex items-center text-sm font-medium text-red-600 hover:text-red-700"
            >
              <i className="ri-logout-box-line mr-2"></i> Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
