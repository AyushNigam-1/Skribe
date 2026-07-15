import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogPanel, DialogTitle, DialogBackdrop } from "@headlessui/react";
import { X, MessageSquare, Loader2, SendHorizontal } from "lucide-react";
import { DiscussionPanelProps } from "../../types";
import { authClient } from "../../lib/authClient";

const DiscussionPanel: React.FC<DiscussionPanelProps> = ({
  isOpen,
  onClose,
  comments,
  onAddComment,
  isCommenting,
}) => {
  const [commentText, setCommentText] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  const { data: session } = authClient.useSession();
  const currentUserId = session?.user?.id;

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const scrollToBottom = (behavior: "auto" | "smooth" = "smooth") => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: behavior,
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => scrollToBottom("auto"), 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && comments.length > 0) {
      const timer = setTimeout(() => scrollToBottom("smooth"), 100);
      return () => clearTimeout(timer);
    }
  }, [comments.length, isOpen]);

  const handleSubmit = async () => {
    if (!commentText.trim() || isCommenting) return;
    await onAddComment(commentText);
    setCommentText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const formatMinimalTime = (timestamp?: string | number) => {
    if (!timestamp) return "";
    const date = new Date(Number(timestamp));
    if (isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      hour: "numeric",
      minute: "2-digit",
    }).format(date).toUpperCase();
  };

  if (!isMounted) return null;

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-[9999]">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300 ease-out data-[closed]:opacity-0"
      />

      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
          <DialogPanel
            transition
            className="bg-primary relative z-10 flex flex-col w-full max-w-2xl h-[75vh] min-h-[500px] max-h-[85vh] border border-white/10 rounded-3xl shadow-2xl overflow-hidden font-sans transition duration-500 ease-out data-[closed]:scale-95 data-[closed]:opacity-0 data-[closed]:translate-y-4"
          >
            <div className="flex justify-between items-center p-4 sm:p-5 border-b border-white/10 shrink-0 bg-white/5">
              <DialogTitle className="text-white font-extrabold text-lg sm:text-xl tracking-tight">
                Discussion
              </DialogTitle>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors active:scale-95 outline-none"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Modal Content Area */}
            <div className="flex-1 flex flex-col h-full w-full bg-transparent overflow-hidden">

              <div
                ref={scrollContainerRef}
                className="flex-1 flex flex-col gap-5 overflow-y-auto p-4 sm:p-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20"
              >
                <AnimatePresence>
                  {comments.length > 0 ? (
                    comments.map((comment, i) => {
                      const authorName = comment.author?.name || comment.author?.username || "Unknown";
                      // Exact ID match using Better Auth
                      const isCurrentUser = currentUserId && comment.author?.id === currentUserId;

                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: i * 0.05 }}
                          className={`flex w-full ${isCurrentUser ? "justify-end" : "justify-start"}`}
                        >
                          <div className={`flex items-start gap-2.5 max-w-[85%] sm:max-w-[75%] ${isCurrentUser ? "flex-row-reverse" : "flex-row"}`}>
                            <div className={`size-8 sm:size-9 shrink-0 rounded-full flex items-center justify-center font-bold text-xs shadow-inner mt-0.5 ${isCurrentUser
                              ? "bg-white/5 border border-white/10 text-gray-200"
                              : "bg-white/5 border border-white/10 text-gray-300"
                              }`}>
                              {authorName.charAt(0).toUpperCase()}
                            </div>

                            <div className={`flex flex-col p-2.5 sm:p-3 pb-1.5 sm:pb-1.5 min-w-[100px] shadow-sm ${isCurrentUser
                              ? "bg-white/5 border border-white/10 rounded-2xl rounded-tr-sm"
                              : "bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm"
                              }`}>
                              {!isCurrentUser && (
                                <span className="text-sm font-semibold text-gray-400 mb-0.5">
                                  {authorName}
                                </span>
                              )}
                              <p className={`text-sm sm:text-base leading-relaxed whitespace-pre-wrap ${isCurrentUser ? "text-indigo-50" : "text-gray-200"
                                }`}>
                                {comment.text}
                              </p>
                              <span className={`text-[10px] sm:text-[11px] font-mono font-medium self-end mt-1 opacity-70 ${isCurrentUser ? "text-indigo-200" : "text-gray-400"
                                }`}>
                                {formatMinimalTime(comment.createdAt)}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full opacity-80 min-h-[200px]">
                      <div className="bg-white/5 border border-white/10 p-4 rounded-full mb-4 shadow-inner">
                        <MessageSquare className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-white text-lg font-bold tracking-tight">
                        No comments yet
                      </p>
                      <p className="text-gray-400 text-sm mt-1 text-center max-w-xs">
                        Be the first to share your thoughts on this contribution.
                      </p>
                    </div>
                  )}
                </AnimatePresence>
              </div>

              {/* Input Area */}
              <div className="p-4 sm:p-5 bg-white/5 flex gap-2 shrink-0 border-t border-white/10 backdrop-blur-md">
                <div className="relative flex items-center w-full">
                  <input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isCommenting}
                    autoFocus
                    className="w-full bg-white/5 border border-white/10 focus:border-white/30 text-white rounded-full py-3.5 pl-4 pr-14 outline-none transition-all placeholder:text-gray-500 shadow-inner text-sm sm:text-base"
                    placeholder="Write a comment..."
                  />
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={isCommenting || !commentText.trim()}
                  className="p-4 bg-white hover:bg-gray-300 text-black rounded-full transition-all active:scale-95 disabled:opacity-50 disabled:hover:bg-white"
                >
                  {isCommenting ? (
                    <Loader2 className="size-8 sm:w-5 sm:h-5 animate-spin text-black" />
                  ) : (
                    <SendHorizontal className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
                  )}
                </button>
              </div>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
};

export default DiscussionPanel;