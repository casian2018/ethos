'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaWifi, FaVideoSlash, FaPowerOff, FaExpand, FaCompress, FaRunning, FaBolt, FaHeartbeat } from 'react-icons/fa'
import { FiActivity, FiZap, FiVideo } from 'react-icons/fi'
import { useCompanion } from '@/hooks/useCompanion'

const DEFAULT_PC_IP = process.env.NEXT_PUBLIC_PC_IP || '192.168.1.100'
const LIVEKIT_WS_URL = `ws://${DEFAULT_PC_IP}:7880`

export default function CameraPage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  
  const {
    isConnected,
    isConnecting,
    detections,
    latency,
    error,
    connect,
    disconnect,
    setVideoElement,
    clearDetections,
  } = useCompanion(LIVEKIT_WS_URL)

  useEffect(() => {
    if (detections.length > 0) {
      const timer = setTimeout(() => {
        clearDetections()
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [detections, clearDetections])

  useEffect(() => {
    if (videoRef.current) {
      setVideoElement(videoRef.current)
    }
  }, [setVideoElement])

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return
    
    if (!isFullscreen) {
      containerRef.current.requestFullscreen?.()
    } else {
      document.exitFullscreen?.()
    }
  }, [isFullscreen])

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  useEffect(() => {
    let timeout: NodeJS.Timeout
    if (showControls) {
      timeout = setTimeout(() => setShowControls(false), 5000)
    }
    return () => clearTimeout(timeout)
  }, [showControls])

  const getLatencyColor = () => {
    if (latency < 50) return 'text-green-400'
    if (latency < 100) return 'text-orange-500'
    return 'text-pink-500'
  }

  const getDetectionColor = (label: string) => {
    const lowerLabel = label.toLowerCase()
    if (lowerLabel.includes('gantera') || lowerLabel.includes('dumbbell')) return 'neon-border-pink'
    if (lowerLabel.includes('bara') || lowerLabel.includes('barbell')) return 'neon-border-green'
    return 'neon-border'
  }

  const getStatusClass = () => {
    return isConnected 
      ? 'bg-green-500/20 border-green-500' 
      : 'bg-pink-500/20 border-pink-500'
  }

  const getStatusTextClass = () => {
    return isConnected ? 'text-green-400' : (error ? 'text-pink-500' : 'text-orange-500')
  }

  const getButtonClass = () => {
    return isConnected 
      ? 'bg-pink-500/20 border-pink-500 hover:bg-pink-500/30' 
      : 'bg-cyan-400/20 border-cyan-400 hover:bg-cyan-400/30'
  }

  const getButtonIconClass = () => {
    return isConnected ? 'text-pink-500' : 'text-cyan-400'
  }

  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-black relative overflow-hidden"
      onMouseMove={() => setShowControls(true)}
    >
      <AnimatePresence>
        {showControls && (
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-0 left-0 right-0 z-50 p-4 bg-gradient-to-b from-black/80 to-transparent"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <FaRunning className="text-cyan-400 text-2xl neon-text" />
                  <span className="text-2xl font-bold font-mono tracking-wider text-white">
                    ETHOS
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-6">
                <div className={`flex items-center space-x-2 px-4 py-2 rounded-full border ${getStatusClass()}`}>
                  {isConnected ? (
                    <>
                      <FaWifi className="text-green-400" />
                      <span className="text-green-400 font-bold text-sm">CONNECTED</span>
                    </>
                  ) : error ? (
                    <>
                      <FaWifi className="text-pink-500" />
                      <span className="text-pink-500 font-bold text-sm">ERROR</span>
                    </>
                  ) : (
                    <>
                      <FaWifi className="text-orange-500" />
                      <span className="text-orange-500 font-bold text-sm">CONNECTING</span>
                    </>
                  )}
                </div>

                {isConnected && (
                  <div className="flex items-center space-x-2 px-4 py-2 rounded-full bg-black/50">
                    <FiActivity className={`${getLatencyColor()} text-lg`} />
                    <span className={`font-mono font-bold ${getLatencyColor()}`}>
                      {latency}ms
                    </span>
                  </div>
                )}
              </div>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      <div className="relative w-full h-screen flex items-center justify-center">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          style={{ transform: 'scaleX(-1)' }}
        />

        <AnimatePresence>
          {detections.map((detection, index) => (
            <motion.div
              key={`detection-${index}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className={`absolute overlay-box ${getDetectionColor(detection.label)}`}
              style={{
                left: `${detection.box[0]}%`,
                top: `${detection.box[1]}%`,
                width: `${detection.box[2]}%`,
                height: `${detection.box[3]}%`,
              }}
            >
              <span className="absolute -top-8 left-0 px-2 py-1 bg-black/70 text-white text-xs font-bold rounded">
                {detection.label}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>

        {!isConnected && !isConnecting && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-10">
            <FaVideoSlash className="text-6xl text-gray-500 mb-4" />
            <p className="text-gray-400 text-lg mb-8">Camera is not active</p>
          </div>
        )}

        {isConnecting && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="mb-4"
            >
              <FaBolt className="text-6xl text-cyan-400 neon-text" />
            </motion.div>
            <p className="text-cyan-400 text-xl font-bold neon-text">Connecting...</p>
            <p className="text-gray-400 text-sm mt-2">{LIVEKIT_WS_URL}</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showControls && (
          <motion.footer
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-0 left-0 right-0 z-50 p-6 bg-gradient-to-t from-black/80 to-transparent"
          >
            <div className="flex justify-center items-center space-x-6">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={isConnected ? disconnect : connect}
                disabled={isConnecting}
                className={`w-16 h-16 rounded-full flex items-center justify-center border-2 ${getButtonClass()}`}
              >
                <FaPowerOff className={`text-2xl ${getButtonIconClass()}`} />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleFullscreen}
                className="w-12 h-12 rounded-full bg-gray-800/50 border-2 border-gray-600 hover:border-white flex items-center justify-center"
              >
                {isFullscreen ? (
                  <FaCompress className="text-white" />
                ) : (
                  <FaExpand className="text-white" />
                )}
              </motion.button>
            </div>

            {isConnected && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-center mt-6 space-x-8"
              >
                <div className="flex items-center space-x-2">
                  <FaHeartbeat className="text-pink-500" />
                  <span className="text-gray-400 text-sm">BPM</span>
                  <span className="text-white font-bold">--</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FiZap className="text-green-400" />
                  <span className="text-gray-400 text-sm">Reps</span>
                  <span className="text-white font-bold">--</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FiVideo className="text-cyan-400" />
                  <span className="text-gray-400 text-sm">Form</span>
                  <span className="text-green-400 font-bold">--%</span>
                </div>
              </motion.div>
            )}
          </motion.footer>
        )}
      </AnimatePresence>

      <div className="absolute top-20 left-4 w-20 h-20 border-l-2 border-t-2 border-cyan-400/30" />
      <div className="absolute top-20 right-4 w-20 h-20 border-r-2 border-t-2 border-cyan-400/30" />
      <div className="absolute bottom-20 left-4 w-20 h-20 border-l-2 border-b-2 border-cyan-400/30" />
      <div className="absolute bottom-20 right-4 w-20 h-20 border-r-2 border-b-2 border-cyan-400/30" />
    </div>
  )
}
