import React from "react";
import { Dialog, DialogPanel, DialogBackdrop } from "@headlessui/react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { DeleteConfirmModalProps } from "../../types";



const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    isDeleting,
    title = "Delete Contribution?",
    description = "This action cannot be undone. This will permanently remove this paragraph from the draft's pending requests.",
}) => {
    return (
        <Dialog
            open={isOpen}
            onClose={() => !isDeleting && onClose()}
            className="relative z-[60] font-sans"
        >
            <DialogBackdrop
                transition
                className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300 ease-out data-[closed]:opacity-0"
                aria-hidden="true"
            />

            <div className="fixed inset-0 flex items-center justify-center p-4">
                <DialogPanel
                    transition
                    className="w-full max-w-md rounded-2xl bg-primary border border-white/10 p-6 shadow-2xl text-center flex flex-col items-center gap-4 transition duration-300 ease-out data-[closed]:scale-95 data-[closed]:translate-y-4 data-[closed]:opacity-0"
                >
                    <div className="size-16 rounded-full bg-red-500/10 flex items-center justify-center mb-2 border border-red-500/20">
                        <AlertTriangle className="size-8 text-red-500" />
                    </div>

                    <h3 className="text-xl font-bold text-white">{title}</h3>
                    <p className="text-gray-400 mb-4">{description}</p>

                    <div className="flex items-center gap-3 w-full">
                        <button
                            onClick={onClose}
                            disabled={isDeleting}
                            className="flex-1 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-bold transition-colors disabled:opacity-50 outline-none"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isDeleting}
                            className="flex-1 py-3 px-4 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors disabled:opacity-50 outline-none flex items-center justify-center"
                        >
                            {isDeleting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                "Yes, Delete"
                            )}
                        </button>
                    </div>
                </DialogPanel>
            </div>
        </Dialog>
    );
};

export default DeleteConfirmModal;