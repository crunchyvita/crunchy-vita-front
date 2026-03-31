const GUEST_ID_STORAGE_KEY = 'guest_id';

export const getStoredGuestId = () => {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(GUEST_ID_STORAGE_KEY);
  } catch {
    return null;
  }
};

export const storeGuestId = (guestId) => {
  if (typeof window === 'undefined') return;
  if (typeof guestId !== 'string' || !guestId.trim()) return;
  try {
    localStorage.setItem(GUEST_ID_STORAGE_KEY, guestId.trim());
  } catch {
    // Ignore storage errors
  }
};

export const storeGuestIdFromPayload = (payload) => {
  const guestId = payload?.guestId || payload?.data?.guestId;
  storeGuestId(guestId);
};

export const attachGuestIdHeader = (headers = {}) => {
  const guestId = getStoredGuestId();
  if (!guestId) return headers;
  return {
    ...headers,
    'X-Guest-Id': guestId,
  };
};
