const API =
  typeof window === 'undefined'
    ? (process.env.API_URL || 'http://localhost:4000')
    : (process.env.NEXT_PUBLIC_API_URL || '/api');

export default API;
