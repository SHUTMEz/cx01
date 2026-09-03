import assert from "node:assert/strict";
import test from "node:test";
import { checkForUpdate, compareVersions, isAllowedUpdateUrl, parseRelease, selectWindowsInstaller } from "./updateService.ts";

test("compares semantic versions without the v prefix", () => {
  assert.equal(compareVersions("1.0.3", "v1.0.4"), -1);
  assert.equal(compareVersions("v1.0.4", "1.0.4"), 0);
  assert.equal(compareVersions("1.1.0", "1.0.9"), 1);
});

test("accepts a published stable GitHub release and selects the NSIS installer", () => {
  const release = parseRelease({
    tag_name: "v1.0.4",
    name: "crtl v1.0.4",
    body: "Bug fixes",
    draft: false,
    prerelease: false,
    assets: [{ name: "crtl_1.0.4_x64-setup.exe", browser_download_url: "https://github.com/SHUTMEz/cx01/releases/download/v1.0.4/crtl_1.0.4_x64-setup.exe" }],
  });
  assert.equal(release?.version, "1.0.4");
  assert.equal(selectWindowsInstaller(release), "https://github.com/SHUTMEz/cx01/releases/download/v1.0.4/crtl_1.0.4_x64-setup.exe");
});

test("rejects prereleases, malformed releases, and unsafe update URLs", () => {
  assert.equal(parseRelease({ tag_name: "v1.0.5", draft: false, prerelease: true, assets: [] }), null);
  assert.equal(parseRelease({ tag_name: "latest", draft: false, prerelease: false, assets: [] }), null);
  assert.equal(isAllowedUpdateUrl("https://github.com/SHUTMEz/cx01/releases/download/v1.0.4/app.exe"), true);
  assert.equal(isAllowedUpdateUrl("https://evil.example/app.exe"), false);
  assert.equal(isAllowedUpdateUrl("http://github.com/SHUTMEz/cx01/app.exe"), false);
});

test("checks GitHub releases and reports an available update", async () => {
  const fetcher = async () => ({ ok: true, json: async () => [{ tag_name: "v1.0.4", name: "crtl v1.0.4", body: "Fixes", draft: false, prerelease: false, assets: [{ name: "crtl_1.0.4_x64-setup.exe", browser_download_url: "https://github.com/SHUTMEz/cx01/releases/download/v1.0.4/crtl_1.0.4_x64-setup.exe" }] }] });
  const result = await checkForUpdate("1.0.3", fetcher);
  assert.equal(result.status, "available");
  assert.equal(result.release?.version, "1.0.4");
});
