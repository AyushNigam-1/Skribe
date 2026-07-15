import React, { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Feather, Loader2, Mail, AlertCircle, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { authClient } from "../../lib/authClient";
import { useMutation } from "@tanstack/react-query";

const forgotSchema = z.object({
    email: z.email("Please enter a valid email address"),
});

type ForgotFormValues = z.infer<typeof forgotSchema>;

const ForgotPassword: React.FC = () => {
    const [isSent, setIsSent] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isValid },
    } = useForm<ForgotFormValues>({
        resolver: zodResolver(forgotSchema),
        mode: "onChange",
    });

    const { mutate: sendResetLink, isPending: loading } = useMutation({
        mutationFn: async (data: ForgotFormValues) => {
            const { error } = await authClient.requestPasswordReset({
                email: data.email,
                redirectTo: `${import.meta.env.VITE_CLIENT_URL}/reset-password`,
            });

            if (error) {
                throw new Error(error.message || "Failed to send reset link");
            }
            return true;
        },
        onSuccess: () => {
            setIsSent(true);
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    const onSubmit = (data: ForgotFormValues) => {
        sendResetLink(data);
    };

    const containerVariants: Variants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, staggerChildren: 0.1, ease: "easeOut" } },
        exit: { opacity: 0, y: -10, transition: { duration: 0.3, ease: "easeIn" } },
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
    };

    return (
        <AnimatePresence mode="wait">
            {!isSent ? (
                <motion.div
                    key="form-view"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="w-full max-w-[420px] mx-auto flex flex-col gap-8 p-8 sm:p-10 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl relative"
                >
                    {/* Header */}
                    <motion.div variants={itemVariants} className="flex flex-col items-center text-center gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-mono">
                                Reset Password
                            </h1>
                            <p className="text-gray-400 text-sm mt-1.5 font-mono">
                                Enter your email address and we'll send you a link to reset your password.
                            </p>
                        </div>
                    </motion.div>

                    <motion.form variants={itemVariants} onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                        {/* Email Field */}
                        <div className="flex flex-col gap-1.5 w-full">
                            <label htmlFor="email" className="text-[10px] sm:text-xs font-mono text-gray-400 uppercase tracking-widest ml-1">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                    type="email"
                                    id="email"
                                    required
                                    placeholder="you@example.com"
                                    {...register("email")}
                                    className={`w-full bg-white/5 border ${errors.email ? "border-red-500/50 focus:border-red-500" : "border-white/10 focus:border-white/30"} rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-gray-600 focus:bg-white/10 outline-none transition-all text-sm font-sans`}
                                />
                            </div>
                            <AnimatePresence>
                                {errors.email && (
                                    <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="text-red-400 text-xs ml-1 mt-0.5 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" /> {errors.email.message}
                                    </motion.p>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="flex flex-col gap-3 mt-2">
                            <button
                                type="submit"
                                disabled={loading || !isValid}
                                className="w-full flex justify-center items-center gap-2 bg-white hover:bg-gray-200 text-black py-3.5 rounded-xl transition-all duration-200 font-semibold font-mono text-sm active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                            >
                                {loading ? <Loader2 className="size-5 animate-spin" /> : "Send Reset Link"}
                            </button>

                            <Link
                                to="/login"
                                className="w-full flex justify-center items-center py-3.5 rounded-xl bg-white/5 border border-white/10 font-mono text-gray-400 hover:text-white hover:bg-white/5 transition-all text-sm font-bold"
                            >
                                Cancel
                            </Link>
                        </div>
                    </motion.form>
                </motion.div>
            ) : (
                <motion.div
                    key="success-view"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="w-full max-w-[420px] mx-auto flex flex-col gap-8 p-8 sm:p-10 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl relative"
                >
                    {/* Header */}
                    <motion.div variants={itemVariants} className="flex flex-col items-center text-center gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-mono">
                                Check Inbox
                            </h1>
                            <p className="text-gray-400 text-sm mt-1.5 font-mono px-2">
                                We've sent a secure reset link. Please check your inbox and spam folder.
                            </p>
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="flex flex-col gap-3">
                        <button
                            onClick={() => setIsSent(false)}
                            className="w-full flex justify-center items-center bg-gray-100 hover:bg-gray-200 text-gray-800 py-3.5 rounded-xl transition-all duration-200 font-bold font-mono text-sm border border-white/10"
                        >
                            Try different email
                        </button>
                        <Link
                            to="/login"
                            className="w-full flex bg-white/5 font-mono border border-white/10 rounded-xl justify-center items-center py-3.5 text-gray-400 hover:text-white transition-all text-sm font-bold"
                        >
                            Back to login
                        </Link>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ForgotPassword;