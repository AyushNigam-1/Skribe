import { useState, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import { motion, Variants, AnimatePresence, Transition } from "framer-motion";
import { toast } from "sonner";
import { z } from "zod";
import {
  AlignLeft, User, Globe, Calendar, FileText,
  Languages, Tags, Edit2, Loader2, X, Check, Users,
  Sparkles,
} from "lucide-react";

import { useUpdateScriptMutation } from "../../graphql/generated/graphql";
import { ScriptDetailsContext } from "../../types";

type EditField = "title" | "description" | "genres" | "languages" | null;

const MAX_TAGS = 4;

const editSchemas = {
  title: z.string().min(1, "Title cannot be empty").max(120, "Title cannot exceed 120 characters"),
  description: z.string().max(2500, "Description cannot exceed 2500 characters").optional().or(z.literal("")),
  genres: z.array(z.string().min(1, "Genre cannot be empty").max(30, "Genre name too long")).max(MAX_TAGS, `Maximum of ${MAX_TAGS} genres allowed`),
  languages: z.array(z.string().min(1, "Language cannot be empty").max(30, "Language name too long")).max(MAX_TAGS, `Maximum of ${MAX_TAGS} languages allowed`),
};

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: [0.25, 1, 0.5, 1] } },
};

const fieldTransition: Transition = { duration: 0.25, ease: "easeInOut" };
const fieldVariants = {
  hidden: { opacity: 0, y: 4, filter: "blur(2px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -4, filter: "blur(2px)" }
};

const cardClass = "bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col hover:border-white/20 transition-colors gap-2 sm:gap-3";
const headerClass = "flex items-center gap-2 sm:gap-2.5  font-semibold text-gray-500 ";

const EditingBadge = ({ isEditing, field }: { isEditing: boolean; field?: string }) => (
  <AnimatePresence>
    {isEditing && (
      <motion.span
        data-testid={`editing-badge-${field}`}
        initial={{ opacity: 0, x: -8, filter: "blur(2px)" }}
        animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, x: -8, filter: "blur(2px)" }}
        transition={{ duration: 0.2 }}
        className="ml-1 px-1.5 py-0.5 rounded text-xs text-gray-200 bg-white/5 animate-pulse normal-case tracking-normal"
      >
        Editing...
      </motion.span>
    )}
  </AnimatePresence>
);

const ReadOnlyCard = ({ icon: Icon, label, value, isCapitalized = false }: { icon: any, label: string, value: string | number, isCapitalized?: boolean }) => (
  <motion.div data-testid={`readonly-card-${label.toLowerCase()}`} variants={itemVariants} className={cardClass}>
    <h3 className={headerClass}>
      <Icon className="size-4" />
      {label}
    </h3>
    <p data-testid={`readonly-value-${label.toLowerCase()}`} className={`text-gray-300 font-bold font-sans text-xl ${isCapitalized ? "capitalize" : ""}`}>
      {value}
    </p>
  </motion.div>
);

const EditControls = ({ field, editingField, isUpdating, onEdit, onCancel, onSave }: any) => (
  <div className="ml-auto relative flex items-center justify-end min-w-[48px] min-h-[20px]">
    <AnimatePresence mode="wait" initial={false}>
      {editingField !== field ? (
        <motion.button
          data-testid={`edit-btn-${field}`}
          key="edit"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1 }}
          onClick={() => onEdit(field)}
          className="text-gray-500 hover:text-gray-200 transition-colors outline-none"
        >
          <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
        </motion.button>
      ) : (
        <motion.div key="actions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1 }} className="flex items-center gap-3">
          <button data-testid={`cancel-btn-${field}`} onClick={onCancel} disabled={isUpdating} className="text-gray-500 hover:text-gray-200 transition-colors disabled:opacity-50 outline-none" title="Cancel">
            <X className="w-4 h-4 shrink-0" />
          </button>
          <button data-testid={`save-btn-${field}`} onClick={() => onSave(field)} disabled={isUpdating} className="text-green-500 hover:text-green-400 transition-colors disabled:opacity-50 outline-none" title="Save changes">
            {isUpdating ? <Loader2 className="size-8 shrink-0 animate-spin" /> : <Check className="w-4 h-4 shrink-0 stroke-[3]" />}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  </div >
);

const EditableCard = ({
  field, label, icon: Icon, value, arrayValue, isArray, colSpan, placeholder, textClassName,
  isAuthorized, editingField, editControlProps, editRef, handleKeyDown
}: any) => {
  const isEditing = editingField === field;

  return (
    <motion.div variants={itemVariants} className={`${cardClass} ${colSpan ? "md:col-span-2" : ""}`}>
      <div className="flex justify-between items-center w-full">
        <h3 className={headerClass}>
          <Icon className="size-4" />
          {label}
          {isArray && <span className="ml-1 px-1.5 py-0.5 rounded-md bg-black/20 text-[10px] text-gray-500 normal-case tracking-normal">max {MAX_TAGS}</span>}
          <EditingBadge isEditing={isEditing} field={field} />
        </h3>
        {
        {isAuthorized && <EditControls field={field} {...editControlProps} />}
      </div>

      {isArray ? (
        <AnimatePresence mode="popLayout">
          {isEditing ? (
            <motion.div
              data-testid={`editable-input-${field}`}
              key={`${field}-edit`}
              variants={fieldVariants} initial="hidden" animate="visible" exit="exit" transition={fieldTransition}
              ref={editRef}
              contentEditable
              suppressContentEditableWarning
              onKeyDown={(e) => handleKeyDown(e, field)}
              className="text-sm sm:text-base font-sans outline-none whitespace-pre-wrap break-words w-full"
            >
              {arrayValue?.join(", ") || ""}
            </motion.div>
          ) : (
            <motion.div
              key={`${field}-view`}
              variants={fieldVariants} data-testid={`editable-view-${field}`} initial="hidden" animate="visible" exit="exit" transition={fieldTransition}
              className="flex gap-2 flex-wrap border border-transparent w-full"
            >
              {arrayValue?.length
                ? arrayValue.slice(0, MAX_TAGS).map((item: string, i: number) => (
                  <span key={i} data-testid={`array-item-${field}-${i}`} className="px-2.5 sm:px-3 py-1 bg-white/5 text-gray-300 rounded-md text-xs sm:text-sm font-semibold border border-white/10 font-sans">{item}</span>
                ))
                : <span data-testid={`empty-array-${field}`} className="text-gray-500 italic text-sm sm:text-base font-sans">None</span>
              }
            </motion.div>
          )}
        </AnimatePresence>
      ) : (
        <div
          ref={isEditing ? editRef : undefined}
          key={`${field}-${isEditing ? 'edit' : 'view'}`}
          contentEditable={isEditing}
          suppressContentEditableWarning
          data-testid={isEditing ? `editable-input-${field}` : `editable-view-${field}`}
          onKeyDown={(e) => handleKeyDown(e, field)}
          className={`text-gray-300 font-bold font-sans text-xl outline-none whitespace-pre-wrap break-words w-full transition-all duration-300 ${textClassName || "font-semibold"}`}
        >
          {value || placeholder}
        </div>
      )}
    </motion.div>
  );
};


const ScriptDetails = () => {
  const { data, loading, isEditorOrOwner } = useOutletContext<ScriptDetailsContext>();
  const script = data?.getScriptById;

  const [updateScript, { loading: isUpdating }] = useUpdateScriptMutation();
  const [editingField, setEditingField] = useState<EditField>(null);
  const editRef = useRef<HTMLDivElement>(null);

  const uniqueContributorsCount = new Set(
    script?.paragraphs?.map((p: any) => p.author?.id || p.author?.name).filter(Boolean)
  ).size;

  const handleEditClick = (field: EditField) => {
    setEditingField(field);
    setTimeout(() => {
      if (editRef.current) {
        editRef.current.focus();
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(editRef.current);
        range.collapse(false);
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }, 50);
  };

  const handleCancelEdit = () => setEditingField(null);

  const handleSave = (field: EditField) => {
    if (!script || !editRef.current || !field) return;
    const rawText = editRef.current.innerText.trim();
    let variables: any = { scriptId: script.id };

    try {
      if (field === "title") {
        variables.title = editSchemas.title.parse(rawText);
      } else if (field === "description") {
        variables.description = editSchemas.description.parse(rawText);
      } else if (field === "genres") {
        const parsedArray = rawText.split(",").map((g) => g.trim()).filter(Boolean);
        variables.genres = editSchemas.genres.parse(parsedArray);
      } else if (field === "languages") {
        const parsedArray = rawText.split(",").map((l) => l.trim()).filter(Boolean);
        variables.languages = editSchemas.languages.parse(parsedArray);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error((error as z.ZodError<any>).issues[0].message);
        return;
      }
    }

    const promise = updateScript({
      variables,
      update(cache, { data }) {

        if (!updateScript) return;
        cache.modify({
          id: cache.identify(data!.updateScript),
          fields: {
            title: (e) => data!.updateScript.title ?? e,
            description: (e) => data!.updateScript.description ?? e,
            genres: (e) => data!.updateScript.genres ?? e,
            languages: (e) => data!.updateScript.languages ?? e,
          },
        });
      },
    }).then(() => setEditingField(null));

    toast.promise(promise, {
      loading: "Saving...",
      success: `${field.charAt(0).toUpperCase() + field.slice(1)} updated!`,
      error: "Failed to save.",
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent, field: EditField) => {
    if (e.key === "Escape") handleCancelEdit();
    if (e.key === "Enter") {
      if (field === "description") {
        if (e.metaKey || e.ctrlKey) { e.preventDefault(); handleSave(field); }
      } else {
        e.preventDefault();
        handleSave(field);
      }
    }
  };

  if (loading && !script) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-center items-center w-full min-h-[70dvh]">
        <Loader2 className="size-8 shrink-0 animate-spin" />
      </motion.div>
    );
  }

  const formatDate = (isoString?: string) => {
    if (!isoString) return "Unknown Date";
    return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" }).format(new Date(Number(isoString)));
  };

  const sharedEditProps = {
    isAuthorized: isEditorOrOwner,
    editingField,
    editControlProps: { editingField, isUpdating, onEdit: handleEditClick, onCancel: handleCancelEdit, onSave: handleSave },
    editRef,
    handleKeyDown,
  };

  return (
    <motion.div
      key={script?.id || "details-container"}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      id="details"
      className="grid grid-cols-1 md:grid-cols-2 gap-3 py-2 sm:gap-4 md:gap-5 w-full mx-auto font-mono"
    >
      <EditableCard
        field="title"
        label="Title"
        icon={Sparkles}
        value={script?.title}
        placeholder="Untitled Draft"
        textClassName=" font-bold"
        {...sharedEditProps}
      />

      <ReadOnlyCard icon={User} label="Author" value={script?.author?.name ? `${script.author.name}` : "Unknown"} />
      <ReadOnlyCard icon={Calendar} label="Published" value={formatDate(script?.createdAt)} />
      <ReadOnlyCard icon={Globe} label="Visibility" value={script?.visibility || "Unknown"} isCapitalized />
      <ReadOnlyCard icon={FileText} label="Contributions" value={script?.paragraphs?.length || 0} />
      <ReadOnlyCard icon={Users} label="Contributors" value={uniqueContributorsCount} />

      <EditableCard
        field="genres"
        label="Genres"
        icon={Tags}
        isArray
        arrayValue={script?.genres}
        {...sharedEditProps}
      />

      <EditableCard
        field="languages"
        label="Languages"
        icon={Languages}
        isArray
        arrayValue={script?.languages}
        {...sharedEditProps}
      />

      <EditableCard
        field="description"
        label="Description"
        icon={AlignLeft}
        value={script?.description}
        placeholder="No synopsis provided for this draft."
        colSpan
        textClassName="text-lg font-normal text-gray-400"
        {...sharedEditProps}
      />
    </motion.div>
  );
};

export default ScriptDetails;