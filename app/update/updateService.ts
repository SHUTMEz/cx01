export interface UpdateAsset {
  name: string;
  url: string;
}

export interface UpdateRelease {
  version: string;
  name: string;
  notes: string;
  assets: UpdateAsset[];
}

export interface UpdateCheckResult {
  status: "available" | "up-to-date" | "error";
  release: UpdateRelease | null;
  message?: string;
}

function versionParts(value: string): number[] | null {
  const match = value.trim().replace(/^v/i, "").match(/^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/);
  return match ? match.slice(1, 4).map(Number) : null;
}

export function compareVersions(current: string, latest: string): number {
  const left = versionParts(current);
  const right = versionParts(latest);
  if (!left || !right) return 0;
  for (let index = 0; index < 3; index += 1) {
    if (left[index] !== right[index]) return left[index] < right[index] ? -1 : 1;
  }
  return 0;
}

export function isAllowedUpdateUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && (url.hostname === "github.com" || url.hostname === "objects.githubusercontent.com");
  } catch {
    return false;
  }
}

export function parseRelease(payload: unknown): UpdateRelease | null {
  if (!payload || typeof payload !== "object") return null;
  const value = payload as Record<string, unknown>;
  const tag = typeof value.tag_name === "string" ? value.tag_name : "";
  const version = tag.replace(/^v/i, "");
  if (!versionParts(version) || value.draft === true || value.prerelease === true) return null;
  const rawAssets = Array.isArray(value.assets) ? value.assets : [];
  const assets = rawAssets.flatMap((asset) => {
    if (!asset || typeof asset !== "object") return [];
    const item = asset as Record<string, unknown>;
    return typeof item.name === "string" && typeof item.browser_download_url === "string"
      ? [{ name: item.name, url: item.browser_download_url }]
      : [];
  });
  return {
    version,
    name: typeof value.name === "string" ? value.name : `MRYX : CNPSF v${version}`,
    notes: typeof value.body === "string" ? value.body : "",
    assets,
  };
}

export function selectWindowsInstaller(release: UpdateRelease | null): string | null {
  const asset = release?.assets.find((item) => /^(?:MRYX[_ ]CNPSF|crtl)_[^/]+_x64-setup\.exe$/i.test(item.name) && isAllowedUpdateUrl(item.url));
  return asset?.url || null;
}

export async function checkForUpdate(currentVersion: string, fetcher: typeof fetch = fetch): Promise<UpdateCheckResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetcher("https://api.github.com/repos/SHUTMEz/cx01/releases", {
      headers: { Accept: "application/vnd.github+json" },
      signal: controller.signal,
    });
    if (!response.ok) return { status: "error", release: null, message: `GitHub returned ${response.status}` };
    const payload = await response.json();
    const releases = Array.isArray(payload) ? payload.map(parseRelease).filter((item): item is UpdateRelease => item !== null) : [];
    const release = releases.sort((left, right) => compareVersions(right.version, left.version))[0] || null;
    if (!release || compareVersions(currentVersion, release.version) >= 0 || !selectWindowsInstaller(release)) return { status: "up-to-date", release };
    return { status: "available", release };
  } catch (error) {
    return { status: "error", release: null, message: error instanceof Error ? error.message : "Unable to check for updates" };
  } finally {
    clearTimeout(timeout);
  }
}
