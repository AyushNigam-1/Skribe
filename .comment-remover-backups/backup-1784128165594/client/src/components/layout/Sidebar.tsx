import { Link, useLocation } from "react-router-dom";
import {
  Compass,
  User,
  Award,
  LogOut,
  ChevronLeft,
  Bookmark,
} from "lucide-react";
import { useUserStore } from "../../store/useAuthStore";
import { authClient } from "../../lib/authClient";
import { motion } from "framer-motion";
import NotificationModal from "../../pages/home/Notifications";
import { MenuItem, SidebarProps } from "../../types";

const Sidebar = ({ isOpen, toggleSidebar }: SidebarProps) => {
  const location = useLocation();

  const { user } = useUserStore();
  const userId = user?.id || "guest";

  const menuItems: MenuItem[] = [
    { name: "Explore", icon: Compass, route: "/explore" },
    { name: "Contributions", icon: Award, route: "/contributions" },
    { name: "Bookmarks", icon: Bookmark, route: "/bookmarks" },
    { name: "Profile", icon: User, route: `/profile/${userId}` },
  ];

  return (
    <aside
      className={`sticky top-0 h-screen transition-all duration-300 ease-in-out shrink-0 ${isOpen
        ? "w-72 opacity-100 visible overflow-hidden"
        : "w-0 opacity-0 invisible overflow-hidden"
        }`}
    >
      <div className="w-full h-full space-y-4 bg-[#161620] border-r border-white/10 flex flex-col font-mono p-4 lg:p-5">
        <div className="flex justify-between items-center shrink-0">
          <img
            src="/logo.png"
            alt="Logo"
            className="w-28 lg:w-32 brightness-110 drop-shadow-sm"
          />

          <div className="flex items-center gap-1">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-full text-gray-500 hover:text-white hover:bg-white/10 transition-all duration-200"
              title="Close Sidebar"
            >
              <ChevronLeft size={20} />
            </button>
          </div>
        </div>
        <motion.hr className="border-b-0.5 border-white/5" />
        <nav className="flex flex-col gap-5 flex-1 overflow-y-auto scrollbar-none pb-4 mt-2">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.route;

            return (
              <Link
                to={item.route}
                key={index}
                className={`
                  group flex items-center gap-3 py-1 transition-all duration-300 outline-none relative overflow-hidden
                  ${isActive
                    ? "font-bold text-white pl-3"
                    : "text-gray-400 hover:text-white pl-0"
                  }
                `}
              >
                <div
                  className={`absolute left-0 top-0 bottom-0 w-[2px] bg-gray-100 transition-transform duration-300 ease-out origin-center ${isActive ? "scale-y-100" : "scale-y-0"
                    }`}
                />

                <Icon
                  className={`w-5 h-5 shrink-0 transition-all duration-300 ${isActive
                    ? "stroke-[2.5px] scale-110 ml-1"
                    : "stroke-2 opacity-70 group-hover:opacity-100 group-hover:scale-110"
                    }`}
                />
                <span className="text-lg font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                  {item.name}
                </span>
              </Link>
            );
          })}
          <NotificationModal />

        </nav>

        <button
          onClick={async () => {
            await authClient.signOut();
            window.location.href = "/login";
          }}
          className="group flex w-full items-center gap-3 px-3 py-3 mb-2 rounded-xl text-red-400/80 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300 outline-none border-none bg-transparent cursor-pointer"
        >
          <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform shrink-0" />
          <span className="font-bold font-mono text-base tracking-widest whitespace-nowrap">
            Logout
          </span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;