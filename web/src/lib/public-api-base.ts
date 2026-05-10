/** api.ts ile aynı normalizasyon — edge middleware ile paylaşılır */
export function getPublicApiBaseUrl(): string {
  let u = (
    process.env.NEXT_PUBLIC_API_URL ||
    (process.env.NODE_ENV === "development" ? "http://localhost:8000/api" : "https://terenceegitim.com/api")
  )
    .trim()
    .replace(/\/+$/, "")
  if (u.endsWith("/v1")) {
    u = u.slice(0, -3).replace(/\/+$/, "")
  }
  return u
}
