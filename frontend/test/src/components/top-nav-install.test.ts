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

Deno.test("top navigation brand link and mobile controls shrink cleanly without overlapping offline status", async () => {
  const source = await Deno.readTextFile(new URL("../../../src/components/layout.tsx", import.meta.url));

  assertStringIncludes(source, 'className="flex min-w-0 cursor-pointer items-center gap-1.5 group sm:gap-2"');
  assertStringIncludes(source, 'className="h-7 w-7 shrink-0 text-primary group-hover:rotate-45 transition-transform sm:h-8 sm:w-8"');
  assertStringIncludes(source, 'className="flex shrink-0 items-center gap-1.5 sm:gap-4"');
});
