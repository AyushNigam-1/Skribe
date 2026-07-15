import { useState, Fragment, useEffect } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  DialogBackdrop,
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions
} from "@headlessui/react";
import { X, Loader2, ChevronDown, Check, UserPlus, SendHorizonal } from "lucide-react";
import { ADD_COLLABORATOR } from "../../graphql/mutation/scriptMutations";
import { SEARCH_USERS } from "../../graphql/query/userQueries";
import { toast } from "sonner";
import { InviteCollaboratorProps } from "../../types";

const ROLE_OPTIONS = [
  { value: "CONTRIBUTOR", label: "Contributor" },
  { value: "EDITOR", label: "Editor" },
];

const inputClass =
  "w-full px-4 py-3 rounded-xl border border-white/5 bg-white/5 text-gray-200 focus:bg-white/10 focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-all outline-none placeholder:text-gray-600 text-sm font-sans shadow-inner disabled:opacity-50 disabled:cursor-not-allowed";
const labelClass =
  "flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest font-sans";

export default function InviteCollaborator({ scriptId }: InviteCollaboratorProps) {
  const [isOpen, setIsOpen] = useState(false);

  // 🚨 THE FIX: Unified state for a single input field
  const [inputValue, setInputValue] = useState("");
  const [debouncedValue, setDebouncedValue] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [inviteRole, setInviteRole] = useState(ROLE_OPTIONS[0].value);

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inputValue);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(inputValue), 300);
    return () => clearTimeout(timer);
  }, [inputValue]);

  const { data: searchData, loading: searchLoading, error: searchError } = useQuery(SEARCH_USERS, {
    variables: { query: debouncedValue },
    skip: debouncedValue.length < 2,
    fetchPolicy: "network-only",
  });

  useEffect(() => {
    if (searchError) {
      console.error("🚨 SEARCH ERROR FROM BACKEND:", searchError.message);
    }
  }, [searchError]);

  const [addCollaborator, { loading: isAddingCollab }] = useMutation(ADD_COLLABORATOR, {
    onCompleted: () => {
      toast.success("Invite sent successfully!");
      handleClose();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to send invite.");
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setSelectedUser(null);
  };

  const handleSelectUser = (user: any) => {
    setSelectedUser(user);
    // Visual feedback that a specific user was selected
    setInputValue(`@${user.username}`);
  };

  const handleInvite = () => {
    // If they selected a user, send the username. Otherwise, send whatever raw text is in the input (like an email)
    let identifierToSend = inputValue.trim();

    // Clean up the '@' symbol if they typed it manually or if we added it during selection
    if (identifierToSend.startsWith('@')) {
      identifierToSend = identifierToSend.slice(1);
    }

    if (selectedUser) {
      identifierToSend = selectedUser.username;
    }

    if (!identifierToSend) return;

    addCollaborator({
      variables: {
        scriptId,
        identifier: identifierToSend,
        role: inviteRole
      }
    });
  };

  const handleClose = () => {
    setIsOpen(false);
    setInputValue("");
    setSelectedUser(null);
    setInviteRole(ROLE_OPTIONS[0].value);
  };

  const searchResults = searchData?.searchUsers || [];
  const canSubmit = selectedUser || isValidEmail;
  const selectedRoleObj = ROLE_OPTIONS.find(r => r.value === inviteRole) || ROLE_OPTIONS[0];

  const renderDropdown = () => (
    <div className="absolute top-[75px] left-0 right-0 bg-primary border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 flex flex-col max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
      {searchLoading ? (
        <div className="p-4 text-center text-gray-500 text-sm flex items-center justify-center gap-2">
          <Loader2 className="size-8 animate-spin" /> Searching...
        </div>
      ) : searchError ? (
        <div className="p-4 text-center text-red-400 text-sm">
          Error: {searchError.message}
        </div>
      ) : searchResults.length === 0 ? (
        <div className="p-4 text-center text-gray-500 text-sm">
          {isValidEmail
            ? "Valid email. Press Invite to send."
            : "No users found."}
        </div>
      ) : (
        searchResults.map((u: any) => (
          <button
            key={u.id}
            onClick={() => handleSelectUser(u)}
            className="flex items-center gap-3 p-3 hover:bg-white/5 transition-colors text-left outline-none border-b border-white/5 last:border-0"
          >
            <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold font-sans overflow-hidden shrink-0">
              {u.image ? <img src={u.image} alt={u.name} className="w-full h-full object-cover" /> : u.name.charAt(0)}
            </div>
            <div className="flex flex-col">
              <span className="text-sm text-white font-sans font-semibold">{u.name}</span>
              <span className="text-xs text-gray-500">@{u.username}</span>
            </div>
          </button>
        ))
      )}
    </div>
  );

  return (
    <Fragment>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-center gap-2 p-3 bg-white text-black hover:bg-gray-200 rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95 shrink-0"
      >
        <UserPlus className="w-4 h-4" />
        <span className="hidden sm:inline">Invite</span>
      </button>

      <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-black/60 backdrop-blur-sm transition duration-200 ease-out data-[closed]:opacity-0"
        />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel
            transition
            className="w-full max-w-[500px] bg-primary border border-white/10 rounded-2xl shadow-2xl flex flex-col font-sans transition duration-200 ease-out data-[closed]:scale-95 data-[closed]:opacity-0"
          >
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <DialogTitle className="text-xl font-bold text-white tracking-tight">
                Invite Collaborator
              </DialogTitle>
              <button
                onClick={handleClose}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <X className="size-5 md:size-6" />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-6">

              {/* 🚨 THE FIX: Single Unified Input Field */}
              <div className="flex flex-col gap-2 relative z-30">
                <label className={labelClass}>
                  Username or Email
                </label>
                <input
                  type="text"
                  placeholder="Search username or enter email..."
                  value={inputValue}
                  onChange={handleInputChange}
                  className={inputClass}
                />
                {inputValue.length >= 2 && !selectedUser && renderDropdown()}
              </div>

              <div className="flex flex-col gap-2 relative z-10 mt-1">
                <label className={labelClass}>
                  Role
                </label>
                <Listbox value={inviteRole} onChange={setInviteRole}>
                  <div className="relative">
                    <ListboxButton className={`${inputClass} flex items-center justify-between cursor-pointer`}>
                      <span className="block truncate">{selectedRoleObj.label}</span>
                      <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" aria-hidden="true" />
                    </ListboxButton>

                    <ListboxOptions
                      transition
                      className="absolute w-full mt-2 bg-primary border border-white/10 rounded-xl shadow-2xl py-1 z-50 overflow-hidden outline-none transition duration-100 ease-in data-[closed]:opacity-0"
                    >
                      {ROLE_OPTIONS.map((role) => (
                        <ListboxOption
                          key={role.value}
                          value={role.value}
                          className={({ active }) =>
                            `relative cursor-pointer select-none py-3 pl-10 pr-4 transition-colors ${active ? "bg-white/10 text-white" : "text-gray-300"
                            }`
                          }
                        >
                          {({ selected }) => (
                            <>
                              <span className={`block truncate ${selected ? "font-bold text-white" : "font-normal"}`}>
                                {role.label}
                              </span>
                              {selected ? (
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-400">
                                  <Check className="w-4 h-4" aria-hidden="true" />
                                </span>
                              ) : null}
                            </>
                          )}
                        </ListboxOption>
                      ))}
                    </ListboxOptions>
                  </div>
                </Listbox>
              </div>
            </div>

            <div className="p-6 pt-2 flex items-center justify-center pb-8">
              <button
                onClick={handleInvite}
                disabled={isAddingCollab || !canSubmit}
                className="flex items-center justify-center gap-2 px-8 py-2.5 bg-gray-100 hover:bg-white text-black rounded-xl font-bold text-sm transition-all disabled:opacity-30 disabled:hover:bg-[#a3a3a3]"
              >
                {isAddingCollab ? (
                  <Loader2 className="size-8 animate-spin" />
                ) : (
                  <SendHorizonal className="w-4 h-4" />
                )}
                Invite
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </Fragment>
  );
}