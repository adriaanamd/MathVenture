import { assertEquals } from "jsr:@std/assert";

async function readSource(url: URL) {
  return (await Deno.readTextFile(url)).replace(/\r\n/g, "\n");
}

Deno.test("lesson intro video removes the skip button and uses larger sizing", async () => {
  const source = await readSource(new URL("../../../src/pages/QuizPage.tsx", import.meta.url));

  assertEquals(source.includes("Skip Video"), false);
  assertEquals(source.includes("max-w-5xl"), true);
  assertEquals(source.includes("maxHeight: '520px'"), true);
  assertEquals(source.includes("text-3xl font-display font-extrabold text-foreground text-center"), true);
});

Deno.test("lesson slide navigation uses a responsive mobile grid with a separate dot row", async () => {
  const source = await readSource(new URL("../../../src/pages/QuizPage.tsx", import.meta.url));

  assertEquals(source.includes("grid w-full max-w-2xl grid-cols-2 gap-3 sm:grid-cols-[auto_minmax(0,1fr)_auto]"), true);
  assertEquals(source.includes("col-span-2 flex flex-wrap items-center justify-center gap-1.5 sm:col-span-1 sm:col-start-2"), true);
  assertEquals(source.includes("w-full min-w-0 gap-2 font-bold sm:col-start-1 sm:row-start-1 sm:w-auto"), true);
  assertEquals(source.includes("w-full min-w-0 gap-2 font-bold sm:col-start-3 sm:row-start-1 sm:w-auto"), true);
});

Deno.test("colors quiz includes Little Color Artists as its seventh activity", async () => {
  const source = await readSource(new URL("../../../src/pages/QuizPage.tsx", import.meta.url));

  assertEquals(source.includes("Array(gameCount).fill({})"), true);
  assertEquals(source.includes("topic === 'colors' && currentIndex === 6"), true);
  assertEquals(source.includes("<LittleColorArtists"), true);
});

Deno.test("Free Play colors includes Little Color Artists as its final activity", async () => {
  const source = await readSource(new URL("../../../src/lib/games/free-play.ts", import.meta.url));

  assertEquals(source.includes("colors: GAME_COUNT_BY_TOPIC.colors"), true);
});

Deno.test("shapes quiz includes Munting Eksplorador as its ninth activity", async () => {
  const source = await readSource(new URL("../../../src/pages/QuizPage.tsx", import.meta.url));

  assertEquals(source.includes("topic === 'shapes' && currentIndex === 8"), true);
  assertEquals(source.includes("<MuntingEksplorador"), true);
});

Deno.test("comparison quiz includes Little Math Detectives as its fixed final activity", async () => {
  const source = await readSource(new URL("../../../src/pages/QuizPage.tsx", import.meta.url));

  assertEquals(source.includes("topic === 'comparison' && currentIndex === 11"), true);
  assertEquals(source.includes("<LittleMathDetectives"), true);
});

Deno.test("assigned lessons identify classroom quiz mode and use assignment quiz persistence", async () => {
  const source = await readSource(new URL("../../../src/pages/QuizPage.tsx", import.meta.url));

  assertEquals(source.includes("CLASSROOM QUIZ"), true);
  assertEquals(source.includes("ONE ATTEMPT ONLY"), true);
  assertEquals(source.includes("useAssignmentQuiz"), true);
  assertEquals(source.includes("useCheckpointAssignmentQuiz"), true);
  assertEquals(source.includes("useCompleteAssignmentQuiz"), true);
});

Deno.test("public Free Play uses a guest marker and does not persist through the classroom API", async () => {
  const source = await readSource(new URL("../../../src/pages/QuizPage.tsx", import.meta.url));

  assertEquals(source.includes("searchParams.get('freePlay') === '1'"), true);
  assertEquals(source.includes("shouldRecordStandaloneAttempt"), true);
  assertEquals(source.includes("isPublicFreePlay ? '/free-play' : '/'") , true);
});

Deno.test("teacher context does not submit standalone lesson attempts", async () => {
  const source = await readSource(new URL("../../../src/pages/QuizPage.tsx", import.meta.url));

  assertEquals(source.includes("useAuth"), true);
  assertEquals(source.includes("teacherUser"), true);
  assertEquals(source.includes("shouldRecordStandaloneAttempt"), true);
});

Deno.test("assigned completion removes replay while free play keeps the existing replay action", async () => {
  const source = await readSource(new URL("../../../src/pages/QuizPage.tsx", import.meta.url));

  assertEquals(source.includes("assignmentId ? null :"), true);
  assertEquals(source.includes("Quiz submitted — this assignment can only be taken once."), true);
  assertEquals(source.includes("submitAttempt.mutateAsync"), true);
});

Deno.test("every quiz game uses the checkpointed completion path and restores Free Play drawing activities", async () => {
  const source = await readSource(new URL("../../../src/pages/QuizPage.tsx", import.meta.url));

  assertEquals(source.includes("onComplete={handleStructuredGameComplete}"), true);
  assertEquals(source.includes("import { DrawingCanvas } from '@/components/shared/DrawingCanvas';"), true);
  assertEquals(source.includes("isDrawingBoardAvailable(topic, currentIndex, isAssignedQuiz)"), true);
  assertEquals(source.includes("getFreePlayGameCount(topic)"), true);
  assertEquals(source.includes("if (isSavingGameRef.current) return;"), true);
  assertEquals(source.includes("setIsSavingGame(true)"), true);
});

Deno.test("drawing activities submit an explicit scored result", async () => {
  const source = await readSource(new URL("../../../src/components/shared/DrawingCanvas.tsx", import.meta.url));

  assertEquals(source.includes("onComplete?: (score?: number, maxScore?: number) => void"), true);
  assertEquals(source.includes("onComplete?.(1, 1)"), true);
});

Deno.test("assigned games disable every child bypass navigation control", async () => {
  const source = await readSource(new URL("../../../src/pages/QuizPage.tsx", import.meta.url));

  assertEquals(source.includes("<AssignedQuizGameNavigation allowSkip={!isAssignedQuiz}>"), true);
  assertEquals(source.includes("React.cloneElement(child as React.ReactElement"), true);
});

Deno.test("all assigned-quiz games guard direct bypass callbacks", async () => {
  const pageSource = await readSource(new URL("../../../src/pages/QuizPage.tsx", import.meta.url));
  const imports = [...pageSource.matchAll(/from ['"](@\/components\/(?:games|shared)\/[^'"]+)['"]/g)]
    .map((match) => match[1]);

  for (const importPath of imports) {
    const filePath = new URL(`../../../src/${importPath.replace(/^@\//, '')}.tsx`, import.meta.url);
    const gameSource = await readSource(filePath);
    const hasBypassControl = /onClick=\{onComplete\}|onClick=\{handleFinish\}/.test(gameSource)
      && /Next Game|Skip Game|Skip to End|Finish Chapter|Finish Module/.test(gameSource);

    if (hasBypassControl) {
      assertEquals(gameSource.includes("allowSkip"), true, importPath);
    }
  }
});

Deno.test("structured quiz totals use the detailed game maxima", async () => {
  const source = await readSource(new URL("../../../src/pages/QuizPage.tsx", import.meta.url));

  assertEquals(source.includes("const handleStructuredGameComplete = (gameScore = 1, gameMaxScore = 1)"), true);
  assertEquals(source.includes("const maxScore = nextResults.reduce((sum, result) => sum + result.maxScore, 0);"), true);
  assertEquals(source.includes("out of ${maxScore}"), true);
});
Deno.test("quiz completion does not show success when the final save fails", async () => {
  const source = await readSource(new URL("../../../src/pages/QuizPage.tsx", import.meta.url));

  assertEquals(source.includes("const didSave = await finishAttempt(nextResults, finalScore);"), true);
  assertEquals(source.includes("if (!didSave) return;"), true);
  assertEquals(source.includes("setGameState('completed');\n      confetti"), true);
});

Deno.test("structured game completion retries the original final result after a save failure", async () => {
  const source = await readSource(new URL("../../../src/pages/QuizPage.tsx", import.meta.url));

  assertEquals(source.includes("if (pendingCompletion) {\n      await retryCompletion();\n      return;\n    }"), true);
  const finalScoreIndex = source.indexOf("const finalScore = score + (isDrawingBoardGame ? 0 : gameScore);");
  const didSaveIndex = source.indexOf("const didSave = await finishAttempt(nextResults, finalScore);", finalScoreIndex);
  const setScoreIndex = source.indexOf("setScore(finalScore);", finalScoreIndex);
  assertEquals(didSaveIndex < setScoreIndex, true);
});

Deno.test("Free Play drawing-board completion does not create a catalog result", async () => {
  const source = await readSource(new URL("../../../src/pages/QuizPage.tsx", import.meta.url));

  assertEquals(source.includes("const isDrawingBoardGame = isDrawingBoardAvailable(topic, currentIndex, isAssignedQuiz);"), true);
  assertEquals(source.includes("const nextResults = isDrawingBoardGame\n      ? gameResults\n      : withCurrentGameResult(gameResults, gameScore, gameMaxScore);"), true);
  assertEquals(source.includes("const finalScore = score + (isDrawingBoardGame ? 0 : gameScore);"), true);
});

Deno.test("video and lesson stages let every learner skip to the games intro", async () => {
  const source = await readSource(new URL("../../../src/pages/QuizPage.tsx", import.meta.url));

  assertEquals(source.includes("const skipToGames = () => {"), true);
  assertEquals(source.includes("setGameState('quiz-intro');"), true);
  assertEquals(source.includes("Skip to games"), true);
  assertEquals((source.match(/onClick=\{skipToGames\}/g) ?? []).length, 2);
  assertEquals(source.includes("!isAssignedQuiz && skipToGames"), false);
});

Deno.test("new lessons start with the DepEd theme stage before video", async () => {
  const source = await readSource(new URL("../../../src/pages/QuizPage.tsx", import.meta.url));

  assertEquals(source.includes("type GameState = 'theme' | 'video' | 'lesson'"), true);
  assertEquals(source.includes("useState<GameState>('theme')"), true);
  assertEquals(source.includes("if (gameState === 'theme')"), true);
  assertEquals(source.includes('stage="theme"'), true);
  assertEquals(source.includes("Continue to video"), true);
  assertEquals(source.includes("DEPED_THEMES"), true);
  assertEquals(source.includes("<DepEdThemeTable"), true);
});

Deno.test("assigned quiz resume still bypasses the theme stage", async () => {
  const source = await readSource(new URL("../../../src/pages/QuizPage.tsx", import.meta.url));

  assertEquals(source.includes("if (savedQuizState.status === 'completed')"), true);
  assertEquals(source.includes("if (savedQuizState.status === 'in_progress' && gameState === 'theme')"), true);
  assertEquals(source.includes("setGameState('quiz-intro')"), true);
});
