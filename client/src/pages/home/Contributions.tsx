import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
  CheckCircle,
  Clock,
  XCircle,
  Globe2,
  SearchX,
  ListFilter,
  FileExclamationPoint,
  Lock,
  Loader2,
  AlertCircle,
  File,
  Plus,
  FileXCorner,
  Compass
} from "lucide-react";
import { useGetUserContributionsQuery } from "../../graphql/generated/graphql";
import Search from "../../components/layout/Search";
import Dropdown from "../../components/layout/Dropdown";
import { useUserStore } from "../../store/useAuthStore";
import { DropdownOption } from "../../types";
import PlaceholderState from "../../components/PlaceholderState";

const FILTER_OPTIONS = [
  { id: "all", name: "All Contributions" },
  { id: "core", name: "Core Contributor (3+)" },
  { id: "casual", name: "Casual Writer(1-2)" },
  { id: "perfect", name: "100% Approved" },
];

const MyContributions = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<DropdownOption>(FILTER_OPTIONS[0]);

  const { user } = useUserStore();
  const currentUserId = user?.id;

  const { loading, error, data, refetch } = useGetUserContributionsQuery({
    variables: { userId: currentUserId || "" },
    skip: !currentUserId,
    fetchPolicy: "cache-and-network",
  });

  const formatFancyDate = (dateString: string | number) => {
    if (!dateString) return "UNKNOWN DATE";
    const isNumeric = /^\d+$/.test(String(dateString));
    const date = isNumeric ? new Date(Number(dateString)) : new Date(dateString);
    if (isNaN(date.getTime())) return "UNKNOWN DATE";

    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date).toUpperCase();
  };

  const contributions = data?.getUserContributions || [];
  const hasAnyContributions = contributions.length > 0;

  interface GroupedContribution {
    script: NonNullable<NonNullable<typeof data>["getUserContributions"]>[0]["script"];
    total: number;
    approved: number;
    pending: number;
    rejected: number;
    latestDate: string;
  }

  const groupedDrafts = useMemo(() => {
    const map = new Map<string, GroupedContribution>();

    const validContributions = contributions.filter(c => c !== null);

    validContributions.forEach((c) => {
      if (!c.script) return;
      const scriptId = c.script.id;

      if (!map.has(scriptId)) {
        map.set(scriptId, {
          script: c.script,
          total: 0,
          approved: 0,
          pending: 0,
          rejected: 0,
          latestDate: c.createdAt || "0",
        });
      }

      const group = map.get(scriptId)!;
      group.total += 1;
      const status = c.status?.toLowerCase() || "pending";

      if (status === "approved") group.approved += 1;
      else if (status === "rejected") group.rejected += 1;
      else group.pending += 1;

      if (Number(c.createdAt) > Number(group.latestDate)) {
        group.latestDate = c.createdAt || "0";
      }
    });

    let result = Array.from(map.values());

    if (searchQuery) {
      result = result.filter((g) =>
        g.script?.title?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedFilter.id !== "all") {
      result = result.filter((g) => {
        if (selectedFilter.id === "core") return g.total >= 3;
        if (selectedFilter.id === "casual") return g.total > 0 && g.total < 3;
        if (selectedFilter.id === "perfect") return g.approved === g.total && g.total > 0;
        return true;
      });
    }

    result.sort((a, b) => Number(b.latestDate) - Number(a.latestDate));
    return result;
  }, [contributions, searchQuery, selectedFilter]);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
    exit: { opacity: 0, transition: { duration: 0.2 } },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15, scale: 0.98 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: "tween", ease: "easeOut", duration: 0.4 } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
  };

  return (
    <div className="w-full h-full text-white max-w-7xl mx-auto">
      <AnimatePresence mode="wait">
        {!currentUserId || loading ? (
          <motion.div
            key="loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center w-full min-h-[96vh]"
          >
            <Loader2 className="size-8 shrink-0 animate-spin" />

          </motion.div>
        ) : error ? (
          <PlaceholderState
            icon={AlertCircle}
            title="Failed to load drafts"
            description="We couldn't load this data right now. Please check your connection and try again."
            action={
              <button
                onClick={() => refetch()}
                className="px-6 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl font-bold transition-all duration-200 active:scale-95 text-sm sm:text-base"
              >
                Try Again
              </button>
            }
          />
        ) : (
          <motion.div
            key="content"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex flex-col w-full gap-5"
          >
            {hasAnyContributions && (
              <>
                <motion.div
                  variants={itemVariants}
                  className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 sm:gap-4 w-full"
                >
                  <h1 className="text-2xl sm:text-3xl font-extrabold font-sans tracking-tight flex-1 order-1 min-w-fit">
                    Contributions
                  </h1>

                  <div className="w-full sm:w-56 lg:w-64 order-3 sm:order-2 shrink-0">
                    <Search value={searchQuery} setSearch={setSearchQuery} placeholder="Search drafts..." />
                  </div>

                  <div className="order-2 sm:order-3 shrink-0 ml-auto sm:ml-0">
                    <Dropdown
                      options={FILTER_OPTIONS}
                      value={selectedFilter}
                      onChange={setSelectedFilter}
                      icon={ListFilter}
                      collapseOnMobile={true}
                    />
                  </div>
                </motion.div>

                <motion.hr variants={itemVariants} className="border border-white/5" />
              </>
            )}

            {!hasAnyContributions ? (
              <PlaceholderState
                minHeight="min-h-[96dvh]"
                icon={FileXCorner}
                title="No contributions yet"
                description="You haven't contributed to any drafts yet. Find a draft to collaborate on and make your mark!"
                action={
                  <Link
                    to="/explore"
                    className="flex items-center justify-center gap-2 px-4 py-2 md:px-5 md:py-2.5 bg-gray-100 hover:bg-gray-200 border border-white/10 rounded-xl text-gray-800 text-sm md:text-base font-bold transition-all duration-300 shadow-sm active:scale-95"
                  >
                    <Compass className="w-4 h-4" />
                    Explore
                  </Link>
                }
              />
            ) : groupedDrafts.length > 0 ? (
              <motion.div
                variants={containerVariants}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
              >
                {groupedDrafts.map((group) => (
                  <motion.div layout variants={itemVariants} key={group.script.id}>
                    <Link
                      to={`/requests/${group.script.id}?userId=${currentUserId}`}
                      className="group flex flex-col gap-4 h-full bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all duration-300"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-col gap-2 min-w-0">
                          <h3 className="font-extrabold text-white text-xl md:text-2xl truncate font-sans tracking-tight">
                            {group.script.title}
                          </h3>
                          <div className="flex items-center gap-1.5 text-gray-400 text-xs uppercase tracking-widest font-bold">
                            ~ LAST SUBMIT: {formatFancyDate(group.latestDate)}
                          </div>
                        </div>
                        <div className="shrink-0 flex items-center justify-center px-2 py-1 rounded bg-white/5 border border-white/5 text-[10px] sm:text-xs text-gray-400 font-mono font-bold uppercase tracking-widest group-hover:text-gray-300 transition-colors mt-0.5">
                          {group.total} TOTAL
                        </div>
                      </div>

                      <div className="text-gray-400 line-clamp-3 leading-relaxed flex-grow font-mono group-hover:text-gray-300 transition-colors mt-1 mb-2">
                        View all your contributions, feedback, and edits submitted to this draft.
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-auto">
                        <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 group-hover:bg-white/[0.08] transition-colors">
                          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-gray-400 uppercase tracking-widest leading-none">
                            <Clock size={14} className="text-gray-400 shrink-0" />
                            <span className="mt-[1px]">Pending</span>
                          </div>
                          <span className="text-xs font-bold text-gray-400 leading-none">{group.pending}</span>
                        </div>

                        <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 group-hover:bg-white/[0.08] transition-colors">
                          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-gray-400 uppercase tracking-widest leading-none">
                            <CheckCircle size={14} className="text-gray-400 shrink-0" />
                            <span className="mt-[1px]">Active</span>
                          </div>
                          <span className="text-xs font-bold text-gray-400 leading-none">{group.approved}</span>
                        </div>

                        {group.rejected > 0 && (
                          <div className="col-span-2 flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/[0.02] border border-white/[0.05] group-hover:bg-white/[0.04] transition-colors mt-1">
                            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-gray-500 uppercase tracking-widest leading-none">
                              <XCircle size={14} className="text-red-500/70 shrink-0" />
                              <span className="mt-[1px]">Rejected</span>
                            </div>
                            <span className="text-xs font-bold text-red-500/90 leading-none">{group.rejected}</span>
                          </div>
                        )}
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <PlaceholderState
                icon={SearchX}
                title="No Results Found"
                description="We couldn't find any result matching your current search filters. Try adjusting them!"
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MyContributions;