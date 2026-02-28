const apiGet = async (key) => {
  const res = await fetch(`/api/storage?key=${encodeURIComponent(key)}`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    let message = `Storage API error (${res.status})`;
    try {
      const data = await res.json();
      if (data?.error) message = data.error;
    } catch {}
    throw new Error(message);
  }

  const data = await res.json();
  return data?.value ? { value: data.value } : null;
};

const normalizeValue = (value) => {
  if (typeof value === "string") return value;
  return JSON.stringify(value);
};

const apiSet = async (key, value) => {
  const res = await fetch("/api/storage", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ key, value: normalizeValue(value), ttlSeconds: 60 * 60 * 24 }),
  });

  if (!res.ok) {
    let message = `Storage API error (${res.status})`;
    try {
      const data = await res.json();
      if (data?.error) message = data.error;
    } catch {}
    throw new Error(message);
  }
};

const localGet = (key) => {
  const value = localStorage.getItem(key);
  return value ? { value } : null;
};

const localSet = (key, value) => {
  localStorage.setItem(key, normalizeValue(value));
};

const shouldUseRemote = () => typeof window !== "undefined";

const storage = {
  async get(key) {
    if (shouldUseRemote()) {
      try {
        return await apiGet(key);
      } catch {
        return localGet(key);
      }
    }
    return localGet(key);
  },

  async set(key, value) {
    if (shouldUseRemote()) {
      try {
        await apiSet(key, value);
      } catch {
        localSet(key, value);
      }
      return;
    }
    localSet(key, value);
  },
};

if (typeof window !== 'undefined') {
  window.storage = storage;
}

export default storage;
