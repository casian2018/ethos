'use client';

import {
  Participant,
  Room,
  RoomEvent,
  LocalVideoTrack,
  LocalAudioTrack,
  VideoPresets,
  createLocalVideoTrack,
  createLocalAudioTrack,
} from 'livekit-client';
import { useState, useRef, useCallback } from 'react';

export interface BoundingBox {
  label: string;
  box: [number, number, number, number]; // [x, y, w, h] as percentages 0-100
}

export const useCompanion = (serverUrl: string) => {
  const [room, setRoom] = useState<Room | undefined>();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [localVideoTrack, setLocalVideoTrack] = useState<LocalVideoTrack | undefined>();
  const [localAudioTrack, setLocalAudioTrack] = useState<LocalAudioTrack | undefined>();
  const [detections, setDetections] = useState<BoundingBox[]>([]);
  const [latency, setLatency] = useState<number>(0);
  const [error, setError] = useState<string | undefined>();
  
  const lastPingTime = useRef<number>(0);
  const videoTrackRef = useRef<LocalVideoTrack | undefined>(undefined);
  const facingModeRef = useRef<'user' | 'environment'>('user');

  // Fetch token from /api/connection
  const fetchToken = useCallback(async (): Promise<string | null> => {
    try {
      const roomName = 'workout-room';
      const username = `user-${Date.now()}`;
      const response = await fetch(`/api/connection?room=${roomName}&username=${username}`);
      
      const text = await response.text();
      
      if (!response.ok) {
        let errorMsg = `Failed to fetch token: ${response.status}`;
        try {
          const errorData = JSON.parse(text);
          errorMsg = errorData.error || errorMsg;
        } catch (e) {}
        throw new Error(errorMsg);
      }
      
      try {
        const data = JSON.parse(text);
        if (typeof data === 'string') {
          return data;
        }
        if (data && typeof data === 'object') {
          return String(data.token || data.accessToken || text);
        }
      } catch (e) {
        // Return raw text if not JSON
      }
      
      return text;
    } catch (err) {
      console.error('Error fetching token:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch token');
      return null;
    }
  }, []);

  // Start local camera only (Instant-On)
  const startCamera = useCallback(async (mode: 'user' | 'environment' = facingMode) => {
    try {
      if (localVideoTrack) {
        localVideoTrack.stop();
      }
      
      // Create local video track
      const videoTrack = await createLocalVideoTrack({
        resolution: VideoPresets.h720,
        facingMode: mode,
      });
      setLocalVideoTrack(videoTrack);
      videoTrackRef.current = videoTrack;
      setIsCameraActive(true);
      setFacingMode(mode);
      return videoTrack;
    } catch (err) {
      console.error('Error starting camera:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize camera');
      return null;
    }
  }, [facingMode, localVideoTrack]);

  // Initialize local video and audio tracks
  const initializeLocalTracks = useCallback(async () => {
    try {
      let videoTrack = localVideoTrack;
      if (!videoTrack) {
        videoTrack = await startCamera() || undefined;
      }

      // Create local audio track
      const audioTrack = await createLocalAudioTrack();
      setLocalAudioTrack(audioTrack);

      return { videoTrack, audioTrack };
    } catch (err) {
      console.error('Error initializing local tracks:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize microphone');
      return null;
    }
  }, [localVideoTrack, startCamera]);

  // Connect to LiveKit room
  const connect = useCallback(async () => {
    if (isConnecting || isConnected) return;
    
    setIsConnecting(true);
    setError(undefined);

    try {
      // Get token
      const token = await fetchToken();
      if (!token) {
        throw new Error('Failed to obtain connection token');
      }
      console.log('Got token, length:', token.length);

      // Initialize local tracks first
      const tracks = await initializeLocalTracks();
      if (!tracks) {
        throw new Error('Failed to initialize local tracks');
      }

      console.log('Creating room and connecting to:', serverUrl);

      // Create room instance
      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
      });

      // Set up data channel listener for detections
      room.on(RoomEvent.DataReceived, (payload: Uint8Array) => {
        try {
          const decoder = new TextDecoder();
          const message = decoder.decode(payload);
          const data = JSON.parse(message);

          // Check if it's a detection message
          if (data.label && data.box && Array.isArray(data.box)) {
            setDetections(prev => [...prev, {
              label: data.label,
              box: data.box as [number, number, number, number]
            }]);
          }

          // Check for pong response (latency calculation)
          if (data.type === 'pong') {
            const now = Date.now();
            const pingTime = now - lastPingTime.current;
            setLatency(pingTime);
          }
        } catch (err) {
          console.error('Error parsing data message:', err);
        }
      });

      // Connect to the room
      console.log('Connecting to:', serverUrl);
      const safeToken = String(token);
      await room.connect(serverUrl, safeToken);

      setRoom(room);
      setIsConnected(true);

      // Publish local tracks
      await room.localParticipant.publishTrack(tracks.videoTrack);
      await room.localParticipant.publishTrack(tracks.audioTrack);

      // Set up participant listeners
      const localParticipant = room.localParticipant;
      // Get remote participants - using any type to avoid API issues
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const remoteParticipants: any[] = [];
      if (room.remoteParticipants) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        room.remoteParticipants.forEach((p: any) => remoteParticipants.push(p));
      }
      setParticipants([localParticipant, ...remoteParticipants]);

      // Start latency ping
      const pingInterval = setInterval(() => {
        if (room.state === 'connected') {
          lastPingTime.current = Date.now();
          // Send ping through data channel if available
          const encoder = new TextEncoder();
          room.localParticipant.publishData(encoder.encode(JSON.stringify({ type: 'ping' })));
        }
      }, 2000);

      return () => {
        clearInterval(pingInterval);
      };
    } catch (err) {
      console.error('Error connecting to LiveKit:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect to LiveKit');
    } finally {
      setIsConnecting(false);
    }
  }, [serverUrl, fetchToken, initializeLocalTracks, isConnecting, isConnected]);

  // Disconnect from room
  const disconnect = useCallback(() => {
    if (room) {
      room.disconnect();
      setRoom(undefined);
      setIsConnected(false);
      setParticipants([]);
      setDetections([]);
    }
    
    // Stop local tracks
    if (videoTrackRef.current) {
      videoTrackRef.current.stop();
      videoTrackRef.current = undefined;
      setLocalVideoTrack(undefined);
      setIsCameraActive(false);
    }
    if (localAudioTrack) {
      localAudioTrack.stop();
      setLocalAudioTrack(undefined);
    }
  }, [room, localAudioTrack]);

  // Set video element for local track
  const setVideoElement = useCallback((element: HTMLVideoElement | null) => {
    if (localVideoTrack && element) {
      localVideoTrack.attach(element);
    }
  }, [localVideoTrack]);

  // Clear detections (called after displaying)
  const clearDetections = useCallback(() => {
    setDetections([]);
  }, []);

  // Toggle facing mode
  const toggleFacingMode = useCallback(() => {
    const newMode = facingMode === 'user' ? 'environment' : 'user';
    startCamera(newMode);
  }, [facingMode, startCamera]);

  return {
    room,
    isConnected,
    isConnecting,
    isCameraActive,
    facingMode,
    participants,
    localVideoTrack,
    localAudioTrack,
    detections,
    latency,
    error,
    connect,
    disconnect,
    setVideoElement,
    clearDetections,
    startCamera,
    toggleFacingMode,
  };
};
