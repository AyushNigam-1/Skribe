import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
  AlertCircle,
  Globe2,
  Lock,
  SearchX,
  ListFilter,
  BookmarkX,
  Loader2,
  Compass
} from "lucide-react";
import { useGetUserFavouritesQuery } from "../../graphql/generated/graphql";
import Search from "../../components/layout/Search";
import Dropdown from "../../components/layout/Dropdown";
import DraftCard from "../../components/card/DraftCard";
import { useUserStore } from "../../store/useAuthStore";
import { DropdownOption } from "../../types";
import PlaceholderState from "../../components/PlaceholderState";

const FILTER_OPTIONS = [
  { id: "all", name: "All Genres" },
  { id: "fantasy", name: "Fantasy" },
  { id: "science fiction", name: "Science Fiction" },
  { id: "mystery", name: "Mystery" },
  { id: "thriller", name: "Thriller" },
  { id: "romance", name: "Romance" },
  { id: "horror", name: "Horror" },
];

const Bookmarks = () => {
  const { user } = useUserStore();
  const currentUserId = user?.id;
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<DropdownOption>(FILTER_OPTIONS[0]);

  const { data, loading, error, refetch } = useGetUserFavouritesQuery({
    variables: { userId: currentUserId || "" },
    skip: !currentUserId,
    fetchPolicy: "no-cache",
  });

  const favourites = data?.getUserFavourites || [];

  const filteredFavourites = useMemo(() => {
    let result = favourites.filter(Boolean);

    if (searchQuery) {
      result = result.filter((script) =>
        script?.title?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedFilter.id !== "all") {
      result = result.filter((script) =>
        script?.genres?.some((genre: string) => genre.toLowerCase() === selectedFilter.id)
      );
    }

    return result;
  }, [favourites, searchQuery, selectedFilter]);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
    exit: { opacity: 0, transition: { duration: 0.2 } },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15, scale: 0.98 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: "tween", ease: "easeOut", duration: 0.4 },
    },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
  };

  const hasAnyBookmark = favourites.filter(Boolean).length > 0;
  const isFiltering = searchQuery !== "" || selectedFilter.id !== "all";

  return (
    <div className="w-full max-w-7xl mx-auto h-full text-white pb-10">
      <AnimatePresence mode="wait">

        {!currentUserId || loading ? (
          <motion.div
            key="loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center w-full min-h-[96dvh]"
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
        ) :

          (
            <motion.div
              key="content"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full space-y-4"
            >
              {(hasAnyBookmark || isFiltering) && (
                <>
                  <motion.div
                    variants={itemVariants}
                    className="grid grid-cols-[1fr_auto] gap-3 sm:flex sm:flex-row sm:items-center sm:justify-between sm:gap-4 w-full"
                  >
                    <h1 className="text-2xl sm:text-3xl font-extrabold font-sans tracking-tight self-center">
                      Bookmarks
                    </h1>

                    <div className="contents sm:flex sm:flex-row sm:items-center sm:gap-3">
                      <div className="col-span-2 order-last sm:order-none w-full sm:w-64">
                        <Search value={searchQuery} setSearch={setSearchQuery} placeholder="Search your library..." />
                      </div>

                      <div className="shrink-0 sm:w-auto self-center">
                        <Dropdown
                          options={FILTER_OPTIONS}
                          value={selectedFilter}
                          onChange={setSelectedFilter}
                          icon={ListFilter}
                          collapseOnMobile={true}
                        />
                      </div>
                    </div>
                  </motion.div>

                  <motion.hr variants={itemVariants} className="border-b-0.5 border-white/5" />
                </>
              )}

              {!hasAnyBookmark && !isFiltering ? (
                <PlaceholderState
                  minHeight="min-h-[96dvh]"
                  icon={BookmarkX}
                  title="No bookmarks yet"
                  description="You haven't bookmarked any drafts yet. Start exploring to build your collection."
                  action={
                    <Link
                      to="/explore"
                      className="flex items-center font-mono justify-center gap-2 px-4 py-2 md:px-5 md:py-2.5 bg-gray-100 hover:bg-gray-200 border border-white/10 rounded-xl text-gray-800 text-sm md:text-base font-bold transition-all duration-300 shadow-sm active:scale-95 "
                    >
                      <Compass className="w-4 h-4" />
                      Explore
                    </Link>
                  }
                />
              ) : filteredFavourites.length === 0 ? (
                <PlaceholderState
                  icon={SearchX}
                  title="No Results Found"
                  description="We couldn't find any result matching your current search filters. Try adjusting them!"
                />
              ) : (
                <motion.div
                  variants={containerVariants}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2"
                >
                  <AnimatePresence mode="popLayout">
                    {filteredFavourites.map((script) => (
                      <motion.div
                        layout
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        key={script.id}
                        className="h-full"
                      >
                        <DraftCard script={script} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </motion.div>
          )}
      </AnimatePresence>
    </div>
  );
};

export default Bookmarks;