import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link, useOutletContext } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  CheckCircle,
  XCircle,
  FileText,
  Loader2,
  Trash2,
  MessageSquare,
  Clock,
} from "lucide-react";
import {
  useGetParagraphByIdQuery,
  useGetScriptByIdQuery,
  useApproveParagraphMutation,
  useRejectParagraphMutation,
  useLikeParagraphMutation,
  useDislikeParagraphMutation,
  useDeleteParagraphMutation,
  useAddCommentMutation,
} from "../../graphql/generated/graphql";
import { useUserStore } from "../../store/useAuthStore";
import { posthog } from "../../providers/PostHogProvider";
import DiscussionPanel from "../../components/modal/DiscussionPanel";
import ContributeModal from "../../components/modal/ContributeModal";
import DeleteConfirmModal from "../../components/modal/DeleteConfirmModal";
import { ScriptDetailsContext } from "../../types";

const Contribution: React.FC = () => {
  const { paragraphId } = useParams<{ id: string; paragraphId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useUserStore();

  const outletContext = useOutletContext<ScriptDetailsContext>() || {};

  const [localLikes, setLocalLikes] = useState<string[]>([]);
  const [localDislikes, setLocalDislikes] = useState<string[]>([]);
  const [isTargetSticky, setIsTargetSticky] = useState(false);
  const [isDiscussionOpen, setIsDiscussionOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  const [localComments, setLocalComments] = useState<any[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const {
    data: paragraphData,
    loading: paragraphLoading,
    error: paragraphError,
    refetch,
  } = useGetParagraphByIdQuery({
    variables: { paragraphId: paragraphId || "" },
    skip: !paragraphId,
    fetchPolicy: "cache-and-network",
  });
  const paragraph = paragraphData?.getParagraphById;
  const scriptId = paragraph?.script?.id;

  const { data: scriptData, loading: scriptLoading } = useGetScriptByIdQuery({
    variables: { id: scriptId || "" },
    skip: !scriptId,
    fetchPolicy: "cache-first",
  });

  const approvedParagraphs = scriptData?.getScriptById?.paragraphs || [];

  const safeCurrentUserId = String(currentUser?.id || "NO_USER");
  const scriptOwnerId = String(scriptData?.getScriptById?.author?.id || paragraph?.script?.author?.id || "NO_OWNER");
  const authorId = String(paragraph?.author?.id || "NO_AUTHOR");

  const isOwner = safeCurrentUserId !== "NO_USER" && safeCurrentUserId === scriptOwnerId;
  const isAuthor = safeCurrentUserId !== "NO_USER" && safeCurrentUserId === authorId;

  const isEditor = scriptData?.getScriptById?.collaborators?.some((c: any) => {
    const collabUserId = String(c.user?.id || "");
    return collabUserId === safeCurrentUserId && (c.role === "EDITOR" || c.role === "OWNER");
  }) || false;

  const isContextEditorOrOwner = !!outletContext?.isEditorOrOwner;

  const hasManageAccess = isOwner || isEditor || isContextEditorOrOwner;

  const isTargetApproved = approvedParagraphs.some((p) => p.id === paragraphId);

  const statusUI = (() => {
    if (isTargetApproved || paragraph?.status?.toLowerCase() === "approved") {
      return { label: "Approved", color: "text-green-400 bg-green-500/10 border-green-500/20", icon: CheckCircle };
    }
    if (paragraph?.status?.toLowerCase() === "rejected") {
      return { label: "Rejected", color: "text-red-400 bg-red-500/10 border-red-500/20", icon: XCircle };
    }
    return { label: "Pending", color: "text-amber-400 bg-amber-500/10 border-amber-500/20", icon: Clock };
  })();
  const StatusIcon = statusUI.icon;

  const [approveParagraph, { loading: isApproving }] = useApproveParagraphMutation({
    refetchQueries: ["GetPendingParagraphs", "GetScriptById", "GetScriptContributors"]
  });

  const [rejectParagraph, { loading: isRejecting }] = useRejectParagraphMutation({
    refetchQueries: ["GetPendingParagraphs"]
  });

  const [deleteParagraph, { loading: isDeleting }] = useDeleteParagraphMutation({
    refetchQueries: ["GetPendingParagraphs"]
  });

  const [likeParagraph] = useLikeParagraphMutation();
  const [dislikeParagraph] = useDislikeParagraphMutation();
  const [addComment, { loading: isCommenting }] = useAddCommentMutation();

  useEffect(() => {
    if (paragraph) {
      setLocalLikes((paragraph.likes as string[]) || []);
      setLocalDislikes((paragraph.dislikes as string[]) || []);
      setLocalComments(paragraph.comments || []);
    }
  }, [paragraph]);


  useEffect(() => {
    if (!paragraphLoading && !scriptLoading && paragraph) {

      const timer = setTimeout(() => {
        const targetEl = document.getElementById("target-card");
        const headerEl = document.getElementById("sticky-header");

        if (targetEl) {
          const headerHeight = headerEl ? headerEl.getBoundingClientRect().height : 70;
          const padding = 16;

          const elementPosition = targetEl.getBoundingClientRect().top + window.scrollY;
          const finalScrollPosition = elementPosition - headerHeight - padding;

          window.scrollTo({
            top: finalScrollPosition,
            behavior: "smooth"
          });
        }
      }, 400);

      return () => clearTimeout(timer);
    }
  }, [paragraphId, paragraphLoading, scriptLoading, paragraph]);

  useEffect(() => {
    const handleScroll = () => {
      const el = document.getElementById("target-card");
      if (el) {
        setIsTargetSticky(el.getBoundingClientRect().top <= 1);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const formatDate = (timestamp?: string | number): string => {
    if (!timestamp) return "";
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(Number(timestamp)));
  };

  const handleApprove = async () => {
    try {
      await approveParagraph({
        variables: { paragraphId: paragraphId || "" },
        refetchQueries: ["GetPendingParagraphs", "GetScriptById", "GetParagraphById"]
      });
      posthog.capture("contribution_approved", { paragraph_id: paragraphId, script_id: scriptId });
      toast.success("Contribution approved successfully!");
      await refetch();
    } catch (err) {
      toast.error("Failed to approve contribution.");
    }
  };

  const handleReject = async () => {
    if (!window.confirm("Are you sure you want to reject this contribution?")) return;
    try {
      await rejectParagraph({
        variables: { paragraphId: paragraphId || "" },
        refetchQueries: ["GetPendingParagraphs", "GetParagraphById"]
      });
      posthog.capture("contribution_rejected", { paragraph_id: paragraphId, script_id: scriptId });
      toast.success("Contribution rejected.");
      await refetch();
    } catch (err) {
      toast.error("Failed to reject contribution.");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteParagraph({
        variables: { paragraphId: paragraphId || "" },
        refetchQueries: ["GetPendingParagraphs", "GetParagraphById"]
      });
      posthog.capture("contribution_deleted", { paragraph_id: paragraphId, script_id: scriptId });
      toast.success("Contribution deleted.");
      setShowDeleteConfirm(false);
      navigate(-1);
    } catch (err) {
      toast.error("Failed to delete contribution.");
    }
  };

  const handleLike = async () => {
    if (!currentUser?.id) return toast.error("Please log in to like this.");
    const isLiked = localLikes.includes(currentUser.id);
    const prevLikes = [...localLikes];
    const prevDislikes = [...localDislikes];

    if (isLiked) {
      setLocalLikes(prevLikes.filter((uid) => uid !== currentUser.id));
    } else {
      setLocalLikes([...prevLikes, currentUser.id]);
      setLocalDislikes(prevDislikes.filter((uid) => uid !== currentUser.id));
    }
    try {
      await likeParagraph({ variables: { paragraphId: paragraphId || "" } });
      posthog.capture("contribution_liked", { paragraph_id: paragraphId, script_id: scriptId, toggled_off: isLiked });
    } catch (err) {
      setLocalLikes(prevLikes);
      setLocalDislikes(prevDislikes);
      toast.error("Failed to update like status.");
    }
  };

  const handleDislike = async () => {
    if (!currentUser?.id) return toast.error("Please log in to dislike this.");
    const isDisliked = localDislikes.includes(currentUser.id);
    const prevLikes = [...localLikes];
    const prevDislikes = [...localDislikes];

    if (isDisliked) {
      setLocalDislikes(prevDislikes.filter((uid) => uid !== currentUser.id));
    } else {
      setLocalDislikes([...prevDislikes, currentUser.id]);
      setLocalLikes(prevLikes.filter((uid) => uid !== currentUser.id));
    }
    try {
      await dislikeParagraph({ variables: { paragraphId: paragraphId || "" } });
      posthog.capture("contribution_disliked", { paragraph_id: paragraphId, script_id: scriptId, toggled_off: isDisliked });
    } catch (err) {
      setLocalLikes(prevLikes);
      setLocalDislikes(prevDislikes);
      toast.error("Failed to update dislike status.");
    }
  };

  const handleAddComment = async (submittedText: string) => {
    if (!currentUser) {
      toast.error("Please log in to comment.")
      return
    };
    try {
      const newComment = { text: submittedText, createdAt: Date.now().toString(), author: { username: currentUser.name } };
      setLocalComments((prev) => [...prev, newComment]);
      await addComment({ variables: { paragraphId: paragraphId || "", text: submittedText } });
    } catch (err) {
      toast.error("Failed to post comment.");
      setLocalComments(paragraph?.comments || []);
    }
  };

  const renderTargetCard = () => (
    <div className="flex flex-col h-auto bg-white/[0.08] border border-white/20 rounded-2xl relative shadow-lg ring-1 ring-white/10 transition-all w-full">
      <div className="p-4 h-auto w-full overflow-hidden">
        <div className="col-start-1 row-start-1 text-gray-200 font-medium w-full text-[0.875rem] md:text-base leading-[1.7142857] md:leading-[1.75] whitespace-pre-wrap break-words max-w-full">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              ul: ({ children }) => <ul className="list-disc ml-5 m-0 p-0">{children}</ul>,
              p: ({ children }) => <p className="m-0 p-0">{children}</p>,
            }}
          >
            {paragraph?.text}
          </ReactMarkdown>
        </div>
      </div>

      <div className="sticky bottom-0 z-30 w-full border-t border-white/10 p-4 bg-[#161620]/95 backdrop-blur-md rounded-b-2xl shadow-[0_-10px_20px_rgba(0,0,0,0.2)]">
        <div className="flex flex-row items-center justify-between gap-4 text-gray-400 text-sm font-mono flex-wrap">
          <div className="flex items-center gap-2">
            <button onClick={handleLike} className="flex items-center gap-1.5 hover:text-white p-2 bg-white/5 rounded-lg border border-white/10 transition-colors">
              <ThumbsUp size={18} className={localLikes.includes(currentUser?.id || "") ? "text-white fill-current" : ""} /> <span>{localLikes.length}</span>
            </button>
            <button onClick={handleDislike} className="flex items-center gap-1.5 hover:text-white p-2 bg-white/5 rounded-lg border border-white/10 transition-colors">
              <ThumbsDown size={18} className={localDislikes.includes(currentUser?.id || "") ? "text-white fill-current" : ""} /> <span>{localDislikes.length}</span>
            </button>
            <div className="w-px h-6 bg-white/10 mx-1 hidden sm:block" />
            <button onClick={() => setIsDiscussionOpen(!isDiscussionOpen)} className={`flex items-center gap-1.5 p-2 rounded-lg border transition-colors ${isDiscussionOpen ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : "bg-white/5 hover:text-white border-white/10 text-gray-400"}`}>
              <MessageSquare size={18} /><span>{localComments.length}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 justify-end">
            {(isAuthor || hasManageAccess) && paragraph?.status?.toLowerCase() === "pending" && (
              <div className="flex items-center gap-2">
                <ContributeModal mode="edit" variant="edit" paragraphId={paragraph.id} initialContent={paragraph?.text || ''} refetch={refetch} />
                <button onClick={() => setShowDeleteConfirm(true)} disabled={isDeleting} className="hover:text-red-400 text-red-500/80 p-2 bg-white/5 rounded-lg border border-white/10 disabled:opacity-50 transition-colors">
                  <Trash2 size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <AnimatePresence mode="wait">
      {paragraphLoading || scriptLoading ? (
        <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="flex items-center justify-center w-full min-h-[70dvh]">
          <Loader2 className="size-8 shrink-0 animate-spin" />
        </motion.div>
      ) : paragraphError || !paragraph ? (
        <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="flex flex-col items-center justify-center w-full min-h-[50dvh] text-center text-red-500 font-mono gap-4">
          <XCircle className="w-10 h-10" />
          <p>Failed to load contribution.</p>
        </motion.div>
      ) : (
        <motion.div key="content" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="w-full mx-auto flex flex-col font-mono relative space-y-4">

          <div id="sticky-header" className="sticky top-0 z-40 w-full bg-primary backdrop-blur-xl py-2">
            <div className="flex flex-row items-center justify-between w-full gap-2">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <button onClick={() => navigate(-1)} className="hidden sm:flex items-center justify-center w-10 h-10 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-300 hover:text-white transition-all active:scale-95 shrink-0">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-px h-8 bg-white/10 hidden sm:block" />
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div className="size-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-white font-bold shrink-0 shadow-inner">
                    {paragraph?.author?.name?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <Link to={`/profile/${paragraph.author.id}`} className="font-bold text-white truncate">
                      {paragraph?.author?.name || "Unknown Author"}
                    </Link>
                    <p className="text-xs text-gray-400 font-mono mt-0.5 truncate">
                      {formatDate(paragraph?.createdAt)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-1.5 sm:gap-2 shrink-0">
                {hasManageAccess && paragraph?.status?.toLowerCase() === "pending" ? (
                  <>
                    <button onClick={handleReject} disabled={isRejecting || isApproving} className="flex items-center justify-center gap-1.5 p-2.5 bg-red-500/10 border border-red-500/20 hover:border-red-500/50 hover:bg-red-500/20 text-red-400 rounded-xl text-xs sm:text-sm font-bold transition-all active:scale-95 disabled:opacity-50 ">
                      <XCircle size={18} className="shrink-0" />
                      <span className="hidden sm:inline">Reject</span>
                    </button>
                    <button onClick={handleApprove} disabled={isApproving || isRejecting} className="flex items-center justify-center gap-1.5 p-2.5 bg-green-500/10 border border-green-500/20 hover:border-green-500/50 hover:bg-green-500/20 text-green-400 rounded-xl text-xs sm:text-sm font-bold transition-all active:scale-95 disabled:opacity-50">
                      {isApproving ? <Loader2 size={18} className="animate-spin shrink-0" /> : <CheckCircle size={16} className="shrink-0" />}
                      <span className="hidden sm:inline">Approve</span>
                    </button>
                  </>
                ) : (
                  <div className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl border text-[12px] sm:text-sm font-bold uppercase tracking-widest shrink-0 ${statusUI.color}`}>
                    <StatusIcon className="w-4 sm:h-4 shrink-0" />
                    <span className="translate-y-[1px]">{statusUI.label}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="w-full flex flex-col space-y-6">
            {approvedParagraphs.length > 0 ? (
              <>
                {approvedParagraphs.reduce((acc: JSX.Element[], para, index, arr) => {
                  if (para.id === paragraphId) {
                    acc.push(<div key={para.id} id="target-card" className="not-prose w-full">{renderTargetCard()}</div>);
                  } else {
                    const lastElement = acc[acc.length - 1];
                    if (lastElement && lastElement.props.className?.includes("connected-block")) {
                      const prevChildren = React.Children.toArray(lastElement.props.children);
                      acc[acc.length - 1] = React.cloneElement(lastElement, {}, [
                        ...prevChildren,
                        <div key={para.id} className="opacity-70 break-words max-w-full overflow-hidden"><ReactMarkdown remarkPlugins={[remarkGfm]}>{para.text}</ReactMarkdown></div>
                      ]);
                    } else {
                      acc.push(
                        <div key={`block-${para.id}`} className="connected-block flex flex-col bg-white/5 rounded-2xl border border-white/10 p-6 h-auto prose prose-sm md:prose-base dark:prose-invert max-w-none text-gray-300 w-full overflow-hidden break-words">
                          <div key={para.id} className="opacity-70 break-words max-w-full overflow-hidden"><ReactMarkdown remarkPlugins={[remarkGfm]}>{para.text}</ReactMarkdown></div>
                        </div>
                      );
                    }
                  }
                  return acc;
                }, [])}
              </>
            ) : (
              <div className="flex items-center gap-2 text-sm text-gray-500 italic font-mono bg-white/5 rounded-2xl border border-white/10 p-6 w-full">
                <FileText className="w-4 h-4" /> This draft currently has no approved content.
              </div>
            )}

            {!isTargetApproved && paragraph && (
              <div id="target-card" className="w-full">{renderTargetCard()}</div>
            )}
          </div>

          <DiscussionPanel isOpen={isDiscussionOpen} onClose={() => setIsDiscussionOpen(false)} isDesktop={isDesktop} comments={localComments} onAddComment={handleAddComment} isCommenting={isCommenting} formatDate={formatDate} />

          <DeleteConfirmModal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} onConfirm={handleDelete} isDeleting={isDeleting} title="Delete Request?" description="Are you sure you want to completely delete this request? This action cannot be undone." />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Contribution;