"use client";

import { motion } from 'framer-motion';
import { FaEye, FaRunning, FaShieldAlt, FaWaveSquare, FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa';
import { FiCpu, FiZap, FiVolume2 } from 'react-icons/fi';

export default function EthosPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <div className="bg-white text-gray-800 font-sans">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 w-full bg-white bg-opacity-80 backdrop-blur-md z-50 border-b border-gray-200">
        <motion.div
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.5 }}
          className="container mx-auto px-6 py-4 flex justify-between items-center"
        >
          <div className="text-3xl font-bold text-gray-900 font-mono">Ethos</div>
          <div className="hidden md:flex space-x-8 items-center">
            <a href="#features" className="text-gray-600 hover:text-blue-600 transition-colors">Features</a>
            <a href="#use-cases" className="text-gray-600 hover:text-blue-600 transition-colors">Use Cases</a>
            <a href="#dashboard" className="text-gray-600 hover:text-blue-600 transition-colors">Dashboard</a>
          </div>
          <button className="hidden md:block bg-blue-600 text-white font-bold py-3 px-8 rounded-full hover:bg-blue-700 transition-transform duration-300 ease-in-out transform hover:scale-105">
            Get Started
          </button>
        </motion.div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen flex flex-col justify-center items-center text-center relative pt-20 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white via-blue-50 to-white"></div>
        <div className="relative z-10 px-4">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <motion.h1
              variants={itemVariants}
              className="text-5xl md:text-7xl font-extrabold mb-4 text-gray-900 leading-tight"
            >
              The Future of Personalized Training
            </motion.h1>
            <motion.p
              variants={itemVariants}
              className="text-lg md:text-xl mb-8 max-w-3xl mx-auto text-gray-600"
            >
              Ethos provides real-time, AI-powered feedback to perfect your form, prevent injuries, and accelerate your fitness journey.
            </motion.p>
            <motion.button
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-blue-600 text-white font-bold py-4 px-10 rounded-full text-lg shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-colors"
            >
              Begin Your Transformation
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* The Speed Advantage Section */}
      <section id="features" className="py-24 bg-gray-50">
        <div className="container mx-auto text-center px-4">
          <h2 className="text-4xl md:text-5xl font-bold mb-16 text-gray-900">The Ethos Advantage</h2>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-3 gap-12"
          >
            <motion.div variants={itemVariants} className="flex flex-col items-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-shadow duration-300">
              <FiZap className="text-5xl text-blue-600 mb-6" />
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Instant Feedback</h3>
              <p className="text-gray-600">Our WebRTC-based system delivers corrections and insights in under 100ms, ensuring you adjust your form instantly.</p>
            </motion.div>
            <motion.div variants={itemVariants} className="flex flex-col items-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-shadow duration-300">
              <FiCpu className="text-5xl text-blue-600 mb-6" />
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Intelligent Analysis</h3>
              <p className="text-gray-600">Ethos uses advanced AI to analyze your posture, equipment, and environment, providing holistic training guidance.</p>
            </motion.div>
            <motion.div variants={itemVariants} className="flex flex-col items-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-shadow duration-300">
              <FiVolume2 className="text-5xl text-blue-600 mb-6" />
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Voice-First Guidance</h3>
              <p className="text-gray-600">Stay focused on your workout, not your screen. Ethos communicates with you through clear, hands-free audio cues.</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section id="use-cases" className="py-24">
        <div className="container mx-auto text-center px-4">
          <h2 className="text-4xl md:text-5xl font-bold mb-16 text-gray-900">Transform Your Training</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <motion.div whileHover={{ y: -10, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }} className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
              <FaRunning className="text-4xl text-blue-600 mb-4 mx-auto" />
              <h3 className="text-2xl font-bold mb-4">Perfect Your Form</h3>
              <p className="text-gray-600">From squats to yoga poses, Ethos analyzes your every move to ensure proper technique and maximize results.</p>
            </motion.div>
            <motion.div whileHover={{ y: -10, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }} className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
              <FaShieldAlt className="text-4xl text-blue-600 mb-4 mx-auto" />
              <h3 className="text-2xl font-bold mb-4">Train Safely</h3>
              <p className="text-gray-600">Ethos acts as your virtual spotter, detecting fatigue and providing encouragement to prevent injuries.</p>
            </motion.div>
            <motion.div whileHover={{ y: -10, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }} className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
              <FaEye className="text-4xl text-blue-600 mb-4 mx-auto" />
              <h3 className="text-2xl font-bold mb-4">Enhance Awareness</h3>
              <p className="text-gray-600">Our AI identifies potential hazards in your workout space, so you can focus on what matters.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Live Performance Dashboard Section */}
      <section id="dashboard" className="py-24 bg-gray-50">
        <div className="container mx-auto text-center px-4">
          <h2 className="text-4xl md:text-5xl font-bold mb-16 text-gray-900">Your Personal Dashboard</h2>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5 }}
            className="bg-white p-8 rounded-2xl shadow-2xl max-w-4xl mx-auto border border-gray-200"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
              <div className="md:col-span-2 bg-gray-100 rounded-lg p-4">
                <div className="aspect-w-16 aspect-h-9 bg-gray-200 rounded-md flex items-center justify-center">
                  <p className="text-gray-500">Live Camera Feed</p>
                </div>
              </div>
              <div className="space-y-6 text-left">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="font-bold text-lg text-gray-700">Heart Rate</h4>
                  <p className="text-3xl font-mono text-blue-600">145 <span className="text-lg text-gray-500">BPM</span></p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="font-bold text-lg text-gray-700">Rep Count</h4>
                  <p className="text-3xl font-mono text-blue-600">12</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="font-bold text-lg text-gray-700">Form Score</h4>
                  <p className="text-3xl font-mono text-blue-600">92%</p>
                </div>
              </div>
            </div>
            <div className="mt-8 flex items-center justify-center">
              <FaWaveSquare className="text-3xl text-blue-600 mr-4" />
              <p className="text-lg text-gray-600">Ethos is listening...</p>
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="text-center py-12 border-t border-gray-200">
        <div className="container mx-auto px-4">
          <div className="text-4xl font-bold text-gray-900 font-mono mb-4">Ethos</div>
          <p className="text-gray-600 mb-6">Train Smarter. Move Safer. Achieve More.</p>
          <div className="flex justify-center space-x-6 mb-8">
            <a href="#" className="text-gray-500 hover:text-gray-900 transition-colors"><FaTwitter className="text-2xl" /></a>
            <a href="#" className="text-gray-500 hover:text-gray-900 transition-colors"><FaInstagram className="text-2xl" /></a>
            <a href="#" className="text-gray-500 hover:text-gray-900 transition-colors"><FaLinkedin className="text-2xl" /></a>
          </div>
          <p className="text-gray-500">&copy; {new Date().getFullYear()} Ethos. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}