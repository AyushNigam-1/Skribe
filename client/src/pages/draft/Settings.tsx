import React, { useState, useEffect, useMemo, useRef } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
  Trash2, AlertTriangle, Lock, Globe2, Archive,
  Loader2, ListFilter, Users, Eye, FileMinus, UserMinus,
  MoreVertical, Check, LogOut
} from "lucide-react";

import {
  useDeleteScriptMutation,
  useUpdateScriptMutation,
  useRemoveCollaboratorMutation,
  useUpdateCollaboratorRoleMutation,
  useRemoveAllParagraphsMutation,
  useRemoveAllCollaboratorsMutation
} from "../../graphql/generated/graphql";
import Search from "../../components/layout/Search";
import Dropdown from "../../components/layout/Dropdown";
import { useUserStore } from "../../store/useAuthStore";
import InviteCollaborator from "../../components/modal/InviteModal";
import DeleteConfirmModal from "../../components/modal/DeleteConfirmModal";
import { toast } from "sonner";
import { DropdownOption, ScriptDetailsContext } from "../../types";

interface Collaborator {
  user: { id: string; name: string; };
  role: string;
}


type VisibilityType = "Public" | "Private" | "Archived";

const ROLE_OPTIONS = [
  { id: "EDITOR", name: "Editor" },
  { id: "CONTRIBUTOR", name: "Contributor" },
];

const FILTER_OPTIONS = [
  { id: "ALL", name: "All Roles" },
  { id: "OWNER", name: "Owner" },
  ...ROLE_OPTIONS,
];

const MemberActions = ({
  member,
  isSelf,
  handleRoleChange,
  triggerRemoveMemberModal,
}: {
  member: Collaborator;
  isSelf: boolean;
  handleRoleChange: (id: string, role: any) => void;
  triggerRemoveMemberModal: (id: string, name: string, isSelf: boolean) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentRoleOption = ROLE_OPTIONS.find(r => r.id === member.role) || ROLE_OPTIONS[2];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex items-center gap-2">

      <div className="hidden sm:flex items-center gap-3">
        <div data-testid={`role-dropdown-${member.user.id}`}>
          <Dropdown
            options={ROLE_OPTIONS}
            value={currentRoleOption}
            onChange={(newRole) => handleRoleChange(member.user.id, newRole)}
            className="w-full"
          />
        </div>

        <button
          data-testid={`remove-member-btn-${member.user.id}`}
          onClick={() => triggerRemoveMemberModal(member.user.id, member.user.name, isSelf)}
          className="p-2.5 text-xs font-bold uppercase tracking-widest bg-white/5 text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-white/10 hover:border-red-500/20 rounded-xl flex items-center gap-2 transition-all active:scale-95 shrink-0"
        >
          {isSelf ? <LogOut className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
        </button>
      </div>

      <div className="relative sm:hidden" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 bg-transparent hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
        >
          <MoreVertical className="w-5 h-5" />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 p-1.5 flex flex-col gap-2 top-full mt-2 w-48 bg-primary border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="flex flex-col gap-0.5">
                <p className="px-3 py-1.5 text-xs font-bold text-gray-500 uppercase tracking-widest">Role</p>
                {ROLE_OPTIONS.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => { handleRoleChange(member.user.id, role); setIsOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-white/10 flex items-center justify-between transition-colors ${member.role === role.id ? 'text-white font-bold bg-white/5' : 'text-gray-400'}`}
                  >
                    {role.name}
                    {member.role === role.id && <Check className="w-4 h-4 text-white" />}
                  </button>
                ))}
              </div>

              <div className="bg-white/10 w-full h-[1px]" />

              <button
                onClick={() => { triggerRemoveMemberModal(member.user.id, member.user.name, isSelf); setIsOpen(false); }}
                className="w-full text-left px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg flex items-center gap-2 transition-colors"
              >
                {isSelf ? <LogOut className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                {isSelf ? "Leave Draft" : "Remove Member"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
};

const DraftSettings: React.FC = () => {
  const navigate = useNavigate();
  const { data, isEditorOrOwner, currentUserRole, loading, setTab } = useOutletContext<ScriptDetailsContext>();
  const script = data?.getScriptById;

  const { user } = useUserStore();

  const [visibility, setVisibility] = useState<VisibilityType>("Public");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<DropdownOption>(FILTER_OPTIONS[0]);

  const [memberToRemove, setMemberToRemove] = useState<{ id: string, name: string, isSelf: boolean } | null>(null);

  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isConfirmingClearContent, setIsConfirmingClearContent] = useState(false);
  const [isConfirmingKickAll, setIsConfirmingKickAll] = useState(false);

  const wasAuthorized = useRef<boolean | null>(null);

  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsHydrated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!loading && script && isHydrated) {
      if (wasAuthorized.current === true && !isEditorOrOwner) {
        setTab("Timeline");
        navigate(`/timeline/${script.id}`, { replace: true });
      }
      wasAuthorized.current = isEditorOrOwner;
    }
  }, [isEditorOrOwner, loading, script, navigate, setTab, isHydrated]);

  useEffect(() => {
    if (script?.visibility) setVisibility(script.visibility as VisibilityType);
  }, [script]);

  const [deleteScript, { loading: isDeleting }] = useDeleteScriptMutation();
  const [updateScript] = useUpdateScriptMutation();
  const [removeCollaborator, { loading: isRemovingCollab }] = useRemoveCollaboratorMutation();
  const [updateRole] = useUpdateCollaboratorRoleMutation();
  const [removeAllParagraphs, { loading: isClearing }] = useRemoveAllParagraphsMutation();
  const [removeAllCollaborators, { loading: isKicking }] = useRemoveAllCollaboratorsMutation();

  const allMembers = useMemo(() => {
    if (!script) return [];

    const owner: Collaborator = {
      user: {
        id: script.author?.id || "",
        name: script.author?.name || "Unknown"
      },
      role: "OWNER"
    };

    const existingCollaborators: Collaborator[] = (script.collaborators || [])
      .filter((c): c is NonNullable<typeof c> => c !== null && c.user != null)
      .map((c) => ({
        role: c.role,
        user: {
          id: c.user.id || "",
          name: c.user.name
        }
      }));

    const members = [owner, ...existingCollaborators];

    return members.filter((member) => {
      const matchesSearch = member.user.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = selectedFilter.id === "ALL" || member.role === selectedFilter.id;
      return matchesSearch && matchesRole;
    });
  }, [script, searchQuery, selectedFilter]);

  const handleVisibilityChange = async (newVisibility: VisibilityType) => {
    if (visibility === newVisibility || !script) return;
    setVisibility(newVisibility);
    const updatePromise = updateScript({
      variables: { scriptId: script.id, visibility: newVisibility, title: script.title, description: script.description },
    });
    toast.promise(updatePromise, { loading: "Updating...", success: `Draft is now ${newVisibility}!`, error: "Failed to update." });
  };

  const handleRoleChange = (targetUserId: string, newRole: any) => {
    if (!script) return;
    const rolePromise = updateRole({ variables: { scriptId: script.id, targetUserId, role: newRole.id } });
    toast.promise(rolePromise, { loading: "Updating role...", success: `Role updated to ${newRole.name}`, error: "Failed to update role" });
  };

  const handleRemoveCollab = async () => {
    if (!script || !memberToRemove) return;
    try {
      await removeCollaborator({ variables: { scriptId: script.id, targetUserId: memberToRemove.id } });
      toast.success(memberToRemove.isSelf ? "You have left the draft." : `${memberToRemove.name} removed from draft.`);

      if (memberToRemove.isSelf) {
        navigate("/explore");
      } else {
        setMemberToRemove(null);
      }
    } catch (err) {
      toast.error("Failed to remove member.");
    }
  };

  const handleClearContent = () => {
    if (!script) return;
    const promise = removeAllParagraphs({ variables: { scriptId: script.id } });
    toast.promise(promise, { loading: "Clearing draft...", success: () => { setIsConfirmingClearContent(false); return "Draft content cleared."; }, error: "Failed to clear content." });
  };

  const handleKickAll = () => {
    if (!script) return;
    const promise = removeAllCollaborators({ variables: { scriptId: script.id } });
    toast.promise(promise, { loading: "Removing all members...", success: () => { setIsConfirmingKickAll(false); return "All collaborators removed."; }, error: "Failed to remove members." });
  };

  const handleDelete = () => {
    if (!script) return;
    const deletePromise = deleteScript({ variables: { scriptId: script.id } });
    toast.promise(deletePromise, { loading: "Deleting draft...", success: () => { navigate("/explore"); return "Draft deleted."; }, error: "Failed to delete.", });
  };

  const containerVariants: Variants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants: Variants = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } } };

  const VISIBILITY_OPTIONS = [
    { id: "Public", icon: Globe2, title: "Public", description: "Anyone can view, read, and contribute.", activeClasses: { container: "border-white/40 bg-white/10", textIcon: "text-white", description: "text-gray-300" } },
    { id: "Private", icon: Lock, title: "Private", description: "Only Members can view and edit draft.", activeClasses: { container: "border-white/40 bg-white/10", textIcon: "text-white", description: "text-gray-300" } },
    { id: "Archived", icon: Archive, title: "Archived", description: "Frozen and read-only for everyone.", activeClasses: { container: "border-white/40 bg-white/10", textIcon: "text-white", description: "text-gray-300" } },
  ];

  if (loading || !script || !isHydrated) {
    return (
      <div className="flex items-center justify-center w-full min-h-[70dvh]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (wasAuthorized.current === true && !isEditorOrOwner) {
    return null;
  }

  if (!isEditorOrOwner) {
    return (
      <motion.div data-testid="access-denied-state" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }} className="flex flex-col items-center justify-center py-20 px-4 text-center border border-white/10 rounded-2xl bg-white/5 backdrop-blur-xl shadow-lg font-mono">
        <Lock className="w-8 h-8 text-gray-500 mb-4" />
        <h3 className="text-lg font-bold text-white mb-2">Access Denied</h3>
        <p className="text-gray-400 text-sm max-w-sm">Only the author and designated editors can modify these settings.</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      key="settings-main-container"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-4 w-full font-mono relative"
    >
      <DeleteConfirmModal
        isOpen={!!memberToRemove}
        onClose={() => setMemberToRemove(null)}
        onConfirm={handleRemoveCollab}
        isDeleting={isRemovingCollab}
        title={memberToRemove?.isSelf ? "Leave Draft?" : "Remove Member?"}
        description={memberToRemove?.isSelf
          ? "Are you sure you want to leave this draft? You will lose access to it."
          : `Are you sure you want to remove ${memberToRemove?.name} from this draft? They will lose all access.`}
      />

      <motion.div variants={itemVariants} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-lg">
        <div className="p-4 sm:p-6 border-b border-white/10">
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight font-sans flex items-center gap-2"><Eye className="w-5 h-5" /> Access & Visibility</h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">Manage who can view and interact with this draft globally.</p>
        </div>
        <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {VISIBILITY_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isActive = visibility === option.id;
            return (
              <label data-testid={`visibility-option-${option.id}`} key={option.id} className={`flex gap-2 justify-between items-center p-4 rounded-2xl border cursor-pointer transition-all duration-300 shadow-sm group ${isActive ? option.activeClasses.container : "bg-white/5 border-white/10 hover:border-white/20"}`}>
                <input type="radio" name="visibility" value={option.id} checked={isActive} onChange={() => handleVisibilityChange(option.id as VisibilityType)} className="sr-only" />
                <div className="flex flex-col">
                  <span className={`font-bold text-lg font-sans tracking-tight ${isActive ? option.activeClasses.textIcon : "text-gray-300"}`}>{option.title}</span>
                  <p className={`text-sm font-sans leading-relaxed ${isActive ? option.activeClasses.description : "text-gray-400"}`}>{option.description}</p>
                </div>
                <Icon className={`w-10 ${isActive ? option.activeClasses.textIcon : "text-gray-500"}`} />
              </label>
            );
          })}
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="bg-white/5 border border-white/10 rounded-2xl overflow-visible shadow-lg">
        <div className="p-4 sm:p-6 border-b border-white/10 flex flex-col ">
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight font-sans flex items-center gap-2"><Users className="w-5 h-5" /> Members & Roles</h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">Invite users and manage what they are allowed to do.</p>
        </div>

        <div className="p-4 sm:p-6">

          <div className="flex items-center gap-2 mb-6 w-full">
            <div className="flex-1 sm:flex-none sm:w-48 md:w-56" data-testid="members-search-wrapper">
              <Search value={searchQuery} setSearch={setSearchQuery} placeholder="Search members..." />
            </div>

            <div className="flex items-center gap-2 shrink-0 ml-auto" data-testid="members-filter-dropdown">
              <Dropdown options={FILTER_OPTIONS} value={selectedFilter} onChange={setSelectedFilter} icon={ListFilter} collapseOnMobile={true} />
              <InviteCollaborator scriptId={script!.id} />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {allMembers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-white/10 rounded-xl bg-white/[0.02]">
                <Users className="w-6 h-6 text-gray-600 mb-2" />
                <p className="text-gray-500 text-sm font-mono">No members found.</p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {allMembers.map((member) => (
                  <motion.div key={member.user.id} data-testid={`member-card-${member.user.id}`} layout initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="flex items-center justify-between gap-3 sm:gap-4 p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/[0.07] transition-colors">

                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-10 h-10 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white font-bold shrink-0">{member.user.name.charAt(0).toUpperCase()}</div>
                      <div className="flex flex-col min-w-0">
                        <p className="font-bold text-white text-sm truncate max-w-[140px] sm:max-w-full">{member.user.name}</p>
                        <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mt-0.5">{member.role}</p>
                      </div>
                    </div>

                    <div className="flex items-center shrink-0">
                      {member.role === "OWNER" ? (
                        <span className="px-2 py-1 sm:px-3 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-bold rounded uppercase tracking-widest">OWNER</span>
                      ) : (
                        <MemberActions
                          member={member}
                          isSelf={member.user.id === user?.id}
                          handleRoleChange={handleRoleChange}
                          triggerRemoveMemberModal={(id, name, isSelf) => setMemberToRemove({ id, name, isSelf })}
                        />
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      </motion.div>

      {currentUserRole === "AUTHOR" && (
        <motion.div variants={itemVariants} className="bg-white/5 backdrop-blur-xl border border-red-900/30 rounded-2xl overflow-hidden shadow-lg relative">
          <div className="absolute top-0 left-0 w-full h-full bg-red-900/5 pointer-events-none" />

          <div className="p-4 sm:p-6 border-b border-red-900/30 relative z-10 text-left">
            <h2 className="text-lg font-bold text-red-500 flex items-center gap-2 font-sans tracking-tight justify-start"><AlertTriangle className="w-5 h-5" /> Danger Zone</h2>
            <p className="text-sm text-red-500/70 mt-1">Actions here cannot be undone. Only you (the Author) can perform these actions.</p>
          </div>

          <div className="flex flex-col relative z-10 text-left">
            {
            <div className="p-4 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-red-900/30">
              <div className="w-full md:w-auto">
                <p className="font-bold text-white text-sm">Clear All Content</p>
                <p className="text-sm text-gray-400 mt-1 font-sans">
                  Erase all paragraphs and contributions. This acts as a hard reset for the draft's text.
                </p>
              </div>
              <div className="w-full md:w-auto mt-2 md:mt-0 flex justify-start md:justify-end">
                <AnimatePresence mode="wait">
                  {!isConfirmingClearContent ? (
                    <motion.button
                      key="clear-btn"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      data-testid="clear-content-btn"
                      onClick={() => setIsConfirmingClearContent(true)}
                      className="px-6 py-2.5 border border-red-900/50 text-red-500 hover:bg-red-950/40 hover:border-red-500/50 rounded-xl font-bold transition-all text-sm shadow-sm active:scale-95 w-full md:w-auto"
                    >
                      Clear Content
                    </motion.button>
                  ) : (
                    <motion.div
                      key="confirm-clear"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ type: "tween", ease: "easeOut", duration: 0.2 }}
                      className="flex items-center gap-2.5 w-full md:w-auto"
                    >
                      <button
                        onClick={() => setIsConfirmingClearContent(false)}
                        className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded-xl font-bold transition-colors text-sm active:scale-95 shrink-0"
                      >
                        Cancel
                      </button>
                      <button
                        data-testid="confirm-clear-btn"
                        onClick={handleClearContent}
                        disabled={isClearing}
                        className="flex-1 md:flex-none justify-center flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 shadow-lg text-sm active:scale-95 whitespace-nowrap"
                      >
                        <FileMinus className="w-4 h-4" /> {isClearing ? "Clearing..." : "Yes, Clear It"}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {
            {script?.collaborators && script.collaborators.length > 0 && (
              <div className="p-4 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-red-900/30">
                <div className="w-full md:w-auto">
                  <p className="font-bold text-white text-sm">Remove All Members</p>
                  <p className="text-sm text-gray-400 mt-1 font-sans">
                    Kick all invited collaborators at once. The draft will remain but only you will have access.
                  </p>
                </div>
                <div className="w-full md:w-auto mt-2 md:mt-0 flex justify-start md:justify-end">
                  <AnimatePresence mode="wait">
                    {!isConfirmingKickAll ? (
                      <motion.button
                        key="kick-btn"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        data-testid="kick-all-btn"
                        onClick={() => setIsConfirmingKickAll(true)}
                        className="px-6 py-2.5 border border-red-900/50 text-red-500 hover:bg-red-950/40 hover:border-red-500/50 rounded-xl font-bold transition-all text-sm shadow-sm active:scale-95 w-full md:w-auto"
                      >
                        Remove Members
                      </motion.button>
                    ) : (
                      <motion.div
                        key="confirm-kick"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ type: "tween", ease: "easeOut", duration: 0.2 }}
                        className="flex items-center gap-2.5 w-full md:w-auto"
                      >
                        <button
                          onClick={() => setIsConfirmingKickAll(false)}
                          className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded-xl font-bold transition-colors text-sm active:scale-95 shrink-0"
                        >
                          Cancel
                        </button>
                        <button
                          data-testid="confirm-kick-btn"
                          onClick={handleKickAll}
                          disabled={isKicking}
                          className="flex-1 md:flex-none justify-center flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 shadow-lg text-sm active:scale-95 whitespace-nowrap"
                        >
                          <UserMinus className="w-4 h-4" /> {isKicking ? "Removing..." : "Yes, Kick All"}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {
            <div className="p-4 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="w-full md:w-auto">
                <p className="font-bold text-white text-sm">Delete this Draft</p>
                <p className="text-sm text-gray-400 mt-1 font-sans">
                  Once deleted, there is no going back. All text and members will be erased forever.
                </p>
              </div>
              <div className="w-full md:w-auto mt-2 md:mt-0 flex justify-start md:justify-end">
                <AnimatePresence mode="wait">
                  {!isConfirmingDelete ? (
                    <motion.button
                      key="delete-btn"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      data-testid="delete-draft-btn"
                      onClick={() => setIsConfirmingDelete(true)}
                      className="px-6 py-2.5 border border-red-900/50 text-red-500 hover:bg-red-950/40 hover:border-red-500/50 rounded-xl font-bold transition-all text-sm shadow-sm active:scale-95 w-full md:w-auto"
                    >
                      Delete Draft
                    </motion.button>
                  ) : (
                    <motion.div

                      key="confirm-delete"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ type: "tween", ease: "easeOut", duration: 0.2 }}
                      className="flex items-center gap-2.5 w-full md:w-auto"
                    >
                      <button
                        onClick={() => setIsConfirmingDelete(false)}
                        className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded-xl font-bold transition-colors text-sm active:scale-95 shrink-0"
                      >
                        Cancel
                      </button>
                      <button
                        data-testid="confirm-delete-btn"
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="flex-1 md:flex-none justify-center flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 shadow-lg text-sm active:scale-95 whitespace-nowrap"
                      >
                        <Trash2 className="w-4 h-4" /> {isDeleting ? "Deleting..." : "Yes, Delete It"}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default DraftSettings;