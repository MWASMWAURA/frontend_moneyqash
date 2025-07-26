import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

interface MobileNavProps {
  showMobileMenu: boolean;
  setShowMobileMenu: (show: boolean) => void;
}

export default function MobileNav({ 
  showMobileMenu, 
  setShowMobileMenu 
}: MobileNavProps) {
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

  const toggleMenu = () => {
    setShowMobileMenu(!showMobileMenu);
  };

  return (
    <>
      <div className="lg:hidden bg-white shadow-sm sticky top-0 z-10">
        <div className="flex justify-between items-center p-4">
          <h1 className="text-xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            <i className="ri-money-dollar-circle-line mr-1"></i> MoneyQash
          </h1>
          <button 
            onClick={toggleMenu} 
            className="p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
          >
            <i className="ri-menu-line text-xl"></i>
          </button>
        </div>
        
        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="p-4 bg-white border-t border-gray-200">
            <nav className="space-y-3">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setShowMobileMenu(false)}
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
              <button
                onClick={() => {
                  setShowMobileMenu(false);
                  logoutMutation.mutate();
                }}
                className="flex items-center w-full px-3 py-2 text-sm font-medium rounded-md text-red-600 hover:bg-red-50"
              >
                <i className="ri-logout-box-line mr-3 text-lg"></i>
                Logout
              </button>
            </nav>
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden bg-white border-t border-gray-200 fixed bottom-0 left-0 right-0 z-10">
        <div className="grid grid-cols-4 h-16">
          {navItems.slice(0, 4).map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`flex flex-col items-center justify-center ${
                isActive(item.path) ? "text-primary" : "text-gray-500"
              }`}
            >
              <i className={`${item.icon} text-xl`}></i>
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
