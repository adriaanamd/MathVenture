import { assert, assertEquals, assertGreater } from "jsr:@std/assert";
import {
  collectFreePlayMediaManifest,
  isSupportedMediaPath,
} from "../../../scripts/generate-free-play-media-manifest.ts";

const assetsPath = await Deno.realPath(new URL("../../../public/assets/", import.meta.url));

Deno.test("media manifest recognizes supported image, audio, and video files only", () => {
  assertEquals(isSupportedMediaPath("assets/images/lesson.PNG"), true);
  assertEquals(isSupportedMediaPath("assets/audio/audio/voice.MP3"), true);
  assertEquals(isSupportedMediaPath("assets/audio/audio/voice.M4A"), true);
  assertEquals(isSupportedMediaPath("assets/videos/lesson.webm"), true);
  assertEquals(isSupportedMediaPath("assets/papers/research.pdf"), false);
  assertEquals(isSupportedMediaPath("assets/notes/readme.txt"), false);
});

Deno.test("media manifest covers the actual public media library with stable sorted entries", async () => {
  const first = await collectFreePlayMediaManifest(assetsPath);
  const second = await collectFreePlayMediaManifest(assetsPath);

  assertEquals(first.version, second.version);
  assertEquals(first.entries, second.entries);
  assertGreater(first.totalFiles, 200);
  assertGreater(first.totalBytes, 200_000_000);
  assertEquals(first.totalFiles, first.entries.length);
  assertEquals(first.totalBytes, first.entries.reduce((total, entry) => total + entry.bytes, 0));
  assertEquals(first.entries.every((entry, index, entries) => index === 0 || entries[index - 1].url < entry.url), true);
  assertEquals(first.entries.some((entry) => entry.url.endsWith(".pdf")), false);
  assert(first.entries.some((entry) => entry.url === "/assets/videos/5subv.mp4"));
});
