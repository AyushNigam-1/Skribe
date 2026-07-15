import { useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FileText,
  MessageSquare,
  Users,
  Info,
  Maximize,
  Settings,
} from "lucide-react";
import { TabItem, TabsProps } from "../../types";


const Tabs = ({
  setTab,
  tab,
  scriptId,
  isEditorOrOwner = false,
}: TabsProps) => {
  const location = useLocation();

  const tabs: TabItem[] = useMemo(() => {
    const baseTabs: TabItem[] = [
      {
        icon: FileText,
        name: "Timeline",
        pathMatch: "/timeline",
        route: `timeline/${scriptId}`,
      },
      {
        icon: MessageSquare,
        name: "Requests",
        pathMatch: "/requests",
        route: `requests/${scriptId}`,
      },
      {
        icon: Users,
        name: "Contributors",
        pathMatch: "/contributors",
        route: `contributors/${scriptId}`,
      },
      {
        icon: Maximize,
        name: "Zen Mode",
        pathMatch: "/zen",
        route: `zen/${scriptId}`,
      },
      {
        icon: Info,
        name: "About",
        pathMatch: "/about",
        route: `about/${scriptId}`,
        isRightStart: true,
      },
    ];

    if (isEditorOrOwner) {
      baseTabs.push({
        icon: Settings,
        name: "Settings",
        pathMatch: "/settings",
        route: `settings/${scriptId}`,
      });
    }

    return baseTabs;
  }, [scriptId, isEditorOrOwner]);

  useEffect(() => {
    const currentTab = tabs.find((t) =>
      location.pathname.includes(t.pathMatch),
    );
    if (currentTab && setTab) {
      setTab(currentTab.name);
    }
  }, [location.pathname, setTab, tabs]);

  return (
    // Changed to font-sans and removed uppercase for a cleaner Github-style look
    <nav className="flex items-center gap-1 overflow-x-auto snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [scrollbar-width:none] font-mono text-sm font-bold uppercase tracking-widest w-full">
      {tabs.map((t) => {
        const Icon = t.icon;
        const isActive = location.pathname.includes(t.pathMatch);

        return (
          <div
            key={t.name}
            className={`shrink-0 snap-start flex items-center ${t.isRightStart ? "md:ml-auto md:pl-2" : ""
              }`}
          >
            <Link
              to={t.route}
              className={`
              relative group flex items-center uppercase font-bold gap-2 px-3 py-3 md:px-4 md:py-3.5 transition-colors duration-200 whitespace-nowrap
              ${isActive
                  ? "text-white font-semibold"
                  : "text-gray-400 hover:text-gray-200 rounded-lg"
                }
              `}
            >
              <Icon
                className={`w-4 h-4 transition-colors duration-200 ${isActive
                  ? "text-white"
                  : "text-gray-500 group-hover:text-gray-400"
                  }`}
              />
              <span>{t.name}</span>

              {/* Smooth Animated Bottom Border matching your screenshot */}
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  // Using #f78166 (coral/orange) from your screenshot, adjust if needed!
                  className="absolute left-0 right-0 bottom-0 h-[2px] bg-gray-100 rounded-t-full"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </Link>
          </div>
        );
      })}
    </nav>
  );
};

export default Tabs;
