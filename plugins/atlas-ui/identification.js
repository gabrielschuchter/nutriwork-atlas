// Same normalization on the browser and the Vercel function. No subscription lookup.
export function normalizeEmail(value) {
  if (typeof value !== "string" || value.length > 254) return null
  const email = value.trim().toLowerCase()
  const parts = email.split("@")
  if (parts.length !== 2) return null
  const [local, domain] = parts
  if (
    !local ||
    local.length > 64 ||
    local.startsWith(".") ||
    local.endsWith(".") ||
    local.includes("..") ||
    !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+$/i.test(local)
  )
    return null
  const labels = domain.split(".")
  if (
    labels.length < 2 ||
    labels.some((label) => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(label))
  )
    return null
  return email
}

export function readIdentification(storage, key) {
  try {
    const saved = JSON.parse(storage.getItem(key))
    return saved?.version === 1 ? normalizeEmail(saved.email) : null
  } catch {
    return null
  }
}
