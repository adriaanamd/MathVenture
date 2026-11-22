import { assertMatch, assertStringIncludes } from "jsr:@std/assert";

Deno.test("top navigation exposes an install action without crowding mobile controls", async () => {
  const source = await Deno.readTextFile(new URL("../../../src/components/layout.tsx", import.meta.url));

  assertMatch(source, /InstallAppAction/);
  assertMatch(source, /hidden sm:inline-flex/);
});

Deno.test("teacher account control does not duplicate the mobile navigation hamburger", async () => {
  const source = await Deno.readTextFile(new URL("../../../src/components/layout.tsx", import.meta.url));

  assertStringIncludes(source, "{isTeacher ? <User className=\"h-5 w-5\" /> : (");
  assertStringIncludes(source, "<Menu className=\"h-5 w-5 md:hidden\" />");
  assertStringIncludes(source, "<User className=\"h-5 w-5 hidden md:block\" />");
});
