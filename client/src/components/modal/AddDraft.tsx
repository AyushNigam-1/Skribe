import React, { useState } from "react";
import { useMutation } from "@apollo/client";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogPanel,
  DialogBackdrop,
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
import clsx from "clsx";
import { X, ChevronDown, Check, Loader2, Plus } from "lucide-react";
import { ADD_SCRIPT } from "../../graphql/mutation/scriptMutations";
import { posthog } from "../../providers/PostHogProvider";
import { Option, VisibilityOption } from "../../types";

const visibilityOptions: VisibilityOption[] = [
  {
    id: 1,
    name: "Public",
    description: "Open to the world for reading and collaboration",
  },
  {
    id: 2,
    name: "Private",
    description: "A personal draft, visible only to you",
  },
  {
    id: 3,
    name: "Unlisted",
    description: "Accessible only via a direct, hidden link",
  },
];

const genreOptions: Option[] = [
  { id: 1, name: "Fantasy" },
  { id: 2, name: "Mystery" },
  { id: 3, name: "Sci-Fi" },
  { id: 4, name: "Horror" },
  { id: 5, name: "Thriller" },
  { id: 6, name: "Romance" },
  { id: 7, name: "Drama" },
  { id: 8, name: "Adventure" },
];

const languageOptions: Option[] = [
  { id: 1, name: "English" },
  { id: 2, name: "Spanish" },
  { id: 3, name: "French" },
  { id: 4, name: "German" },
  { id: 5, name: "Hindi" },
  { id: 6, name: "Japanese" },
  { id: 7, name: "Korean" },
];

// --- Zod Validation Schema ---
const draftSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title is too long"),
  description: z.string().min(1, "Description is required"),
  genres: z.array(z.any()).min(1, "Select at least one genre"),
  language: z.any().nullable().refine((val) => val !== null, "Select a language"),
  visibility: z.any(),
});

type DraftFormValues = z.infer<typeof draftSchema>;

const Add = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const [addScript, { loading }] = useMutation(ADD_SCRIPT);

  // --- React Hook Form Setup ---
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isValid },
  } = useForm<DraftFormValues>({
    resolver: zodResolver(draftSchema),
    mode: "onChange",
    defaultValues: {
      title: "",
      description: "",
      genres: [],
      language: null,
      visibility: visibilityOptions[0], // Default to Public
    },
  });

  const handleClose = () => {
    setOpen(false);
    // Add a slight delay to reset so the form doesn't empty out while animating closed
    setTimeout(() => {
      reset();
    }, 300);
  };

  const onSubmit = async (data: DraftFormValues) => {
    const genres = data.genres.map((g: any) => g.name);
    const languages = data.language ? [data.language.name] : [];

    try {
      const res = await addScript({
        variables: {
          title: data.title,
          visibility: data.visibility.name,
          languages,
          genres,
          description: data.description,
        },
      });

      const scriptId = res.data.createScript.id;

      posthog.capture("draft_created", {
        script_id: scriptId,
        visibility: data.visibility.name,
        genre_count: genres.length,
        has_language: languages.length > 0,
      });

      handleClose();
      navigate(`/timeline/${scriptId}`);
    } catch (err) {
      console.error("Failed to create draft:", err);
      alert("Failed to create the manuscript. Please try again.");
    }
  };

  // --- Responsive Theme Classes ---
  const inputClass =
    "w-full px-3 py-2.5 md:px-4 md:py-3 rounded-xl border border-white/10 bg-white/5 text-gray-200 focus:bg-white/10 focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-all outline-none placeholder:text-gray-500 text-sm font-mono shadow-inner font-medium disabled:opacity-50";

  const labelClass =
    "block font-semibold text-gray-400 mb-1 md:mb-1.5 text-[11px] md:text-xs font-mono uppercase tracking-widest";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-center gap-2 px-4 py-2 md:px-5 bg-gray-100 hover:bg-gray-200 border border-white/10 rounded-xl text-gray-800 text-sm md:text-base font-bold transition-all duration-300 shadow-sm active:scale-95"
      >
        <Plus className="w-4 h-4 md:w-5 md:h-5" />
        Create
      </button>

      <Dialog
        open={open}
        as="div"
        className="relative z-50"
        onClose={handleClose}
      >
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in"
        />

        <div className="fixed inset-0 z-10 w-screen overflow-y-auto scrollbar-none">
          <div className="flex min-h-full items-center justify-center p-3 sm:p-4 text-center">
            <DialogPanel
              transition
              className="relative transform rounded-2xl md:rounded-3xl overflow-hidden bg-primary text-left shadow-2xl transition duration-300 ease-out data-[closed]:opacity-0 data-[closed]:translate-y-4 data-[closed]:sm:translate-y-0 data-[closed]:sm:scale-95 w-full max-w-2xl border border-white/10 p-5 md:p-6 md:space-y-6 space-y-5"
            >
              <div className="flex justify-between items-center  ">
                <h3 className="text-lg md:text-xl font-extrabold text-white tracking-tight font-sans">
                  New Draft
                </h3>
                <button
                  onClick={handleClose}
                  className="text-gray-500 hover:text-white transition-colors outline-none"
                >
                  <X className="size-5 md:size-6" />
                </button>
              </div>
              <div className="border-b border-white/10" />
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="flex flex-col gap-5 md:gap-6 "
              >
                <div>
                  <label className={labelClass}>Title</label>
                  <input
                    {...register("title")}
                    disabled={loading}
                    autoFocus
                    placeholder="The epic tale of..."
                    className={clsx(
                      inputClass,
                      errors.title && "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20"
                    )}
                  />
                  {errors.title && (
                    <p className="text-red-400 text-xs mt-1.5 ml-1 font-mono">
                      {errors.title.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6">
                  <div>
                    <label className={labelClass}>Genres</label>
                    <Controller
                      name="genres"
                      control={control}
                      render={({ field }) => (
                        <Listbox value={field.value} onChange={field.onChange} multiple disabled={loading}>
                          <div className="relative">
                            <ListboxButton
                              className={clsx(
                                inputClass,
                                "flex justify-between items-center text-left",
                                errors.genres && "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20"
                              )}
                            >
                              <span className="truncate pr-2">
                                {field.value.length > 0
                                  ? field.value.map((g: any) => g.name).join(", ")
                                  : "Select genres"}
                              </span>
                              <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />
                            </ListboxButton>

                            <ListboxOptions
                              transition
                              className="absolute z-20 mt-2 w-full bg-primary border border-white/10 rounded-xl shadow-2xl max-h-48 md:max-h-60 overflow-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent origin-top transition duration-200 ease-out data-[closed]:scale-95 data-[closed]:opacity-0"
                            >
                              {genreOptions.map((genre) => (
                                <ListboxOption
                                  key={genre.id}
                                  value={genre}
                                  className="cursor-pointer px-4 py-2.5 md:py-3 hover:bg-white/5 flex justify-between text-gray-300 font-mono text-xs md:text-sm transition-colors"
                                >
                                  {({ selected }) => (
                                    <>
                                      <span className={selected ? "text-white font-bold" : ""}>
                                        {genre.name}
                                      </span>
                                      {selected && <Check className="w-4 h-4 text-white shrink-0" />}
                                    </>
                                  )}
                                </ListboxOption>
                              ))}
                            </ListboxOptions>
                          </div>
                        </Listbox>
                      )}
                    />
                    {errors.genres && (
                      <p className="text-red-400 text-xs mt-1.5 ml-1 font-mono">
                        {errors.genres.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className={labelClass}>Language</label>
                    <Controller
                      name="language"
                      control={control}
                      render={({ field }) => (
                        <Listbox value={field.value} onChange={field.onChange} disabled={loading}>
                          <div className="relative">
                            <ListboxButton
                              className={clsx(
                                inputClass,
                                "flex justify-between items-center text-left",
                                errors.language && "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20"
                              )}
                            >
                              <span className="truncate pr-2">
                                {field.value?.name || "Select language"}
                              </span>
                              <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />
                            </ListboxButton>

                            <ListboxOptions
                              transition
                              className="absolute z-20 mt-2 w-full bg-primary border border-white/10 rounded-xl shadow-2xl max-h-48 md:max-h-60 overflow-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent origin-top transition duration-200 ease-out data-[closed]:scale-95 data-[closed]:opacity-0"
                            >
                              {languageOptions.map((language) => (
                                <ListboxOption
                                  key={language.id}
                                  value={language}
                                  className="cursor-pointer px-4 py-2.5 md:py-3 hover:bg-white/5 flex justify-between text-gray-300 font-mono text-xs md:text-sm transition-colors"
                                >
                                  {({ selected }) => (
                                    <>
                                      <span className={selected ? "text-white font-bold" : ""}>
                                        {language.name}
                                      </span>
                                      {selected && <Check className="w-4 h-4 text-white shrink-0" />}
                                    </>
                                  )}
                                </ListboxOption>
                              ))}
                            </ListboxOptions>
                          </div>
                        </Listbox>
                      )}
                    />
                    {errors.language?.message && (
                      <p className="text-red-400 text-xs mt-1.5 ml-1 font-mono">
                        {errors.language.message.toString()}
                      </p>
                    )}
                  </div>
                </div>

                {/* Visibility (Controller for Headless UI) */}
                <div>
                  <label className={labelClass}>Visibility</label>
                  <Controller
                    name="visibility"
                    control={control}
                    render={({ field }) => (
                      <Listbox value={field.value} onChange={field.onChange} disabled={loading}>
                        <div className="relative">
                          <ListboxButton
                            className={clsx(
                              inputClass,
                              "flex justify-between items-center",
                            )}
                          >
                            {field.value.name}
                            <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />
                          </ListboxButton>

                          <ListboxOptions
                            transition
                            className="absolute z-20 mt-2 w-full bg-primary border border-white/10 rounded-xl shadow-2xl overflow-y-auto max-h-60 py-1 origin-top transition duration-200 ease-out data-[closed]:scale-95 data-[closed]:opacity-0"
                          >
                            {visibilityOptions.map((v) => (
                              <ListboxOption
                                key={v.id}
                                value={v}
                                className="cursor-pointer px-4 py-2.5 md:py-3 hover:bg-white/5 flex flex-col transition-colors"
                              >
                                {({ selected }) => (
                                  <div className="flex justify-between items-center w-full">
                                    <div className="flex flex-col pr-4">
                                      <span
                                        className={`font-mono text-xs md:text-sm ${selected ? "text-white font-bold" : "text-gray-300"}`}
                                      >
                                        {v.name}
                                      </span>
                                      <span className="text-[11px] md:text-xs text-gray-500 mt-0.5 font-sans leading-tight">
                                        {v.description}
                                      </span>
                                    </div>
                                    {selected && <Check className="w-4 h-4 text-white shrink-0" />}
                                  </div>
                                )}
                              </ListboxOption>
                            ))}
                          </ListboxOptions>
                        </div>
                      </Listbox>
                    )}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className={labelClass}>Description</label>
                  <textarea
                    {...register("description")}
                    rows={4}
                    disabled={loading}
                    placeholder="Write a brief overview..."
                    className={clsx(
                      inputClass,
                      "resize-none",
                      errors.description && "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20"
                    )}
                  />
                  {errors.description && (
                    <p className="text-red-400 text-xs mt-1.5 ml-1 font-mono">
                      {errors.description.message}
                    </p>
                  )}
                </div>

                <hr className="border-b border-white/5 hidden md:block" />

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading || !isValid}
                  className="flex items-center mx-0 sm:mx-auto font-mono justify-center w-full sm:w-[140px] gap-2 px-6 py-3 sm:py-2.5 rounded-xl bg-white text-black hover:bg-gray-200 text-sm font-bold transition-all disabled:opacity-50 active:scale-95"
                >
                  {loading ? (
                    <Loader2 className="size-5 animate-spin text-black" />
                  ) : (
                    <>
                      <Plus size={18} className="md:w-5 md:h-5" />
                      Create
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

export default Add;