'use client';

import { useEffect, useState } from 'react';
import { useCompanion } from '../hooks/useCompanion';
import {
  VideoTrack,
  AudioTrack,
  Participant,
  LocalParticipant,
} from 'livekit-client';
import { Video, Audio } from '@livekit/components-react';

export default function CompanionPage() {
  const [roomName, setRoomName] = useState('my-room');
  const [username, setUsername] = useState('user-' + Date.now());
  const [token, setToken] = useState('');
  const serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || '';

  const { isConnected, participants, audioTracks } = useCompanion(
    token,
    serverUrl
  );

  useEffect(() => {
    if (roomName && username) {
      fetch(`/api/connection?room=${roomName}&username=${username}`)
        .then((res) => res.json())
        .then((data) => setToken(data.token));
    }
  }, [roomName, username]);

  const getParticipantVideoTrack = (participant: Participant) => {
    for (const [, trackPub] of participant.tracks) {
      if (trackPub.kind === 'video') {
        return trackPub.track as VideoTrack;
      }
    }
    return null;
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white">
      <h1 className="text-3xl font-bold mb-4">VoxLens Companion</h1>
      {!isConnected ? (
        <div className="flex flex-col gap-4">
          <input
            type="text"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            className="p-2 rounded bg-gray-800 text-white"
            placeholder="Room Name"
          />
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="p-2 rounded bg-gray-800 text-white"
            placeholder="Username"
          />
          <p>Joining room...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {participants.map((participant) => (
            <div key={participant.sid} className="bg-gray-800 rounded-lg p-4">
              <p className="font-bold">{participant.identity}</p>
              {getParticipantVideoTrack(participant) && (
                <Video
                  track={getParticipantVideoTrack(participant)!}
                  isLocal={participant instanceof LocalParticipant}
                  width="100%"
                />
              )}
            </div>
          ))}
        </div>
      )}
      {audioTracks.map((track) => (
        <Audio key={track.sid} track={track} />
      ))}
    </div>
  );
}
