const API =
  typeof window === 'undefined'
    ? (process.env.API_URL === 'http://10.172.34.12:4000' ? 'http://127.0.0.1:4000' : (process.env.API_URL || 'http://127.0.0.1:4000'))
    : (process.env.NEXT_PUBLIC_API_URL || '/api');

export default API;
