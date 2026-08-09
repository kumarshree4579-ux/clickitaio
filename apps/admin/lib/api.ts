const API = process.env.NEXT_PUBLIC_API_URL;
if (!API) {
  throw new Error('NEXT_PUBLIC_API_URL is not defined in environment');
}
export default API as string;
