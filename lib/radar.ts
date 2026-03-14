import { supabase } from './supabase';

/**
 * Haversine distance between two GPS coordinates in meters.
 */
export function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Join a Supabase Broadcast channel for a match.
 * Both users send their GPS coords and receive the other's.
 */
export function joinRadarChannel(
  matchId: string,
  onPeerLocation: (lat: number, lon: number) => void,
) {
  const channel = supabase.channel(`radar:${matchId}`);

  channel
    .on('broadcast', { event: 'location' }, ({ payload }) => {
      if (payload?.lat != null && payload?.lon != null) {
        onPeerLocation(payload.lat, payload.lon);
      }
    })
    .subscribe();

  return {
    sendLocation: (lat: number, lon: number) => {
      channel.send({
        type: 'broadcast',
        event: 'location',
        payload: { lat, lon },
      });
    },
    leave: () => {
      supabase.removeChannel(channel);
    },
  };
}
