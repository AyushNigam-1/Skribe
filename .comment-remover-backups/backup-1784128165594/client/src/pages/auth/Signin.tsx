import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, Mail, Lock, AlertCircle, Github } from "lucide-react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { posthog } from "../../providers/PostHogProvider";
import { authClient } from "../../lib/authClient";

const loginSchema = z.object({
  email: z.email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Login: React.FC = () => {
  const nav = useNavigate();
  // 🚨 Track the specific loading state instead of a global boolean
  const [activeAuthMethod, setActiveAuthMethod] = useState<"email" | "guest" | "google" | "github" | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
  });

  const isAnyLoading = activeAuthMethod !== null;

  const onSubmit = async (data: LoginFormValues) => {
    setActiveAuthMethod("email");
    const { data: authData, error } = await authClient.signIn.email({
      email: data.email,
      password: data.password,
    });
    setActiveAuthMethod(null);

    if (error) {
      posthog.capture("login_failed", { error_message: error.message || "unknown" });
      toast.error(error.message || "Invalid credentials");
      return;
    }

    if (authData?.user) {
      posthog.identify(authData.user.id, { name: authData.user.name });
      posthog.capture("user_logged_in", { login_method: "email" });
      toast.success("Welcome back!");
      nav("/explore");
    }
  };

  const handleSocialLogin = async (provider: "google" | "github") => {
    setActiveAuthMethod(provider);
    await authClient.signIn.social({
      provider: provider,
      callbackURL: `${window.location.origin}/explore`,
    });
    setActiveAuthMethod(null);
  };

  const handleGuestLogin = async () => {
    setActiveAuthMethod("guest");
    const { data: authData, error } = await authClient.signIn.email({
      email: "guest@example.com",
      password: "guestpassword123",
    });
    setActiveAuthMethod(null);

    if (error) {
      toast.error("Guest login currently unavailable.");
      return;
    }

    if (authData?.user) {
      posthog.identify(authData.user.id, { name: authData.user.name });
      posthog.capture("user_logged_in", { login_method: "guest" });
      toast.success("Welcome to the Demo!");
      nav("/explore");
    }
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, staggerChildren: 0.1, ease: "easeOut" } },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full max-w-[420px] mx-auto flex flex-col gap-8 p-8 sm:p-10 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl relative"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col items-center text-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-mono">
            Welcome Back
          </h1>
          <p className="text-gray-400 text-sm mt-1.5 font-mono">
            Enter your credentials to access your drafts.
          </p>
        </div>
      </motion.div>

      {/* Social Logins */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => handleSocialLogin("google")}
          disabled={isAnyLoading}
          className="flex justify-center items-center font-mono gap-2.5 bg-white/5 text-gray-300 font-semibold rounded-xl hover:bg-white/10 hover:text-white border border-white/10 transition-all duration-200 py-3 text-sm active:scale-[0.98] disabled:opacity-50"
        >
          {activeAuthMethod === "google" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          )}
          Google
        </button>
        <button
          type="button"
          onClick={() => handleSocialLogin("github")}
          disabled={isAnyLoading}
          className="flex justify-center items-center font-mono gap-2.5 bg-white/5 text-gray-300 font-semibold rounded-xl hover:bg-white/10 hover:text-white border border-white/10 transition-all duration-200 py-3 text-sm active:scale-[0.98] disabled:opacity-50"
        >
          {activeAuthMethod === "github" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Github className="w-4 h-4" />
          )}
          Github
        </button>
      </motion.div>

      {/* Divider */}
      <motion.div variants={itemVariants} className="flex items-center gap-4">
        <hr className="flex-grow border-white/10" />
        <span className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-widest font-bold font-mono">
          OR EMAIL
        </span>
        <hr className="flex-grow border-white/10" />
      </motion.div>

      {/* Form */}
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

        {/* Password Field */}
        <div className="flex flex-col gap-1.5 w-full">
          <div className="flex justify-between items-center ml-1">
            <label htmlFor="password" className="text-[10px] sm:text-xs font-mono text-gray-400 uppercase tracking-widest">
              Password
            </label>
            <Link to="/forgot-password" className="text-[10px] sm:text-xs font-mono text-gray-500 hover:text-white transition-colors">
              Forgot?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="password"
              id="password"
              required
              placeholder="••••••••"
              {...register("password")}
              className={`w-full bg-white/5 border ${errors.password ? "border-red-500/50 focus:border-red-500" : "border-white/10 focus:border-white/30"} rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-gray-600 focus:bg-white/10 outline-none transition-all text-sm font-sans`}
            />
          </div>
          <AnimatePresence>
            {errors.password && (
              <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="text-red-400 text-xs ml-1 mt-0.5 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.password.message}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isAnyLoading || !isValid}
          className="w-full flex justify-center font-mono items-center gap-2 bg-white hover:bg-gray-200 text-black py-3.5 rounded-xl transition-all duration-200 font-bold text-sm active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 mt-2 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
        >
          {activeAuthMethod === "email" ? <Loader2 className="size-5 animate-spin" /> : "Sign In"}
        </button>
        <button
          type="button"
          onClick={handleGuestLogin}
          disabled={isAnyLoading}
          className="w-full flex justify-center font-mono items-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 py-3.5 rounded-xl transition-all duration-200 font-bold text-sm active:scale-[0.98] disabled:opacity-50"
        >
          {activeAuthMethod === "guest" ? <Loader2 className="size-5 animate-spin" /> : "Log in as Guest"}
        </button>
      </motion.form>
      {/* Footer */}
      <motion.div variants={itemVariants} className="text-sm font-mono text-gray-500 text-center mt-2">
        <p>
          Don't have an account?{" "}
          <Link to="/create-account" className="font-bold text-gray-300 hover:text-white transition-colors">
            Create Account
          </Link>
        </p>
      </motion.div>
    </motion.div>
  );
};

export default Login;