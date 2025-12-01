"use client";
import { useState } from "react";
import { motion } from "framer-motion";

export default function DualHero() {
  const [mode, setMode] = useState<"firm" | "pro">("firm");

  const firm = {
    title: "Scale Your Tax Firm Smarter.",
    subtitle:
      "Instantly access verified CPAs, EAs & specialists for overflow, review, and niche expertise.",
    cta: "Find Talent",
    href: "/firm",
  };

  const pro = {
    title: "Grow Your Tax Career.",
    subtitle:
      "Join a verified network and get discovered for referrals, projects, and collaboration.",
    cta: "Join Free",
    href: "/join",
  };

  const content = mode === "firm" ? firm : pro;

  return (
    <section className="w-full py-20">
      <div className="max-w-5xl mx-auto text-center px-4">

        {/* Mode Switcher */}
        <div className="inline-flex mb-6 rounded-full bg-gray-100 p-1">
          <button
            onClick={() => setMode("firm")}
            className={`px-5 py-2 rounded-full text-sm ${
              mode === "firm" ? "bg-white shadow font-semibold" : "text-gray-500"
            }`}
          >
            For Firms
          </button>

          <button
            onClick={() => setMode("pro")}
            className={`px-5 py-2 rounded-full text-sm ${
              mode === "pro" ? "bg-white shadow font-semibold" : "text-gray-500"
            }`}
          >
            For Tax Pros
          </button>
        </div>

        {/* Animated Content */}
        <motion.h1
          key={content.title}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold mb-4"
        >
          {content.title}
        </motion.h1>

        <motion.p
          key={content.subtitle}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-lg text-gray-600 max-w-2xl mx-auto mb-8"
        >
          {content.subtitle}
        </motion.p>

        <motion.a
          key={content.cta}
          href={content.href}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700"
        >
          {content.cta}
        </motion.a>
      </div>
    </section>
  );
}

