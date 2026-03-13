/* eslint-disable react-hooks/exhaustive-deps */
import {
  AudioTrack,
  Participant,
  RemoteParticipant,
  RemoteTrack,
  RemoteTrackPublication,
  Room,
  RoomEvent,
} from 'livekit-client';
import { useEffect, useState, useRef } from 'react';

export const useCompanion = (token: string, serverUrl: string) => {
  const roomRef = useRef<Room | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([]);

  useEffect(() => {
    const room = new Room({
      adaptiveStream: true,
      dynacast: true,
    });

    roomRef.current = room;

    const connect = async () => {
      try {
        await room.connect(serverUrl, token);
        setIsConnected(true);
        const localParticipant = room.localParticipant;
        const remoteParticipants = Array.from((room as unknown as { participants: Map<string, Participant> }).participants.values());
        setParticipants([localParticipant, ...remoteParticipants]);

      } catch (error) {
        console.error('Error connecting to LiveKit:', error);
      }
    };

    connect();

    const onParticipantConnected = (participant: Participant) => {
      setParticipants((prev) => [...prev, participant]);
    };

    const onParticipantDisconnected = (participant: RemoteParticipant) => {
      setParticipants((prev) => prev.filter((p) => p.sid !== participant.sid));
    };

    const onTrackSubscribed = (track: RemoteTrack, _publication: RemoteTrackPublication, _participant: RemoteParticipant) => {
      if (track.kind === 'audio') {
        setAudioTracks((prev) => [...prev, track as AudioTrack]);
      }
    };
    const onTrackUnsubscribed = (track: RemoteTrack, _publication: RemoteTrackPublication, _participant: RemoteParticipant) => {
      if (track.kind === 'audio') {
        setAudioTracks((prev) => prev.filter((t) => t.sid !== track.sid));
      }
    };

    room.on(RoomEvent.ParticipantConnected, onParticipantConnected);
    room.on(RoomEvent.ParticipantDisconnected, onParticipantDisconnected);
    room.on(RoomEvent.TrackSubscribed, onTrackSubscribed);
    room.on(RoomEvent.TrackUnsubscribed, onTrackUnsubscribed);

    return () => {
      room.disconnect();
      room.off(RoomEvent.ParticipantConnected, onParticipantConnected);
      room.off(RoomEvent.ParticipantDisconnected, onParticipantDisconnected);
      room.off(RoomEvent.TrackSubscribed, onTrackSubscribed);
      room.off(RoomEvent.TrackUnsubscribed, onTrackUnsubscribed);
    };
  }, [token, serverUrl]);

  return { room: roomRef.current, isConnected, participants, audioTracks };
};
