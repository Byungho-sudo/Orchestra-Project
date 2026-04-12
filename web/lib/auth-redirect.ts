export function getSafeNextPath(searchParams: URLSearchParams) {
  const nextPath = searchParams.get("next")

  if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return "/"
  }

  return nextPath
}
