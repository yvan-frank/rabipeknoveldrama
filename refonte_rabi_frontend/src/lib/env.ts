const apiUrl = process.env.NEXT_PUBLIC_API_URL;

if (!apiUrl) {
  throw new Error(
    'NEXT_PUBLIC_API_URL est requis (voir .env.example) — copier .env.example vers .env.local',
  );
}

export const env = {
  API_URL: apiUrl,
};
