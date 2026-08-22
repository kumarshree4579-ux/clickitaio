import API from './api';

let refreshPromise: Promise<string | null> | null = null;

export async function apiFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  let token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  const headers = new Headers(options.headers);
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let res = await fetch(`${API}${endpoint}`, { ...options, headers });

  if (res.status === 401 && typeof window !== 'undefined') {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      if (!refreshPromise) {
        refreshPromise = (async () => {
          try {
            const refreshRes = await fetch(`${API}/auth/refresh`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken })
            });
            
            if (refreshRes.ok) {
              const data = await refreshRes.json();
              localStorage.setItem('token', data.accessToken);
              document.cookie = `token=${data.accessToken}; path=/; SameSite=Strict; max-age=604800`;
              return data.accessToken;
            } else {
              throw new Error('Refresh failed');
            }
          } catch (err) {
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            document.cookie = 'token=; path=/; max-age=0';
            document.cookie = 'refreshToken=; path=/; max-age=0';
            window.location.href = '/login';
            return null;
          } finally {
            refreshPromise = null;
          }
        })();
      }

      const newToken = await refreshPromise;
      if (newToken) {
        headers.set('Authorization', `Bearer ${newToken}`);
        res = await fetch(`${API}${endpoint}`, { ...options, headers });
      }
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      document.cookie = 'token=; path=/; max-age=0';
      document.cookie = 'refreshToken=; path=/; max-age=0';
      window.location.href = '/login';
    }
  }

  return res;
}
