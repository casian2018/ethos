"use client";

import { useState, useEffect } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { 
  Eye, 
  Mic, 
  Brain, 
  Menu, 
  X, 
  ChevronRight, 
  Zap, 
  Wifi,
  CheckCircle2
} from "lucide-react";

// ============================================================================
// Types
// ============================================================================

interface NavbarProps {
  isScrolled: boolean;
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
}

interface LiveStatusProps {
  isOnline: boolean;
  latency: number;
}

// ============================================================================
// Components
// ============================================================================

/**
 * Navbar Component
 * Fixed navigation bar with glassmorphism effect
 */
const Navbar = ({ isScrolled }: NavbarProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: "Features", href: "#features" },
    { name: "About", href: "#about" },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "glass py-3" : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.a
            href="#"
            className="flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#a855f7] to-[#3b82f6] flex items-center justify-center">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">
              VoxLens
            </span>
          </motion.a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <motion.a
                key={link.name}
                href={link.href}
                className="text-gray-300 hover:text-white transition-colors relative group"
                whileHover={{ y: -2 }}
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#a855f7] to-[#3b82f6] group-hover:w-full transition-all duration-300" />
              </motion.a>
            ))}
          </div>

          {/* Login Button */}
          <div className="hidden md:block">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-2.5 rounded-full bg-white/10 border border-white/20 text-white font-medium hover:bg-white/20 transition-all duration-300"
            >
              Login
            </motion.button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-white"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden mt-4 pb-4"
            >
              <div className="flex flex-col gap-4">
                {navLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    className="text-gray-300 hover:text-white transition-colors py-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.name}
                  </a>
                ))}
                <button className="w-full px-6 py-3 rounded-full bg-white/10 border border-white/20 text-white font-medium">
                  Login
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
};

/**
 * Hero Section Component
 * Main landing section with gradient text and CTA button
 */
const HeroSection = () => {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 150]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-mesh pt-20">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#a855f7]/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -100, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#3b82f6]/20 rounded-full blur-3xl"
        />
      </div>

      <motion.div
        style={{ y, opacity }}
        className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
      >
        {/* Main Title with Gradient */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight"
        >
          <span className="text-white">See the World</span>
          <br />
          <span className="gradient-text">through the Eyes of AI</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-6 text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto"
        >
          Experience ultra-low latency voice interaction powered by WebRTC, 
          combined with Gemini 1.5 Flash multimodal intelligence for real-time environmental understanding.
        </motion.p>

        {/* CTA Button with Pulse Effect */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-10"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={{
              boxShadow: [
                "0 0 20px rgba(168, 85, 247, 0.4), 0 0 40px rgba(59, 130, 246, 0.2)",
                "0 0 30px rgba(168, 85, 247, 0.6), 0 0 60px rgba(59, 130, 246, 0.4)",
                "0 0 20px rgba(168, 85, 247, 0.4), 0 0 40px rgba(59, 130, 246, 0.2)",
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="group relative px-8 py-4 sm:px-10 sm:py-5 rounded-full bg-gradient-to-r from-[#a855f7] to-[#3b82f6] text-white font-semibold text-lg sm:text-xl overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-2">
              Open Companion
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-[#3b82f6] to-[#a855f7] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </motion.button>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="mt-16 flex justify-center"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-6 h-10 rounded-full border-2 border-gray-600 flex justify-center pt-2"
          >
            <div className="w-1.5 h-3 bg-gray-600 rounded-full" />
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
};

/**
 * Feature Card Component
 * Individual card for Bento Grid Features section
 */
const FeatureCard = ({ icon, title, description, delay }: FeatureCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      whileHover={{ 
        scale: 1.02,
        transition: { duration: 0.3 }
      }}
      className="group relative p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-white/5 to-white/0 border border-white/10 hover:border-[#a855f7]/50 transition-all duration-300 overflow-hidden"
    >
      {/* Hover glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#a855f7]/10 to-[#3b82f6]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Icon */}
        <motion.div
          whileHover={{ scale: 1.1, rotate: 5 }}
          className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#a855f7]/20 to-[#3b82f6]/20 flex items-center justify-center mb-5 group-hover:from-[#a855f7]/30 group-hover:to-[#3b82f6]/30 transition-colors"
        >
          <div className="text-[#a855f7]">{icon}</div>
        </motion.div>

        {/* Title */}
        <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 group-hover:text-[#a855f7] transition-colors">
          {title}
        </h3>

        {/* Description */}
        <p className="text-gray-400 leading-relaxed">
          {description}
        </p>
      </div>

      {/* Corner accent */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-[#a855f7]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </motion.div>
  );
};

/**
 * Features Section Component
 * Bento Grid layout with three feature cards
 */
const FeaturesSection = () => {
  const features = [
    {
      icon: <Eye className="w-7 h-7" />,
      title: "Real-time Vision",
      description: "Advanced YOLOv11 object detection processes your camera feed instantly, identifying thousands of objects with pinpoint accuracy for immediate environmental awareness.",
    },
    {
      icon: <Mic className="w-7 h-7" />,
      title: "Instant Voice",
      description: "WebRTC-powered voice communication delivers sub-100ms latency, enabling natural, real-time conversations with your AI companion as if it were right beside you.",
    },
    {
      icon: <Brain className="w-7 h-7" />,
      title: "Multimodal Intelligence",
      description: "Gemini 1.5 Flash processes visual and audio context simultaneously, providing deep understanding and contextually relevant responses to your questions.",
    },
  ];

  return (
    <section id="features" className="py-20 sm:py-32 bg-[#0a0a0f]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
            Powerful <span className="gradient-text">Features</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Cutting-edge technology working together to create your ultimate AI companion
          </p>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              delay={index * 0.15}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

/**
 * Live Status Widget Component
 * Shows simulated server connection status
 */
const LiveStatusWidget = ({ isOnline, latency }: LiveStatusProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40"
    >
      <div className="glass rounded-full px-6 py-3 flex items-center gap-4 sm:gap-6">
        {/* Status Indicator */}
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className={`w-2.5 h-2.5 rounded-full ${isOnline ? "bg-green-500" : "bg-red-500"}`}
          />
          <span className="text-sm text-gray-300">
            Server Status:{" "}
            <span className={isOnline ? "text-green-400 font-medium" : "text-red-400 font-medium"}>
              {isOnline ? "Online" : "Offline"}
            </span>
          </span>
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-white/20" />

        {/* Latency */}
        <div className="flex items-center gap-2">
          <Wifi className="w-4 h-4 text-[#3b82f6]" />
          <span className="text-sm text-gray-300">
            Latency:{" "}
            <span className="text-[#3b82f6] font-medium">{latency}ms</span>
          </span>
        </div>
      </div>
    </motion.div>
  );
};

/**
 * About Section Component
 * Additional information about VoxLens
 */
const AboutSection = () => {
  const benefits = [
    "Instant object recognition and scene understanding",
    "Natural voice conversations with AI",
    "Privacy-first design - your data stays on device",
    "Works completely offline after initial setup",
    "Supports multiple languages",
    "Continuous learning and improvement",
  ];

  return (
    <section id="about" className="py-20 sm:py-32 bg-mesh">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
              About <span className="gradient-text">VoxLens</span>
            </h2>
            <p className="text-gray-400 text-lg mb-8 leading-relaxed">
              VoxLens is your gateway to AI-powered environmental awareness. By combining 
              cutting-edge computer vision with natural language processing, we create a 
              seamless bridge between the physical world and intelligent digital assistance.
            </p>
            <p className="text-gray-400 text-lg mb-10 leading-relaxed">
              Whether you are visually impaired, exploring new places, or simply curious about 
              your surroundings, VoxLens provides instant, accurate, and contextually aware 
              responses to help you understand the world like never before.
            </p>

            {/* Benefits List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <CheckCircle2 className="w-5 h-5 text-[#a855f7] flex-shrink-0" />
                  <span className="text-gray-300 text-sm">{benefit}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Visual Element */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="relative w-full aspect-square max-w-md mx-auto">
              {/* Animated rings */}
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="w-64 h-64 rounded-full border border-[#a855f7]/30"
                />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                  className="w-48 h-48 rounded-full border border-[#3b82f6]/40"
                />
              </div>
              
              {/* Center icon */}
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-[#a855f7] to-[#3b82f6] flex items-center justify-center shadow-2xl shadow-[#a855f7]/30">
                  <Eye className="w-16 h-16 text-white" />
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

/**
 * Footer Component
 * Simple footer with copyright
 */
const Footer = () => {
  return (
    <footer className="py-8 bg-[#0a0a0f] border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-[#a855f7]" />
            <span className="text-gray-400 text-sm">
              © 2024 VoxLens. All rights reserved.
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Zap className="w-4 h-4 text-[#3b82f6]" />
            <span className="text-gray-500 text-xs">
              Powered by Gemini 1.5 Flash
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

// ============================================================================
// Main Page Component
// ============================================================================

export default function VoxLensLandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [latency, setLatency] = useState(42);

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Simulate latency fluctuation
  useEffect(() => {
    const interval = setInterval(() => {
      // Random latency between 38-48ms
      setLatency(Math.floor(Math.random() * 11) + 38);
      // Simulate occasional brief disconnections (99% uptime)
      setIsOnline(Math.random() > 0.01);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-[#0a0a0f]">
      {/* Navbar */}
      <Navbar isScrolled={isScrolled} />

      {/* Hero Section */}
      <HeroSection />

      {/* Features Section */}
      <FeaturesSection />

      {/* About Section */}
      <AboutSection />

      {/* Footer */}
      <Footer />

      {/* Live Status Widget */}
      <LiveStatusWidget isOnline={isOnline} latency={latency} />
    </main>
  );
}
