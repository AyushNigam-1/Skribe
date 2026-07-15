import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Tabs from "../../components/layout/Tabs";
import { ThumbsUp, ThumbsDown, Bookmark, Loader2, AlertTriangle } from "lucide-react";
import { useUserStore } from "../../store/useAuthStore";
import { useParams, Outlet } from "react-router-dom";
import {
  useDislikeScriptMutation,
  useGetScriptByIdQuery,
  useLikeScriptMutation,
  useToggleBookmarkMutation,
} from "../../graphql/generated/graphql";
import { toast } from "sonner";

const DraftLayout = () => {
  const { id } = useParams<{ id: string }>();

  const currentUser = useUserStore((state: any) => state.user);
  const setUser = useUserStore((state: any) => state.setUser);

  const currentUserId = currentUser?.id;
  const [request, setRequest] = useState<any>(null);
  const [tab, setTab] = useState<string>("Timeline");

  const [localLikes, setLocalLikes] = useState<string[]>([]);
  const [localDislikes, setLocalDislikes] = useState<string[]>([]);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);

  const { data, loading, error, refetch } = useGetScriptByIdQuery({
    variables: { id: id || "" },
    skip: !id,
    fetchPolicy: "cache-and-network",
  });

  const [likeScript, { loading: isLiking }] = useLikeScriptMutation();
  const [dislikeScript, { loading: isDisliking }] = useDislikeScriptMutation();
  const [toggleBookmark, { loading: isBookmarking }] = useToggleBookmarkMutation();

  const script = data?.getScriptById;

  let currentUserRole = "VIEWER";
  if (script && currentUserId) {
    if (String(script.author?.id) === String(currentUserId)) {
      currentUserRole = "AUTHOR";
    } else {
      const collaborator = script.collaborators?.find(
        (c: any) => String(c.user?.id) === String(currentUserId)
      );
      if (collaborator) {
        currentUserRole = collaborator.role?.toUpperCase() || "VIEWER";
      }
    }
  }

  const isEditorOrOwner = Boolean(
    currentUserRole === "AUTHOR" || currentUserRole === "EDITOR"
  );

  useEffect(() => {
    if (script) {
      setLocalLikes((script.likes as string[]) || []);
      setLocalDislikes((script.dislikes as string[]) || []);
    }

    if (currentUser?.favourites && id) {
      const isFav = currentUser.favourites.some((fav: any) => {
        const favId = typeof fav === 'string' ? fav : fav?.id || fav?._id;
        return String(favId) === String(id);
      });
      setIsBookmarked(isFav);
    } else {
      setIsBookmarked(false);
    }
  }, [script, currentUser, id]);

  const isLiked = currentUserId ? localLikes.includes(currentUserId) : false;
  const isDisliked = currentUserId ? localDislikes.includes(currentUserId) : false;

  const handleLike = async () => {
    if (!currentUserId) {
      toast.error("Please log in to like this draft.");
      return;
    }
    const prevLikes = [...localLikes];
    const prevDislikes = [...localDislikes];

    if (isLiked) {
      setLocalLikes(prevLikes.filter((userId) => userId !== currentUserId));
    } else {
      setLocalLikes([...prevLikes, currentUserId]);
      setLocalDislikes(prevDislikes.filter((userId) => userId !== currentUserId));
    }

    try {
      await likeScript({ variables: { scriptId: id || "" } });
    } catch (err) {
      setLocalLikes(prevLikes);
      setLocalDislikes(prevDislikes);
      toast.error("Failed to like script.");
    }
  };

  const handleDislike = async () => {
    if (!currentUserId) {
      toast.error("Please log in to dislike this draft.");
      return;
    }
    const prevLikes = [...localLikes];
    const prevDislikes = [...localDislikes];
    if (isDisliked) {
      setLocalDislikes(prevDislikes.filter((userId) => userId !== currentUserId));
    } else {
      setLocalDislikes([...prevDislikes, currentUserId]);
      setLocalLikes(prevLikes.filter((userId) => userId !== currentUserId));
    }

    try {
      await dislikeScript({ variables: { scriptId: id || "" } });
    } catch (err) {
      setLocalLikes(prevLikes);
      setLocalDislikes(prevDislikes);
      toast.error("Failed to dislike script.");
    }
  };

  const handleBookmark = async () => {
    if (!currentUserId) {
      toast.error("Please log in to bookmark.");
      return;
    }

    const wasBookmarked = isBookmarked;

    setIsBookmarked(!wasBookmarked);

    const promise = toggleBookmark({
      variables: { scriptId: id || "" },
      refetchQueries: ["GetUserFavourites"],
      awaitRefetchQueries: true,
    })
      .then((res) => {
        if (res.data && currentUser) {
          const currentFavs = currentUser.favourites || [];
          let updatedFavs;

          if (wasBookmarked) {
            updatedFavs = currentFavs.filter((fav: any) => {
              const favId = typeof fav === 'string' ? fav : fav?.id || fav?._id;
              return String(favId) !== String(id);
            });
          } else {
            const exists = currentFavs.some((fav: any) => {
              const favId = typeof fav === 'string' ? fav : fav?.id || fav?._id;
              return String(favId) === String(id);
            });
            updatedFavs = exists ? currentFavs : [...currentFavs, id];
          }

          setUser({ ...currentUser, favourites: updatedFavs });
        }
      })
      .catch((err) => {
        setIsBookmarked(wasBookmarked);
        throw err;
      });

    toast.promise(promise, {
      loading: !wasBookmarked ? "Saving..." : "Removing...",
      success: !wasBookmarked ? "Saved!" : "Removed.",
      error: "Failed to update bookmark.",
    });
  };

  return (
    <div className="relative flex flex-col w-full max-w-7xl mx-auto min-h-[60dvh]">
      {error ? (
        <div className="flex flex-col justify-center items-center h-full text-red-500 font-mono py-20">
          <AlertTriangle className="w-10 h-10 mb-4 opacity-50" />
          <p className="text-sm tracking-widest uppercase font-bold">Failed to load Draft</p>
          <p className="text-xs text-red-400/70 mt-2 max-w-md text-center">{error.message}</p>
        </div>
      ) : (
        <motion.div
          key={id}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="flex flex-col w-full space-y-4"
        >
          <div className="flex flex-col space-y-4">
            <div className="grid w-full items-center">
              <AnimatePresence>
                {!script && (
                  <motion.div
                    key="skeleton"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="col-start-1 row-start-1 flex items-center justify-between gap-4 w-full pointer-events-none z-10"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="h-8 sm:h-10 w-2/3 max-w-[300px] bg-white/10 rounded-xl animate-pulse" />
                    </div>
                    <div className="flex items-center shrink-0 gap-1 sm:gap-2">
                      <div className="h-8 sm:h-9 w-12 sm:w-16 bg-white/10 rounded-lg animate-pulse" />
                      <div className="h-8 sm:h-9 w-8 sm:w-10 bg-white/10 rounded-lg animate-pulse" />
                      <div className="w-[1px] h-5 bg-white/10 mx-1 md:mx-0" />
                      <div className="h-8 sm:h-9 w-8 sm:w-10 bg-white/10 rounded-lg animate-pulse" />
                    </div>
                  </motion.div>
                )}

                {script && (
                  <motion.div
                    key="real-data"
                    initial={{ opacity: 0, scale: 1.02, filter: "blur(4px)" }}
                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="col-start-1 row-start-1 flex items-center justify-between gap-4 w-full z-0"
                  >
                    <div className="flex-1 min-w-0">
                      <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight truncate">
                        {script.title}
                      </h1>
                    </div>

                    <div className="flex items-center shrink-0 gap-1 sm:gap-2 bg-white/5 md:bg-transparent border border-white/10 md:border-transparent rounded-lg md:p-0">
                      <button
                        onClick={handleLike}
                        disabled={isLiking}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${isLiked ? "bg-white/10 text-white shadow-sm border border-white/10 md:border-transparent" : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
                          }`}
                      >
                        <ThumbsUp className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
                        <span>{localLikes.length}</span>
                      </button>

                      <button
                        onClick={handleDislike}
                        disabled={isDisliking}
                        className={`flex items-center justify-center p-1.5 sm:p-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${isDisliked ? "bg-white/5 text-white shadow-sm border border-white/10 md:border-transparent" : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
                          }`}
                      >
                        <ThumbsDown className={`w-4 h-4 ${isDisliked ? "fill-current" : ""}`} />
                      </button>

                      <div className="w-[1px] h-5 bg-white/10 mx-1 md:mx-0" />

                      <button
                        onClick={handleBookmark}
                        disabled={isBookmarking}
                        className={`p-1.5 sm:p-2 rounded-lg transition-all ${isBookmarked ? "text-white bg-white/10 shadow-sm border border-white/10 md:border-transparent" : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
                          }`}
                      >
                        {isBookmarking ? <Loader2 className="animate-spin w-4 h-4 sm:w-5 sm:h-5" /> : <Bookmark className={`w-4 h-4 sm:w-5 sm:h-5 ${isBookmarked ? "fill-current" : ""}`} />}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <hr className="border-b-0.5 border-white/10" />

            <div className="w-full border-b border-white/10">
              <Tabs
                setTab={setTab}
                tab={tab}
                scriptId={id}
                isEditorOrOwner={isEditorOrOwner}
              />
            </div>
          </div>

          <div className="w-full relative z-10">
            <Outlet
              context={{
                request,
                setRequest,
                data,
                refetch,
                setTab,
                tab,
                loading,
                isEditorOrOwner,
                currentUserRole
              }}
            />
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default DraftLayout;