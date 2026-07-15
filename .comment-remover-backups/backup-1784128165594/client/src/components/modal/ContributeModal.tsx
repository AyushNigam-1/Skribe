import { useState } from "react";
import { Dialog, DialogPanel, DialogBackdrop } from "@headlessui/react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion, AnimatePresence } from "framer-motion";
import {
  PlusCircle,
  X,
  Loader2,
  Plus,
  Eye,
  PenLine,
  Edit2,
  Save,
  Pen,
} from "lucide-react";
import clsx from "clsx";
import {
  useSubmitParagraphMutation,
  useEditParagraphMutation
} from "../../graphql/generated/graphql";
import { posthog } from "../../providers/PostHogProvider";
import { ContributeModalProps } from "../../types";

const contributeSchema = z.object({
  content: z.string().min(1, "Content cannot be empty"),
});

type ContributeFormValues = z.infer<typeof contributeSchema>;

const ContributeModal = ({
  scriptId,
  paragraphId,
  refetch,
  variant = "header",
  mode = "create",
  initialContent = "",
}: ContributeModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const navigate = useNavigate();

  const [submitParagraph, { loading: isSubmittingCreate }] = useSubmitParagraphMutation();
  const [editParagraph, { loading: isSubmittingEdit }] = useEditParagraphMutation();

  const isSubmitting = isSubmittingCreate || isSubmittingEdit;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isValid },
  } = useForm<ContributeFormValues>({
    resolver: zodResolver(contributeSchema),
    mode: "onChange",
    defaultValues: {
      content: initialContent,
    },
  });

  const currentContent = watch("content", "");

  const openModal = () => {
    reset({ content: initialContent });
    setIsPreview(false);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setIsPreview(false);
  };

  const onSubmit = async (data: ContributeFormValues) => {
    // 🚨 Payload is now just the pure content without injecting a markdown heading
    const finalPayload = data.content.trim();

    try {
      if (mode === "create") {
        if (!scriptId) throw new Error("Script ID missing for creation.");
        const response = await submitParagraph({
          variables: { scriptId, text: finalPayload },
        });

        posthog.capture("contribution_submitted", { script_id: scriptId });
        refetch();
        closeModal();

        const newParagraphId = response.data?.submitParagraph?.id;
        if (newParagraphId) {
          navigate(`/contribution/${scriptId}/${newParagraphId}`);
        } else {
          navigate(`/requests/${scriptId}`);
        }
      } else if (mode === "edit") {
        if (!paragraphId) throw new Error("Paragraph ID missing for edit.");
        await editParagraph({
          variables: { paragraphId, text: finalPayload },
        });
        posthog.capture("contribution_edited", { paragraph_id: paragraphId });
        refetch();
        closeModal();
      }
    } catch (error) {
      console.log(error);
      console.error(`Error ${mode === "create" ? "submitting" : "editing"} contribution:`, error);
      alert(`Failed to ${mode === "create" ? "submit" : "save"}. Please try again.`);
    }
  };

  const inputClass =
    "w-full px-4 py-3 rounded-xl border border-white/5 bg-white/5 text-gray-200 focus:bg-white/10 focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-all outline-none placeholder:text-gray-600 text-sm font-sans shadow-inner disabled:opacity-50 disabled:cursor-not-allowed";
  const labelClass =
    "flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest font-sans";

  return (
    <>
      {variant === "empty" ? (
        <button
          onClick={openModal}
          className="flex items-center justify-center gap-2 px-4 py-2 md:px-5 md:py-2.5 bg-gray-100 hover:bg-gray-200 border border-white/10 rounded-xl text-gray-800 text-sm md:text-base font-bold transition-all duration-300 shadow-sm active:scale-95 "
        >
          <Plus className="w-5 h-5" />
          Contribute
        </button>
      ) : variant === "edit" ? (
        <button
          onClick={openModal}
          title="Edit Contribution"
          className="flex items-center justify-center gap-2 px-4 py-2 md:px-5 md:py-2.5 bg-gray-100 hover:bg-gray-200 border border-white/10 rounded-xl text-gray-800 text-sm md:text-base font-bold transition-all duration-300 shadow-sm active:scale-95"
        >
          <Edit2 size={18} />
        </button>
      ) : (
        <button
          onClick={openModal}
          className="flex items-center justify-center gap-2 px-4 py-2 md:px-5 md:py-2.5 bg-gray-100 hover:bg-gray-200 border border-white/10 rounded-xl text-gray-800 text-sm md:text-base font-bold transition-all duration-300 shadow-sm active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          Add
        </button>
      )}

      <Dialog open={isOpen} onClose={closeModal} className="relative z-50 font-sans">
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-black/60 backdrop-blur-md transition duration-300 ease-out data-[closed]:opacity-0"
        />
        <div className="fixed inset-0 overflow-y-auto scrollbar-none">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <DialogPanel
              transition
              className="relative transform overflow-hidden rounded-2xl bg-primary text-left shadow-2xl transition duration-300 ease-out data-[closed]:opacity-0 data-[closed]:translate-y-4 data-[closed]:sm:translate-y-0 data-[closed]:sm:scale-95 sm:my-8 w-full max-w-5xl border border-white/10 p-5 md:p-6 md:space-y-6 space-y-5"
            >
              <div className="flex justify-between items-center ">
                <div>
                  <h3 className="text-white font-extrabold text-xl sm:text-2xl tracking-tight">
                    {mode === "create" ? "New Contribution" : "Edit Contribution"}
                  </h3>
                </div>
                <button
                  onClick={closeModal}
                  className=" text-gray-500 hover:text-white transition-colors"
                >
                  <X className="size-5 md:size-6" />
                </button>
              </div>
              <div className="border-b border-white/10" />

              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 ">
                <div className="flex flex-col">
                  <div className="flex items-center justify-between">
                    <label className={labelClass}>Content</label>
                    <button
                      type="button"
                      onClick={() => setIsPreview(!isPreview)}
                      className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors active:scale-95 text-gray-400 "

                    >
                      {isPreview ? (
                        <>
                          <Pen className="w-3.5 h-3.5" /> Edit
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5" /> Preview
                        </>
                      )}
                    </button>
                  </div>

                  <div className="relative h-[400px] w-full scrollbar-none">
                    <AnimatePresence mode="wait">
                      {isPreview ? (
                        <motion.div
                          key="preview-pane"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15, ease: "easeInOut" }}
                          className={clsx(
                            inputClass,
                            "absolute scrollbar-thin inset-0 h-full overflow-y-auto text-white font-medium text-[0.875rem] md:text-base leading-[1.7142857] md:leading-[1.75] whitespace-pre-wrap prose prose-invert prose-p:mb-4 prose-ul:list-disc prose-ul:ml-5 max-w-none"
                          )}
                        >
                          {currentContent ? (
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {currentContent}
                            </ReactMarkdown>
                          ) : (
                            <span className="text-gray-500 italic">
                              Nothing to preview...
                            </span>
                          )}
                        </motion.div>
                      ) : (
                        <motion.textarea
                          key="editor-pane"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15, ease: "easeInOut" }}
                          {...register("content")}
                          disabled={isSubmitting}
                          className={clsx(
                            inputClass,
                            "absolute inset-0 scrollbar-thin  h-full resize-none leading-relaxed font-mono caret-amber-500 block",
                            errors.content &&
                            "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20"
                          )}
                          placeholder="Write the next sequence here... (Markdown formatting is supported)"
                        />
                      )}
                    </AnimatePresence>
                  </div>
                  {errors.content && (
                    <p className="text-red-400 text-xs mt-1.5 ml-1 font-mono">
                      {errors.content.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!isValid || isSubmitting}
                  className="group flex items-center mx-auto justify-center w-full md:w-[140px] gap-2 px-6 py-3 rounded-xl bg-white text-black hover:bg-gray-200 text-sm font-bold disabled:opacity-50 font-mono disabled:shadow-none disabled:hover:bg-white transition-all tracking-wide active:scale-95"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin text-black" />
                  ) : mode === "edit" ? (
                    <>
                      <Save className="w-5 h-5 ml-1" />
                      Save
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5 ml-1" />
                      Submit
                    </>
                  )}
                </button>
              </form>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </>
  );
};

export default ContributeModal;