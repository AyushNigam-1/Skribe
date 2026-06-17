import React, { useState, useMemo, useEffect } from "react";
import { useOutletContext, useNavigate, useSearchParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
  Inbox,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Search as SearchIcon,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  AlertCircle,
  SearchX,
  Loader2,
  ListFilter
} from "lucide-react";

import Search from "../../components/layout/Search";
import Dropdown from "../../components/layout/Dropdown";
import ContributeModal from "../../components/modal/ContributeModal";
import { useGetFilteredRequestsQuery } from "../../graphql/generated/graphql";
import { DropdownOption, ScriptDetailsContext } from "../../types";
import EmptyState from "../../components/PlaceholderState";
import PlaceholderState from "../../components/PlaceholderState";

const statusOptions: DropdownOption[] = [
  { id: "all", name: "All Statuses" },
  { id: "pending", name: "Pending" },
  { id: "approved", name: "Approved" },
  { id: "rejected", name: "Rejected" },
];

const Requests: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const userId = searchParams.get("userId");

  const { data: scriptContextData } = useOutletContext<ScriptDetailsContext>();
  const scriptId = scriptContextData?.getScriptById?.id;

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<DropdownOption>(
    statusOptions[0]
  );

  const queryVariables: any = { scriptId };
  if (userId) queryVariables.userId = userId;
  if (selectedStatus.id !== "all") queryVariables.status = (selectedStatus.id as string).toLowerCase();

  const { data, loading, error, refetch } = useGetFilteredRequestsQuery({
    variables: queryVariables,
    skip: !scriptId,
    fetchPolicy: "cache-and-network",
  });

  const rawParagraphs = data?.getFilteredRequests || [];
  const authorName = userId && rawParagraphs.length > 0 ? rawParagraphs[0]?.author?.name : null;

  useEffect(() => {
    if (userId && authorName && searchQuery === "") {
      setSearchQuery(`author:${authorName.toLowerCase().replace(/\s+/g, '-')}`);
    }
  }, [userId, authorName]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (value === "" && userId) {
      searchParams.delete("userId");
      setSearchParams(searchParams);
      setSelectedStatus(statusOptions[0]);
    }
  };

  const clearUserFilter = () => {
    searchParams.delete("userId");
    setSearchParams(searchParams);
    setSearchQuery("");
    setSelectedStatus(statusOptions[0]);
  };

  const filteredParagraphs = useMemo(() => {
    let result = [...rawParagraphs];
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      if (!query.startsWith('author:')) {
        result = result.filter(
          (req?) =>
            req?.text?.toLowerCase().includes(query) ||
            req?.author?.name?.toLowerCase().includes(query),
        );
      }
    }
    return result;
  }, [rawParagraphs, searchQuery]);

  const formatDate = (timestamp?: string | number): string => {
    if (!timestamp) return "";
    const date = new Date(Number(timestamp));
    return new Intl.DateTimeFormat("en-US", {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    }).format(date);
  };

  const getStatusConfig = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return { color: "text-green-400 bg-green-500/10 border-green-500/20", icon: CheckCircle, label: "Approved" };
      case "rejected":
        return { color: "text-red-400 bg-red-500/10 border-red-500/20", icon: XCircle, label: "Rejected" };
      default:
        return { color: "text-amber-400 bg-amber-500/10 border-amber-500/20", icon: Clock, label: "Pending" };
    }
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    },
    exit: { opacity: 0, transition: { duration: 0.2 } },
  };

  // 🚨 FIXED: Pure, smooth slide-up animation without scale weirdness
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" }
    },
    exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
  };

  const isFiltering = searchQuery !== "" || selectedStatus.id !== "all" || userId;

  return (
    <div className="w-full flex-1 flex flex-col">
      <AnimatePresence mode="wait">
        {/* 🚨 FIXED: Check for !scriptId to prevent the empty state flash on mount */}
        {!scriptId || (loading && !data) ? (
          <motion.div
            key="loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center w-full min-h-[70dvh]"
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
        ) : rawParagraphs.length === 0 && !isFiltering ? (
          <EmptyState
            icon={Inbox}
            title="No requests yet"
            description="There are no requests right now. Be the first to submit a contribution!"
            action={
              <ContributeModal
                scriptId={scriptId}
                refetch={refetch}
                variant="empty"
              />
            }
          />
        ) : (
          <motion.div variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="w-full space-y-4">

            <motion.div variants={itemVariants} className="flex flex-row items-center py-2 justify-between w-full max-w-7xl mx-auto gap-2 sm:gap-4">
              <Search
                value={searchQuery}
                setSearch={handleSearchChange}
                placeholder={userId ? `Filtering by user...` : "Search requests..."}
                className="flex-1 min-w-0 sm:max-w-60"
              />
              <Dropdown
                options={statusOptions}
                value={selectedStatus}
                onChange={setSelectedStatus}
                icon={ListFilter}
                collapseOnMobile={true}
                className="shrink-0 w-auto"
              />
            </motion.div>

            {filteredParagraphs.length === 0 ? (
              <PlaceholderState
                minHeight="min-h-[54dvh]"
                icon={SearchX}
                title="No results found"
                description="We couldn't find any results. Try adjusting your filters."
              />
            ) : (
              <motion.div variants={containerVariants} className="w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 pb-10">
                <AnimatePresence mode="popLayout">
                  {filteredParagraphs.map((req?) => {
                    const statusInfo = getStatusConfig(req?.status);
                    const StatusIcon = statusInfo.icon;
                    return (
                      <motion.div
                        layout
                        key={req?.id}
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
                        onClick={() => navigate(`/contribution/${scriptId}/${req?.id}`)}
                        className="bg-white/5 border border-white/10 rounded-2xl p-5 cursor-pointer hover:bg-white/10 transition-colors flex flex-col gap-4 relative group"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="size-10 rounded-xl bg-white/10 flex items-center justify-center text-white font-bold shadow-inner">
                              {req?.author?.name?.charAt(0).toUpperCase() || "?"}
                            </div>
                            <div>
                              <p className="font-bold text-white font-mono">{req?.author?.name || "Unknown"}</p>
                              <p className="text-xs text-gray-500 font-mono">{formatDate(req?.createdAt)}</p>
                            </div>
                          </div>
                          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-widest ${statusInfo.color}`}>
                            <StatusIcon size={12} />
                            <span>{statusInfo.label}</span>
                          </div>
                        </div>
                        <div className="prose prose-sm dark:prose-invert text-gray-400 line-clamp-3">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{req?.text}</ReactMarkdown>
                        </div>
                        <div className="flex items-center gap-6 text-gray-500 text-xs font-mono mt-auto pt-2">
                          <span className="flex items-center gap-1.5"><ThumbsUp size={14} /> {req?.likes?.length || 0}</span>
                          <span className="flex items-center gap-1.5"><ThumbsDown size={14} /> {req?.dislikes?.length || 0}</span>
                          <span className="flex items-center gap-1.5 ml-auto"><MessageSquare size={14} /> {req?.comments?.length || 0}</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Requests;