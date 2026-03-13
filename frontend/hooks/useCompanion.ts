'use client';

import {
  AudioTrack,
  LocalParticipant,
  LocalTrack,
  Participant,
  RemoteParticipant,
  RemoteTrack,
  Room,
  RoomEvent,
  DataReceivedCallback,
  LocalVideoTrack,
  LocalAudioTrack,
  VideoPresets,
  createLocalVideoTrack,
  createLocalAudioTrack,
} from 'livekit-client';
import { useEffect, useState, useRef, useCallback } from 'react';

export interface BoundingBox {
  label: string;
  box: [number, number, number, number]; // [x, y, w, h] as percentages 0-100
}

export const useCompanion = (serverUrl: string) => {
  const [room, setRoom] = useState<Room | undefined>();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([]);
  const [localVideoTrack, setLocalVideoTrack] = useState<LocalVideoTrack | undefined>();
  const [localAudioTrack, setLocalAudioTrack] = useState<LocalAudioTrack | undefined>();
  const [detections, setDetections] = useState<BoundingBox[]>([]);
  const [latency, setLatency] = useState<number>(0);
  const [error, setError] = useState<string | undefined>();
  
  const lastPingTime = useRef<number>(0);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);

  // Fetch token from /api/connection
  const fetchToken = useCallback(async (): Promise<string | null> => {
    try {
      const roomName = 'workout-room';
      const username = `user-${Date.now()}`;
      const response = await fetch(`/api/connection?room=${roomName}&username=${username}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch token');
      }
      
      const data = await response.json();
      return data.token;
    } catch (err) {
      console.error('Error fetching token:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch token');
      return null;
    }
  }, []);

  // Initialize local video and audio tracks
  const initializeLocalTracks = useCallback(async () => {
    try {
      // Create local video track
      const videoTrack = await createLocalVideoTrack({
        width: VideoPresets.h720.width,
        height: VideoPresets.h720.height,
        facingMode: 'user',
      });
      setLocalVideoTrack(videoTrack);

      // Create local audio track
      const audioTrack = await createLocalAudioTrack();
      setLocalAudioTrack(audioTrack);

      return { videoTrack, audioTrack };
    } catch (err) {
      console.error('Error initializing local tracks:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize camera/microphone');
      return null;
    }
  }, []);

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

      // Initialize local tracks first
      const tracks = await initializeLocalTracks();
      if (!tracks) {
        throw new Error('Failed to initialize local tracks');
      }

      // Create room instance
      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
      });

      // Set up data channel listener for detections
      room.on(RoomEvent.DataReceived, (payload: Uint8Array, participant?: RemoteParticipant) => {
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
      await room.connect(serverUrl, token, {
        tracks: [tracks.videoTrack, tracks.audioTrack],
      });

      setRoom(room);
      setIsConnected(true);

      // Publish local tracks
      await room.localParticipant.publishTrack(tracks.videoTrack);
      await room.localParticipant.publishTrack(tracks.audioTrack);

      // Set up participant listeners
      const localParticipant = room.localParticipant;
      const remoteParticipants = Array.from(room.participants.values());
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
    if (localVideoTrack) {
      localVideoTrack.stop();
      setLocalVideoTrack(undefined);
    }
    if (localAudioTrack) {
      localAudioTrack.stop();
      setLocalAudioTrack(undefined);
    }
  }, [room, localVideoTrack, localAudioTrack]);

  // Set video element for local track
  const setVideoElement = useCallback((element: HTMLVideoElement | null) => {
    videoElementRef.current = element;
    if (localVideoTrack && element) {
      localVideoTrack.attach(element);
    }
  }, [localVideoTrack]);

  // Clear detections (called after displaying)
  const clearDetections = useCallback(() => {
    setDetections([]);
  }, []);

  return {
    room,
    isConnected,
    isConnecting,
    participants,
    audioTracks,
    localVideoTrack,
    localAudioTrack,
    detections,
    latency,
    error,
    connect,
    disconnect,
    setVideoElement,
    clearDetections,
  };
};
