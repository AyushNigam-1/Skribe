import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
  User, Languages, AlignLeft, Mail, Heart, Eye, MapPin, CalendarDays, AlertCircle, Loader2, Edit2, Check, FileText, X,
  Lock,
  FileXCorner
} from "lucide-react";
import { z } from "zod";

import {
  useGetUserProfileQuery,
  useGetUserScriptsQuery,
  useUpdateUserProfileFieldMutation,
  useLikeProfileMutation,
  useViewProfileMutation,
} from "../../graphql/generated/graphql";

import { useUserStore } from "../../store/useAuthStore";
import Add from "../../components/modal/AddDraft";
import DraftCard from "../../components/card/DraftCard";
import { toast } from "sonner";
import PlaceholderState from "../../components/PlaceholderState";

const profileSchemas = {
  name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name cannot exceed 50 characters"),
  email: z.email("Please enter a valid email address"),
  languages: z.string().max(100, "Languages list is too long"),
  bio: z.string().max(500, "Bio cannot exceed 500 characters"),
};

const EditControls = ({
  field, editingField, isUpdating, onEdit, onCancel, onSave,
}: {
  field: string;
  editingField: string | null;
  isUpdating: boolean;
  onEdit: (f: string) => void;
  onCancel: () => void;
  onSave: (f: string) => void;
}) => (
  <div className="ml-auto relative flex items-center justify-end min-w-[48px] min-h-[20px]">
    <AnimatePresence mode="wait" initial={false}>
      {editingField !== field ? (
        <motion.button
          key="edit"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
          onClick={() => onEdit(field)}
          className="text-gray-500 hover:text-gray-200 transition-colors outline-none"
        >
          <Edit2 className="w-4 h-4 shrink-0" />
        </motion.button>
      ) : (
        <motion.div
          key="actions"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
          className="flex items-center gap-3"
        >
          <button
            onClick={onCancel}
            disabled={isUpdating}
            className="text-gray-500 hover:text-gray-200 transition-colors disabled:opacity-50 outline-none"
            title="Cancel"
          >
            <X className="w-4 h-4 shrink-0" />
          </button>

          <button
            onClick={() => onSave(field)}
            disabled={isUpdating}
            className="text-green-500 hover:text-green-400 transition-colors disabled:opacity-50 outline-none"
            title="Save changes"
          >
            {isUpdating ? (
              <Loader2 className="size-8 shrink-0 animate-spin" />
            ) : (
              <Check className="w-4 h-4 shrink-0 stroke-[3]" />
            )}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

const Profile = () => {
  const { id } = useParams<{ id: string }>();

  const { user: currentUser } = useUserStore();
  const isOwnProfile = currentUser?.id === id;
  const [updateProfileField] = useUpdateUserProfileFieldMutation();

  const [editingField, setEditingField] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const editRef = useRef<HTMLDivElement>(null);

  const [localProfileLikes, setLocalProfileLikes] = useState<string[]>([]);
  const [localProfileViews, setLocalProfileViews] = useState<string[]>([]);

  const { data: profileData, loading: profileLoading, error: profileError } = useGetUserProfileQuery({
    variables: { id: id || "" },
    skip: !id,
    fetchPolicy: "cache-and-network"
  });

  const userProfile = profileData?.getUserProfile;
  const profileid = userProfile?.id;

  useEffect(() => {
    if (userProfile) {
      const likesList = (userProfile.likes?.filter(Boolean).map(String)) || [];
      const viewsList = (userProfile.views?.filter(Boolean).map(String)) || [];

      setLocalProfileLikes(likesList);
      setLocalProfileViews(viewsList);
    }
  }, [userProfile]);

  const [likeProfile, { loading: isLikingProfile }] = useLikeProfileMutation();
  const [viewProfile] = useViewProfileMutation();

  useEffect(() => {
    if (id && currentUser?.id && !isOwnProfile) {
      viewProfile({ variables: { profileId: id } })
        .then(() => {
          setLocalProfileViews((prev) => (prev.includes(currentUser.id) ? prev : [...prev, currentUser.id]));
        })
        .catch((err) => console.error("View profile error ignored:", err));
    }
  }, [id, currentUser?.id, isOwnProfile, viewProfile]);

  const handleLikeProfile = async (e: React.MouseEvent) => {
    e.preventDefault();

    if (!currentUser?.id) return toast.error("Please log in to like profiles.");
    if (isOwnProfile) return;

    const prevLikes = [...localProfileLikes];
    const isLiked = localProfileLikes.includes(currentUser.id);

    if (isLiked) {
      setLocalProfileLikes(prevLikes.filter((uid) => uid !== currentUser.id));
    } else {
      setLocalProfileLikes([...prevLikes, currentUser.id]);
    }

    try {
      await likeProfile({ variables: { profileId: id || "" } });
    } catch (err) {
      setLocalProfileLikes(prevLikes);
      console.error("Failed to like profile:", err);
    }
  };

  const { data: scriptsData, loading: scriptsLoading, error: scriptsError, refetch } = useGetUserScriptsQuery({
    variables: { userId: profileid || "" },
    skip: !profileid,
    fetchPolicy: "cache-and-network",
  });

  const isCompletelyLoading = (!profileData && profileLoading) || (!scriptsData && scriptsLoading);

  const scripts = scriptsData?.getUserScripts;
  const hasScripts = scripts && scripts.length > 0;

  useLayoutEffect(() => {
    if (!editingField || !editRef.current) return;

    requestAnimationFrame(() => {
      if (editRef.current) {
        editRef.current.focus();
        try {
          const range = document.createRange();
          const sel = window.getSelection();
          range.selectNodeContents(editRef.current);
          range.collapse(false);
          sel?.removeAllRanges();
          sel?.addRange(range);
        } catch (e) {
          // Ignore selection errors on empty nodes
        }
      }
    });
  }, [editingField]);

  const handleEditStart = (fieldId: string) => setEditingField(fieldId);
  const handleCancelEdit = () => setEditingField(null);

  const handleSave = async (fieldId: string) => {
    if (!editRef.current) return;
    const rawText = editRef.current.innerText.trim();

    let validation;
    if (fieldId === "name") validation = profileSchemas.name.safeParse(rawText);
    else if (fieldId === "email") validation = profileSchemas.email.safeParse(rawText);
    else if (fieldId === "languages") validation = profileSchemas.languages.safeParse(rawText);
    else if (fieldId === "bio") validation = profileSchemas.bio.safeParse(rawText);

    if (validation && !validation.success) {
      toast.error(validation.error.issues[0].message);
      return;
    }

    setIsUpdating(true);
    const promise = updateProfileField({
      variables: { key: fieldId, value: rawText },
    }).then(() => setEditingField(null)).finally(() => setIsUpdating(false));

    toast.promise(promise, {
      loading: "Saving...",
      success: "Profile updated!",
      error: "Failed to save changes.",
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent, fieldId: string) => {
    if (e.key === "Escape") handleCancelEdit();
    if (e.key === "Enter") {
      if (fieldId === "bio") {
        if (e.metaKey || e.ctrlKey) { e.preventDefault(); handleSave(fieldId); }
      } else {
        e.preventDefault();
        handleSave(fieldId);
      }
    }
  };

  const pageVariants: Variants = {
    fadeInit: { opacity: 0, y: 15 },
    fadeShow: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut", staggerChildren: 0.1 } },
    fadeExit: { opacity: 0, y: -15, transition: { duration: 0.3 } },
  };

  const itemVariants: Variants = {
    fadeInit: { opacity: 0, y: 15 },
    fadeShow: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  };

  const userDetails = [
    { id: "name", title: "Full Name", value: userProfile?.name || "", icon: User, editable: true },
    { id: "email", title: "Email", value: userProfile?.email || "", icon: Mail, editable: true },
    { id: "languages", title: "Languages", value: userProfile?.languages?.join(", ") || "", icon: Languages, editable: true, isArray: true },
    { id: "bio", title: "Bio", value: userProfile?.bio || "", icon: AlignLeft, editable: true },
  ];

  const statsInfo = [
    { title: "Profile Views", value: localProfileViews.length, icon: Eye },
    { title: "Total Likes", value: localProfileLikes.length, icon: Heart },
  ];

  const initial = userProfile?.name?.charAt(0).toUpperCase() || "?";

  return (
    <div className="w-full max-w-7xl mx-auto font-mono">
      <AnimatePresence mode="wait">
        {isCompletelyLoading ? (
          <motion.div key="profile-loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center w-full min-h-[96dvh] gap-4">
            <Loader2 className="size-8 shrink-0 animate-spin" />
          </motion.div>
        ) : profileError ? (
          <PlaceholderState
            icon={Lock}
            title="Authentication Required"
            description="Please sign in to view and manage your contributions."
            action={
              <Link
                to="/login"
                className="flex items-center justify-center px-6 py-3 bg-white hover:bg-gray-200 text-black rounded-xl transition-all duration-300 font-bold text-sm active:scale-95"
              >
                Sign In to Continue
              </Link>
            }
          />

        ) : (
          <motion.div key="profile-content" variants={pageVariants} initial="fadeInit" animate="fadeShow" exit="fadeExit" className="flex flex-col gap-6 w-full">
            <div className="flex flex-col lg:flex-row gap-4">

              <motion.div variants={itemVariants} className="w-full lg:w-80 flex flex-col gap-4 shrink-0">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-lg flex flex-col items-center text-center gap-4 relative overflow-hidden">
                  <div className="w-40 h-40 rounded-full bg-gradient-to-br from-gray-500 to-purple-600 flex items-center justify-center text-white text-6xl font-black shadow-inner border-4 border-white/10 relative z-10 ">
                    {initial}
                  </div>
                  <div className="relative z-10">
                    <h2 className="text-2xl font-bold text-white tracking-wide">{userProfile?.name}</h2>
                    <p className="text-sm text-gray-400 font-medium mt-1">@{userProfile?.username}</p>
                  </div>
                  <div className="flex flex-col gap-2 w-full text-sm text-gray-400 font-medium relative z-10">
                    <div className="flex items-center justify-center gap-2 py-2 px-4 bg-white/5 rounded-xl border border-white/5">
                      <MapPin className="w-4 h-4 text-gray-500" /> Earth
                    </div>
                    <div className="flex items-center justify-center gap-2 py-2 px-4 bg-white/5 rounded-xl border border-white/5">
                      <CalendarDays className="w-4 h-4 text-gray-500" /> Joined recently
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-5 rounded-3xl shadow-lg flex flex-col gap-4">
                  <div className="flex flex-col gap-3">
                    {statsInfo.map((stat, idx) => {
                      const Icon = stat.icon;
                      return (
                        <div key={idx} className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-2xl">
                          <div className="flex items-center gap-2 text-gray-300 font-medium text-sm">
                            <Icon className="w-5 h-5 text-gray-400" />
                            {stat.title}
                          </div>
                          <span className="text-lg font-bold text-white">{stat.value}</span>
                        </div>
                      );
                    })}
                  </div>

                  {!isOwnProfile && (
                    <div className="flex flex-col gap-3">
                      <button
                        onClick={handleLikeProfile}
                        disabled={isLikingProfile}
                        className={`flex items-center justify-center gap-2 w-full py-3 border font-bold rounded-2xl transition-all active:scale-95 ${localProfileLikes.includes(currentUser?.id || "") ? "bg-white/10 border-white/20 text-white" : "bg-white/5 hover:bg-white/10 border-white/10 text-gray-200"}`}
                      >
                        <Heart className={`w-5 h-5 ${localProfileLikes.includes(currentUser?.id || "") ? "fill-pink-500 text-pink-500" : "text-pink-500"}`} />
                        {localProfileLikes.includes(currentUser?.id || "") ? "Liked" : "Like Profile"}
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="flex-1 bg-white/5 backdrop-blur-xl border border-white/10 p-6 md:p-8 rounded-3xl shadow-lg">
                <h3 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-4 tracking-tight">About</h3>

                <div className="flex flex-col gap-8">
                  {userDetails.map((detail) => {
                    const Icon = detail.icon;
                    const isEditingThis = editingField === detail.id;

                    return (
                      <div key={detail.id} className="flex flex-col gap-2">

                        <div className="flex items-center justify-between w-full">
                          <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-500 uppercase tracking-widest">
                            <Icon className="w-4 h-4 text-gray-400" />
                            {detail.title}
                            <AnimatePresence>
                              {isEditingThis && (
                                <motion.span
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
                          </h4>

                          {isOwnProfile && detail.editable && (
                            <EditControls
                              field={detail.id}
                              editingField={editingField}
                              isUpdating={isUpdating}
                              onEdit={handleEditStart}
                              onCancel={handleCancelEdit}
                              onSave={handleSave}
                            />
                          )}
                        </div>

                        <div className="w-full min-h-[32px]">
                          {detail.isArray ? (
                            isEditingThis ? (
                              <div
                                key={`edit-${detail.id}`}
                                ref={editRef}
                                contentEditable
                                suppressContentEditableWarning
                                onKeyDown={(e) => handleKeyDown(e, detail.id)}
                                data-placeholder="e.g. English, Spanish"
                                className="text-gray-200  font-sans outline-none whitespace-pre-wrap break-words w-full empty:before:content-[attr(data-placeholder)] empty:before:text-gray-500 empty:before:italic empty:before:pointer-events-none"
                              >
                                {detail.value}
                              </div>
                            ) : (
                              <div key={`view-${detail.id}`} className="flex gap-2 flex-wrap w-full">
                                {detail.value ? (
                                  detail.value.split(", ").map((item: string, i: number) => (
                                    <span key={i} className="px-2.5 sm:px-3 py-1 bg-white/5 text-gray-300 rounded-md text-sm font-semibold border border-white/10 font-sans">{item}</span>
                                  ))
                                ) : (
                                  <span className="text-gray-500 italic text-[15px] sm:text-base font-sans">
                                    {isOwnProfile ? `Click edit to add your ${detail.title.toLowerCase()}` : "Not provided"}
                                  </span>
                                )}
                              </div>
                            )
                          ) : (
                            <div
                              key={`field-${detail.id}-${isEditingThis}`}
                              ref={isEditingThis ? editRef : undefined}
                              contentEditable={isEditingThis}
                              suppressContentEditableWarning
                              onKeyDown={(e) => handleKeyDown(e, detail.id)}
                              data-placeholder={`Enter your ${detail.title.toLowerCase()}...`}
                              className={`leading-relaxed outline-none whitespace-pre-wrap break-words w-full empty:before:content-[attr(data-placeholder)] empty:before:text-gray-500 empty:before:italic empty:before:pointer-events-none [&:empty::before]:font-sans [&:empty::before]:font-normal mt-1 ${!detail.value && !isEditingThis
                                ? "text-gray-500 italic font-sans font-normal text-lg"
                                : detail.id === 'name' || detail.id === 'email'
                                  ? "font-bold font-sans text-gray-200 text-lg sm:text-xl"
                                  : "font-medium font-mono text-gray-200 text-lg sm:text-xl"
                                }`}
                            >
                              {detail.value || (!isEditingThis ? (isOwnProfile ? `Click edit to add your ${detail.title.toLowerCase()}` : "Not provided") : "")}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </div>

            <motion.hr variants={itemVariants} className="border-t border-white/10" />

            <motion.div variants={itemVariants} className="flex flex-col gap-6">
              {hasScripts && (
                <>
                  {isOwnProfile ? (
                    <div className="flex items-center justify-between w-full">
                      <h2 className="text-2xl sm:text-3xl font-sans font-extrabold text-white tracking-tight">
                        Drafts
                      </h2>
                      <div className="shrink-0 self-center">
                        <Add />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center w-full">
                      <h2 className="text-2xl sm:text-3xl font-sans font-extrabold text-white tracking-tight text-center sm:text-left self-center">
                        Published Drafts
                      </h2>
                    </div>
                  )}
                </>
              )}

              <div className="flex-1">
                <AnimatePresence mode="wait">
                  {scriptsError ? (
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
                  ) : !hasScripts ? (
                    <PlaceholderState
                      minHeight="min-h-[30dvh]"
                      icon={FileXCorner}
                      title="No drafts yet"
                      description={
                        isOwnProfile
                          ? "You haven't created any drafts yet. Start your creative journey!"
                          : "This user hasn't published any drafts yet."
                      }
                      action={isOwnProfile && <Add />}
                    />
                  ) : (
                    <motion.div key="scripts-grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 font-sans">
                      <AnimatePresence mode="popLayout">
                        {scripts.map((script) => (
                          <DraftCard key={script!.id} script={script! as any} />
                        ))}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;