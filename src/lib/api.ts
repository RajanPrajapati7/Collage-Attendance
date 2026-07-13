const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export async function fetchDemoData() {
  const response = await fetch(`${API_BASE}/api/data`);
  if (!response.ok) {
    throw new Error('Failed to load backend data');
  }
  return response.json();
}

export async function healthCheck() {
  const response = await fetch(`${API_BASE}/api/health`);
  if (!response.ok) {
    throw new Error('Backend is unavailable');
  }
  return response.json();
}
