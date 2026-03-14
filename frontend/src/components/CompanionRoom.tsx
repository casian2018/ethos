'use client';

import { LiveKitRoom, VideoConference } from '@livekit/components-react';
import '@livekit/components-styles';
import { useState } from 'react';

export const CompanionRoom = () => {
  const [token, setToken] = useState('');
  const [sessionStarted, setSessionStarted] = useState(false);
  const serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || 'ws://localhost:7880';
  const roomName = 'voxlens-room';

  const startSession = async () => {
    const username = 'user-' + Date.now();
    try {
      const response = await fetch(`/api/connection?room=${roomName}&username=${username}`);
      const data = await response.json();
      setToken(data.token);
      setSessionStarted(true);
    } catch (e) {
      console.error(e);
    }
  };

  if (!sessionStarted) {
    return (
      <div className="flex items-center justify-center h-screen">
        <button
          onClick={startSession}
          className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600"
        >
          Start Session
        </button>
      </div>
    );
  }

  if (token === '') {
    return <div>Getting token...</div>;
  }

  return (
    <LiveKitRoom
      video={true}
      audio={true}
      token={token}
      serverUrl={serverUrl}
      data-lk-theme="default"
      style={{ height: '100dvh' }}
    >
      <VideoConference />
    </LiveKitRoom>
  );
};
