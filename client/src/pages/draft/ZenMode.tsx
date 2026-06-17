import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import remarkGfm from "remark-gfm";
import ReactMarkdown from "react-markdown";
import { ArrowLeft, Download, Check, FileText, Loader2 } from "lucide-react";
import { motion, AnimatePresence, Transition } from "framer-motion";
import { useGetScriptByIdQuery } from "../../graphql/generated/graphql";
import PlaceholderState from "../../components/PlaceholderState";

const smoothTransition: Transition = {
  duration: 0.7,
  ease: [0.16, 1, 0.3, 1],
};

const ZenMode = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [isDownloaded, setIsDownloaded] = useState(false);

  const { data, loading } = useGetScriptByIdQuery({
    variables: { id: id || "" },
    skip: !id,
    fetchPolicy: "cache-first",
  });

  const script = data?.getScriptById;
  const paragraphs = script?.paragraphs || [];

  const handleDownload = () => {
    if (!script || paragraphs.length === 0) return;

    // 1. Combine all paragraphs into a single text string
    const combinedText = paragraphs.map((p: any) => p.text).join("\n\n");

    // 2. Create a browser Blob with the markdown content
    const blob = new Blob([combinedText], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    // 3. Create a temporary anchor tag to trigger the download
    const link = document.createElement("a");
    link.href = url;

    // Sanitize the title for the filename
    const safeTitle = (script.title || "Untitled_Draft").replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.download = `${safeTitle}.md`;

    document.body.appendChild(link);
    link.click();

    // 4. Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // 5. Show success animation for 2 seconds
    setIsDownloaded(true);
    setTimeout(() => setIsDownloaded(false), 2000);
  };
  const zenEmptyVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { delay: 0.2, ...smoothTransition } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
  };
  return (
    <AnimatePresence mode="wait">
      {loading ? (
        <motion.div
          key="loader"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full min-h-[96dvh] flex-1 flex items-center justify-center"
        >
          <Loader2 className="size-8 shrink-0 animate-spin" />
        </motion.div>
      ) : (
        <motion.div
          key="content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={smoothTransition}
          className="max-w-5xl mx-auto h-[calc(100dvh-36px)] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20 scrollbar-none transition-colors duration-500 rounded-2xl space-y-4 cursor-default"
        >
          <div className="sticky top-0 z-50 flex justify-between items-center border-b border-white/5 pb-4 bg-[#0A0A14]">
            <button
              onClick={() => navigate(-1)}
              className="p-3 rounded-full text-gray-500 hover:bg-white/5 hover:text-white transition-all"
              title="Exit Zen Mode"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <motion.h4
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, ...smoothTransition }}
              className="text-gray-300 font-bold text-lg tracking-widest uppercase font-mono select-none"
            >
              {script?.title || "Untitled Draft"}
            </motion.h4>

            <button
              onClick={handleDownload}
              disabled={paragraphs.length === 0}
              className={`p-3 rounded-full transition-all outline-none focus:outline-none focus:ring-0 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed ${isDownloaded
                ? "bg-green-500/20 text-green-400"
                : "text-gray-500 hover:bg-white/5 hover:text-white"
                }`}
              title="Download as Markdown"
            >
              <AnimatePresence mode="wait">
                {isDownloaded ? (
                  <motion.div
                    key="check"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                  >
                    <Check className="w-5 h-5" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="download"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                  >
                    <Download className="w-5 h-5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>

          {/* --- Reading Area --- */}
          <div id="zen-content" className="w-full">
            {paragraphs.length > 0 ? (
              <div className="prose prose-lg dark:prose-invert prose-p:leading-relaxed prose-headings:font-bold text-gray-300 text-xl">
                {paragraphs.map((para: any) => (
                  <motion.div
                    key={para.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, ...smoothTransition }}
                  >
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        ul: ({ children }) => (
                          <ul className="list-disc ml-5 mb-8">{children}</ul>
                        ),
                        p: ({ children }) => <p className="mb-8">{children}</p>,
                      }}
                    >
                      {para.text}
                    </ReactMarkdown>
                  </motion.div>
                ))}
              </div>
            ) : (
              <PlaceholderState
                minHeight="min-h-[75dvh]"
                icon={FileText}
                title="A blank canvas"
                description="There are no approved contributions to read yet. Exit Zen Mode to start drafting."
              />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ZenMode;