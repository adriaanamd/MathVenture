import React, { useState, useEffect, useRef } from 'react';
import { useRoute, useSearch, useLocation } from 'wouter';
import { allTopics } from '@/data';
import { GAME_COUNT_BY_TOPIC, type TeacherTopicId } from '@/lib/games/catalog';

import { lessonContent } from '@content/lessonContent';
import { GameLayout } from '@/components/GameLayout';
import { DepEdThemeTable } from '@/components/DepEdThemeTable';
import { LessonSlideCard } from '@/components/LessonSlideCard';
import { ColorMatchingGame } from '@/components/games/1-colors/ColorMatchingGame';
import { BalloonFindingGame } from '@/components/games/1-colors/BalloonFindingGame';
import { RainbowColorCatcher } from '@/components/games/1-colors/RainbowColorCatcher';
import { RainbowColorDeluxe } from '@/components/games/1-colors/RainbowColorDeluxe';
import { RainbowGalaxyExplorer } from '@/components/games/1-colors/RainbowGalaxyExplorer';
import { ChooseWhichColor } from '@/components/games/1-colors/ChooseWhichColor';
import { LittleColorArtists } from '@/components/games/1-colors/LittleColorArtists';
import { ShapeMatchingGame } from '@/components/games/2-shapes/ShapeMatchingGame';
import { FindTheShape } from '@/components/games/2-shapes/FindTheShape';
import { MonsterCafe } from '@/components/games/2-shapes/MonsterCafe';
import { ShapeMatcher } from '@/components/games/2-shapes/ShapeMatcher';
import { ShapeHunter } from '@/components/games/2-shapes/ShapeHunter';
import { ShapeRacing } from '@/components/games/2-shapes/ShapeRacing';
import { ShapeWizard } from '@/components/games/2-shapes/ShapeWizard';
import { HungryDragon } from '@/components/games/2-shapes/HungryDragon';
import { MuntingEksplorador } from '@/components/games/2-shapes/MuntingEksplorador';
import { ArrangeNumbers } from '@/components/games/3-sequencing/ArrangeNumbers';
import { ArrangeLetters } from '@/components/games/3-sequencing/ArrangeLetters';
import { SizeSorter } from '@/components/games/3-sequencing/SizeSorter';
import { ShortestLongest } from '@/components/games/3-sequencing/ShortestLongest';
import { SmallestLargestCake } from '@/components/games/3-sequencing/SmallestLargestCake';
import { SurpriseSequencing } from '@/components/games/3-sequencing/SurpriseSequencing';
import { AnimalVehicleBuilder } from '@/components/games/3-sequencing/AnimalVehicleBuilder';
import { PatternTrainAcademy } from '@/components/games/3-sequencing/PatternTrainAcademy';
import { SandwichMaker } from '@/components/games/3-sequencing/SandwichMaker';
import { UnderTheSea } from '@/components/games/4-addition/UnderTheSea';
import { Carnival } from '@/components/games/4-addition/Carnival';
import { IceCreamShop } from '@/components/games/4-addition/IceCreamShop';
import { Pizza } from '@/components/games/4-addition/Pizza';
import { ComicStarCatcher } from '@/components/games/4-addition/ComicStarCatcher';
import { AdditionFunGame } from '@/components/games/4-addition/AdditionFunGame';
import { AppleAddition } from '@/components/games/4-addition/AppleAddition';
import { FruitPopMath } from '@/components/games/4-addition/FruitPopMath';
import { AdditionAdventure } from '@/components/games/4-addition/AdditionAdventure';
import { SecondAdditionRound } from '@/components/games/4-addition/SecondAdditionRound';
import { AnimalSafari } from '@/components/games/4-addition/AnimalSafari';
import { AdditionReplacementOne } from '@/components/games/4-addition/AdditionReplacementOne';
import { AdditionReplacementTwo } from '@/components/games/4-addition/AdditionReplacementTwo';
import { AdditionReplacementThree } from '@/components/games/4-addition/AdditionReplacementThree';
import { AdditionReplacementFour } from '@/components/games/4-addition/AdditionReplacementFour';
import { SubtractionBalloon } from '@/components/games/5-subtraction/SubtractionBalloon';
import { FruitSubtraction } from '@/components/games/5-subtraction/FruitSubtraction';
import { GentleMathDrift } from '@/components/games/5-subtraction/GentleMathDrift';
import { SubtractionAdventure } from '@/components/games/5-subtraction/SubtractionAdventure';
import { SubtractionPop } from '@/components/games/5-subtraction/SubtractionPop';
import { DinoEgg } from '@/components/games/5-subtraction/DinoEgg';
import { FarmHideSeek } from '@/components/games/5-subtraction/FarmHideSeek';
import { FeedTheHippo } from '@/components/games/5-subtraction/FeedTheHippo';
import { SpaceBlast } from '@/components/games/5-subtraction/SpaceBlast';
import { DragCorrectNumber } from '@/components/games/6-numbers/DragCorrectNumber';
import { CountMatch } from '@/components/games/6-numbers/CountMatch';
import { DeepDive } from '@/components/games/6-numbers/DeepDive';
import { ToyFactory } from '@/components/games/6-numbers/ToyFactory';
import { NumberMonster } from '@/components/games/6-numbers/NumberMonster';
import { NumberReplacementAnimalPop } from '@/components/games/6-numbers/NumberReplacementAnimalPop';
import { NumberReplacementHungryMonster } from '@/components/games/6-numbers/NumberReplacementHungryMonster';
import { NumberReplacementWhackMole } from '@/components/games/6-numbers/NumberReplacementWhackMole';
import { SlowFun } from '@/components/games/7-measurement/SlowFun';
import { SmallShort } from '@/components/games/7-measurement/SmallShort';
import { LightHeavy } from '@/components/games/7-measurement/LightHeavy';
import { TinyBuilderRuler } from '@/components/games/7-measurement/TinyBuilderRuler';
import { MagicRainbowBridge } from '@/components/games/7-measurement/MagicRainbowBridge';
import { SnakeGame } from '@/components/games/7-measurement/SnakeGame';
import { Paghahambing1 } from '@/components/games/8-comparison/Paghahambing1';
import { AyusinAngLaki } from '@/components/games/8-comparison/AyusinAngLaki';
import { MaramiKaunti } from '@/components/games/8-comparison/MaramiKaunti';
import { MataasMababa } from '@/components/games/8-comparison/MataasMababa';
import { MatchingTypeA } from '@/components/games/8-comparison/MatchingTypeA';
import { BarnyardBalance } from '@/components/games/8-comparison/BarnyardBalance';
import { SkyExplorer } from '@/components/games/8-comparison/SkyExplorer';
import { MadScientist } from '@/components/games/8-comparison/MadScientist';
import { WhichIsLonger } from '@/components/games/8-comparison/WhichIsLonger';
import { WhichIsComp } from '@/components/games/8-comparison/WhichIsComp';
import { CatchFall } from '@/components/games/8-comparison/CatchFall';
import { LittleMathDetectives } from '@/components/games/8-comparison/LittleMathDetectives';
import { TimeAdventure } from '@/components/games/9-clock/TimeAdventure';
import { TimeMatcher } from '@/components/games/9-clock/TimeMatcher';
import { DragMatchingClock } from '@/components/games/9-clock/DragMatchingClock';
import { FillMissingTime } from '@/components/games/9-clock/FillMissingTime';
import { DailyRoutineTime } from '@/components/games/9-clock/DailyRoutineTime';
import { BuildClock } from '@/components/games/9-clock/BuildClock';
import { ClockMultiple } from '@/components/games/9-clock/ClockMultiple';
import { DrawingCanvas } from '@/components/shared/DrawingCanvas';
import { Card, Button } from '@/components/ui';
import { CheckCircle2, XCircle, Trophy, Play, ChevronRight, ChevronLeft } from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  useAssignmentQuiz,
  useCheckpointAssignmentQuiz,
  useCompleteAssignmentQuiz,
  useStartAssignmentQuiz,
  useSubmitAttempt,
} from '@features/assignments/api/hooks';
import { useRecordFreePlayCompletion } from '@features/progress/api/hooks';
import {
  appendAttemptGameResult,
  buildAttemptGameResult,
  type AttemptGameResultInput,
} from '@/lib/games/attempt-results';
import { buildStudentLessonExitHref } from '@features/student/model/portal';
import { getFreePlayGameCount, isDrawingBoardAvailable } from '@/lib/games/free-play';
import { useAuth } from '@/lib/auth';
import { shouldRecordStandaloneAttempt } from '@/lib/quiz/recording';
import { DEPED_THEMES } from '@content/depedThemes';

type GameState = 'theme' | 'video' | 'lesson' | 'quiz-intro' | 'playing' | 'feedback' | 'completed';

function ClassroomQuizBanner({
  error,
  onRetry,
  isRetrying = false,
}: {
  error?: string | null;
  onRetry?: () => void;
  isRetrying?: boolean;
}) {
  return (
    <Card className="w-full max-w-3xl border-4 border-jungle-yellow bg-jungle-yellow/10 p-4 text-center shadow-md">
      <p className="text-sm font-black uppercase tracking-[0.18em] text-primary">CLASSROOM QUIZ</p>
      <p className="mt-1 text-xl font-display font-extrabold text-foreground">ONE ATTEMPT ONLY</p>
      <p className="mt-1 text-sm font-bold text-muted-foreground">
        This assigned quiz can be submitted once. Free play remains available separately for practice.
      </p>
      {error && <p className="mt-2 text-sm font-extrabold text-destructive">{error}</p>}
      {onRetry && (
        <Button
          type="button"
          variant="outline"
          className="mt-3"
          onClick={onRetry}
          disabled={isRetrying}
        >
          {isRetrying ? 'Saving score...' : 'Retry saving score'}
        </Button>
      )}
    </Card>
  );
}

function AssignedQuizGameNavigation({
  allowSkip,
  children,
}: {
  allowSkip: boolean;
  children: React.ReactNode;
}) {
  const child = React.Children.only(children);

  return React.isValidElement(child) && typeof child.type !== 'string'
    ? React.cloneElement(child as React.ReactElement<{ allowSkip?: boolean }>, { allowSkip })
    : child;
}

export function QuizPage() {
  const [, params] = useRoute('/student/lessons/:topic');
  const searchStr = useSearch();
  const searchParams = new URLSearchParams(searchStr);
  const assignmentId = searchParams.get('assignmentId') || undefined;
  const classId = searchParams.get('classId') || undefined;
  const returnTo = searchParams.get('returnTo');
  const isPublicFreePlay = !assignmentId && searchParams.get('freePlay') === '1';
  const { teacherUser } = useAuth();
  const topic = params?.topic || 'colors';
  const [, setLocation] = useLocation();
  const submitAttempt = useSubmitAttempt();
  const recordFreePlayCompletion = useRecordFreePlayCompletion();
  const assignmentQuiz = useAssignmentQuiz(assignmentId, topic);
  const startAssignmentQuiz = useStartAssignmentQuiz();
  const checkpointAssignmentQuiz = useCheckpointAssignmentQuiz();
  const completeAssignmentQuiz = useCompleteAssignmentQuiz();
  const exitHref = isPublicFreePlay
    ? '/free-play'
    : buildStudentLessonExitHref({ classId, returnTo });
  const isAssignedQuiz = Boolean(assignmentId);

  const rawQuestions = allTopics[topic as keyof typeof allTopics] || [];

  const topicGameCount = GAME_COUNT_BY_TOPIC[topic as TeacherTopicId];
  const gameCount = isAssignedQuiz ? topicGameCount : getFreePlayGameCount(topic);
  const questions = topic === 'colors'
    ? Array(gameCount).fill({})
    : rawQuestions.slice(0, gameCount);

  const lesson = lessonContent[topic];

  // ── Stage state ────────────────────────────────────────────────────────────
  const [gameState, setGameState] = useState<GameState>('theme');
  const [slideIndex, setSlideIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // ── Quiz state ─────────────────────────────────────────────────────────────
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<{ image: string; isCorrect: boolean } | null>(null);
  const [score, setScore] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [gameResults, setGameResults] = useState<AttemptGameResultInput[]>([]);
  const [quizPersistenceError, setQuizPersistenceError] = useState<string | null>(null);
  const [pendingCompletion, setPendingCompletion] = useState<{
    results: AttemptGameResultInput[];
    score: number;
    maxScore: number;
    durationSeconds: number;
  } | null>(null);
  const [isSavingGame, setIsSavingGame] = useState(false);
  const isSavingGameRef = useRef(false);

  const question = questions[currentIndex];
  const slides = lesson?.slides ?? [];
  const savedQuizState = assignmentQuiz.data?.state;

  useEffect(() => {
    if (!assignmentId || !savedQuizState) return;

    if (savedQuizState.status === 'completed') {
      setCurrentIndex(savedQuizState.currentGameOrder);
      setScore(savedQuizState.score);
      setGameResults(savedQuizState.gameResults);
      setGameState('completed');
      return;
    }

    if (savedQuizState.status === 'in_progress' && gameState === 'theme') {
      setCurrentIndex(savedQuizState.currentGameOrder);
      setScore(savedQuizState.score);
      setGameResults(savedQuizState.gameResults);
      setGameState('quiz-intro');
    }
  }, [assignmentId, gameState, savedQuizState?.status, savedQuizState?.currentGameOrder]);

  // ── Stage helpers ──────────────────────────────────────────────────────────
  const goToVideo = () => {
    setGameState('video');
  };

  const goToLesson = () => {
    setSlideIndex(0);
    setGameState('lesson');
  };

  const goToQuiz = () => {
    setGameState('quiz-intro');
  };

  const skipToGames = () => {
    setGameState('quiz-intro');
  };

  const handleExit = () => {
    setLocation(exitHref);
  };

  // ── Quiz handlers ──────────────────────────────────────────────────────────
  const startGame = async () => {
    setQuizPersistenceError(null);
    if (assignmentId) {
      try {
        await startAssignmentQuiz.mutateAsync({ assignmentId, lessonId: topic });
      } catch (error) {
        setQuizPersistenceError(error instanceof Error ? error.message : 'Unable to start the classroom quiz.');
        return;
      }
    }

    const resumeIndex = savedQuizState?.status === 'in_progress'
      ? savedQuizState.currentGameOrder
      : 0;
    const resumeScore = savedQuizState?.status === 'in_progress'
      ? savedQuizState.score
      : 0;
    const resumeResults = savedQuizState?.status === 'in_progress'
      ? savedQuizState.gameResults
      : [];
    setCurrentIndex(resumeIndex);
    setSelectedOption(null);
    setScore(resumeScore);
    setGameResults(resumeResults);
    setGameState('playing');
    setStartTime(Date.now());
  };

  const withCurrentGameResult = (
    current: AttemptGameResultInput[],
    gameScore: number,
    gameMaxScore: number,
  ) => appendAttemptGameResult(
    current,
    buildAttemptGameResult(topic, currentIndex, gameScore, gameMaxScore),
  );

  const maxScore = gameResults.reduce((sum, result) => sum + result.maxScore, 0);

  const handleSelect = (option: { image: string; isCorrect: boolean }) => {
    if (gameState !== 'playing') return;
    setSelectedOption(option);
    setGameState('feedback');
    if (option.isCorrect) setScore(s => s + 1);
  };

  const saveQuizCheckpoint = async (
    result: AttemptGameResultInput,
    nextScore: number,
  ) => {
    if (!assignmentId) return true;
    try {
      await checkpointAssignmentQuiz.mutateAsync({
        assignmentId,
        lessonId: topic,
        score: nextScore,
        gameResult: result,
      });
      return true;
    } catch (error) {
      setQuizPersistenceError(error instanceof Error ? error.message : 'Unable to save quiz progress.');
      return false;
    }
  };

  const finishAttempt = async (
    nextResults: AttemptGameResultInput[],
    finalScore = score,
    savedDurationSeconds = Math.round((Date.now() - startTime) / 1000),
  ): Promise<boolean> => {
    const maxScore = nextResults.reduce((sum, result) => sum + result.maxScore, 0);
    try {
      if (assignmentId) {
        await completeAssignmentQuiz.mutateAsync({
          assignmentId,
          lessonId: topic,
          score: finalScore,
          maxScore,
          durationSeconds: savedDurationSeconds,
          gameResults: nextResults,
        });
      } else if (shouldRecordStandaloneAttempt({
        isPublicFreePlay,
        isTeacherContext: Boolean(teacherUser),
      })) {
        if (!isPublicFreePlay && !teacherUser) {
          await recordFreePlayCompletion.mutateAsync({
            gameId: `${topic}:${currentIndex}`,
            score: finalScore,
            maxScore,
            completedAt: new Date().toISOString(),
          });
        }
        await submitAttempt.mutateAsync({
          lessonId: topic,
          assignmentId,
          classId,
          score: finalScore,
          maxScore,
          durationSeconds: savedDurationSeconds,
          gameResults: nextResults,
        });
      }
      setQuizPersistenceError(null);
      setPendingCompletion(null);
      setGameState('completed');
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#22c55e', '#eab308', '#f97316'] });
      return true;
    } catch (e) {
      setQuizPersistenceError(e instanceof Error ? e.message : 'Unable to submit the quiz.');
      setPendingCompletion({
        results: nextResults,
        score: finalScore,
        maxScore,
        durationSeconds: savedDurationSeconds,
      });
      return false;
    }
  };

  const retryCompletion = async () => {
    if (!pendingCompletion || isSavingGameRef.current) return;
    const completion = pendingCompletion;
    isSavingGameRef.current = true;
    setIsSavingGame(true);
    try {
      const didSave = await finishAttempt(completion.results, completion.score, completion.durationSeconds);
      if (didSave) setScore(completion.score);
    } finally {
      isSavingGameRef.current = false;
      setIsSavingGame(false);
    }
  };

  const completeStructuredGame = async (gameScore = 1, gameMaxScore = 1) => {
    if (pendingCompletion) {
      await retryCompletion();
      return;
    }
    if (isSavingGameRef.current) return;
    isSavingGameRef.current = true;
    setIsSavingGame(true);
    const isDrawingBoardGame = isDrawingBoardAvailable(topic, currentIndex, isAssignedQuiz);
    const nextResults = isDrawingBoardGame
      ? gameResults
      : withCurrentGameResult(gameResults, gameScore, gameMaxScore);
    setGameResults(nextResults);

    try {
      if (currentIndex < questions.length - 1) {
        const nextScore = score + (isDrawingBoardGame ? 0 : gameScore);
        if (!(await saveQuizCheckpoint(nextResults[nextResults.length - 1], nextScore))) return;
        setScore(nextScore);
        setCurrentIndex((value) => value + 1);
        setSelectedOption(null);
        setGameState('playing');
        return;
      }

      const finalScore = score + (isDrawingBoardGame ? 0 : gameScore);
      const didSave = await finishAttempt(nextResults, finalScore);
      if (!didSave) return;
      setScore(finalScore);
    } finally {
      isSavingGameRef.current = false;
      setIsSavingGame(false);
    }
  };

  const handleStructuredGameComplete = (gameScore = 1, gameMaxScore = 1) => {
    void completeStructuredGame(gameScore, gameMaxScore);
  };

  const handleNext = async () => {
    if (isSavingGameRef.current) return;
    isSavingGameRef.current = true;
    setIsSavingGame(true);
    const questionScore = selectedOption?.isCorrect ? 1 : 0;
    const nextResults = withCurrentGameResult(gameResults, questionScore, 1);
    setGameResults(nextResults);

    try {
      if (currentIndex < questions.length - 1) {
        if (!(await saveQuizCheckpoint(nextResults[nextResults.length - 1], score))) return;
        setCurrentIndex(c => c + 1);
        setSelectedOption(null);
        setGameState('playing');
      } else {
        await finishAttempt(nextResults);
      }
    } finally {
      isSavingGameRef.current = false;
      setIsSavingGame(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: no lesson content for this topic
  // ─────────────────────────────────────────────────────────────────────────
  if (assignmentId && assignmentQuiz.isLoading) {
    return (
      <GameLayout topic={topic} stage="quiz" onExit={handleExit}>
        <Card className="max-w-md w-full p-8 text-center">
          <p className="font-bold text-muted-foreground">Loading your classroom quiz...</p>
        </Card>
      </GameLayout>
    );
  }

  if (assignmentId && assignmentQuiz.isError) {
    return (
      <GameLayout topic={topic} stage="quiz" onExit={handleExit}>
        <ClassroomQuizBanner error={assignmentQuiz.error instanceof Error ? assignmentQuiz.error.message : 'Unable to load this classroom quiz.'} />
      </GameLayout>
    );
  }

  if (!questions.length && !lesson) {
    return (
      <GameLayout topic={topic} title="Coming Soon" onExit={handleExit}>
        <Card className="p-8 text-center max-w-md w-full">
          <h2 className="text-2xl font-bold mb-4">Under Construction</h2>
          <p className="text-muted-foreground mb-8">This chapter's questions are being built!</p>
          <Button onClick={handleExit}>Go Back</Button>
        </Card>
      </GameLayout>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: VIDEO STAGE
  // ─────────────────────────────────────────────────────────────────────────
  if (gameState === 'theme') {
    return (
      <GameLayout topic={topic} stage="theme" onExit={handleExit}>
        <div className="w-full max-w-5xl flex flex-col items-center gap-6 animate-in fade-in duration-500">
          <div className="text-center space-y-1">
            <h1 className="text-3xl font-display font-extrabold text-foreground capitalize">{topic}</h1>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-muted-foreground">
              DepEd Curriculum Theme
            </p>
          </div>

          <DepEdThemeTable theme={DEPED_THEMES[topic as TeacherTopicId]} />

          <Button
            size="lg"
            variant="jungle"
            className="h-14 gap-2 rounded-full px-8 text-lg shadow-lg shadow-primary/20 transition-transform hover:scale-105"
            onClick={goToVideo}
          >
            Continue to video <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </GameLayout>
    );
  }

  if (gameState === 'video') {
    return (
      <GameLayout topic={topic} stage="video" onExit={handleExit}>
        <div className="w-full max-w-5xl flex flex-col items-center gap-6 animate-in fade-in duration-500">
          {isAssignedQuiz && (
            <ClassroomQuizBanner
              error={quizPersistenceError}
              onRetry={pendingCompletion ? () => void retryCompletion() : undefined}
              isRetrying={isSavingGame}
            />
          )}
          {/* Title */}
          <div className="text-center space-y-1">
            <h1 className="text-3xl font-display font-extrabold text-foreground capitalize">{topic}</h1>
            <p className="text-sm font-bold text-muted-foreground">Watch the video first!</p>
          </div>

          {/* Video player */}
          {lesson?.videoSrc ? (
            <Card className="w-full overflow-hidden border-4 border-primary/30 shadow-2xl rounded-2xl">
              <video
                ref={videoRef}
                src={lesson.videoSrc as string}
                controls
                className="w-full rounded-xl"
                style={{ maxHeight: '520px' }}
                onError={() => {/* graceful — controls still show */}}
              />
            </Card>
          ) : (
            <Card className="w-full p-12 text-center border-4 border-dashed border-primary/20">
              <p className="text-muted-foreground font-bold">Video not available</p>
            </Card>
          )}

          {/* Citation */}
          {lesson && (
            <div className="max-w-4xl space-y-2 text-center">
              <p className="text-3xl font-display font-extrabold text-foreground text-center">
                {lesson.videoTitle}
              </p>
              <p className="text-sm text-muted-foreground font-bold italic whitespace-pre-line">
                {lesson.videoCredit}
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex w-full flex-col justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              variant="jungle"
              className="gap-2 text-lg h-14 px-8 rounded-full shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
              onClick={goToLesson}
            >
              Next: Lesson <ChevronRight className="h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="gap-2 text-lg h-14 px-8 rounded-full"
              onClick={skipToGames}
            >
              Skip to games <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </GameLayout>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: LESSON STAGE
  // ─────────────────────────────────────────────────────────────────────────
  if (gameState === 'lesson') {
    const slide = slides[slideIndex];
    const isLast = slideIndex === slides.length - 1;

    return (
      <GameLayout topic={topic} stage="lesson" onExit={handleExit}>
        <div className="w-full max-w-2xl flex flex-col items-center gap-6">
          {isAssignedQuiz && (
            <ClassroomQuizBanner
              error={quizPersistenceError}
              onRetry={pendingCompletion ? () => void retryCompletion() : undefined}
              isRetrying={isSavingGame}
            />
          )}
          {slide ? (
            <LessonSlideCard slide={slide} index={slideIndex + 1} total={slides.length} />
          ) : (
            <Card className="p-8 text-center">
              <p className="font-bold text-muted-foreground">No lesson slides for this topic yet.</p>
            </Card>
          )}

          {/* Navigation */}
          <div className="grid w-full max-w-2xl grid-cols-2 gap-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
            <Button
              variant="outline"
              size="lg"
              className="w-full min-w-0 gap-2 font-bold sm:col-start-1 sm:row-start-1 sm:w-auto"
              disabled={slideIndex === 0}
              onClick={() => setSlideIndex(i => i - 1)}
            >
              <ChevronLeft className="h-5 w-5 shrink-0" /> Back
            </Button>

            {isLast || !slides.length ? (
              <Button
                variant="jungle"
                size="lg"
                className="h-12 w-full min-w-0 gap-2 rounded-full px-4 text-center font-bold shadow-lg transition-transform hover:scale-105 sm:col-start-3 sm:row-start-1 sm:w-auto sm:px-6"
                onClick={goToQuiz}
              >
                Start Activities <ChevronRight className="h-5 w-5 shrink-0" />
              </Button>
            ) : (
              <Button
                variant="outline"
                size="lg"
                className="w-full min-w-0 gap-2 font-bold sm:col-start-3 sm:row-start-1 sm:w-auto"
                onClick={() => setSlideIndex(i => i + 1)}
              >
                Next <ChevronRight className="h-5 w-5 shrink-0" />
              </Button>
            )}

            {/* Dot pagination */}
            <div className="col-span-2 flex flex-wrap items-center justify-center gap-1.5 sm:col-span-1 sm:col-start-2 sm:row-start-1 sm:mx-2 sm:flex-nowrap">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSlideIndex(i)}
                  className={`h-2 w-2 rounded-full transition-all duration-200 ${i === slideIndex ? 'bg-primary w-5' : 'bg-muted-foreground/30 hover:bg-muted-foreground/60'}`}
                />
              ))}
            </div>
          </div>

          <Button
            variant="outline"
            size="lg"
            className="w-full max-w-2xl gap-2 font-bold"
            onClick={skipToGames}
          >
            Skip to games <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </GameLayout>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: QUIZ STAGES (intro / playing / feedback / completed)
  // ─────────────────────────────────────────────────────────────────────────
  if (!questions.length) {
    return (
      <GameLayout topic={topic} stage="quiz" onExit={handleExit}>
        <Card className="p-8 text-center max-w-md w-full">
          <h2 className="text-2xl font-bold mb-4">Under Construction</h2>
          <p className="text-muted-foreground mb-8">This chapter's questions are being built!</p>
          <Button onClick={handleExit}>Go Back</Button>
        </Card>
      </GameLayout>
    );
  }

  return (
    <GameLayout topic={topic} stage="quiz" onExit={handleExit}>
      {isAssignedQuiz && (
        <ClassroomQuizBanner
          error={quizPersistenceError}
          onRetry={pendingCompletion ? () => void retryCompletion() : undefined}
          isRetrying={isSavingGame}
        />
      )}

      {gameState === 'quiz-intro' && (
        <Card className="max-w-md w-full p-8 text-center animate-in zoom-in-95 duration-500 shadow-2xl border-4 border-primary">
          <div className="w-20 h-20 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-3">
            <Trophy className="h-10 w-10" />
          </div>
          <h1 className="text-3xl font-display font-bold mb-4 capitalize">{topic}</h1>
          <p className="text-lg text-muted-foreground font-bold mb-8">
            {savedQuizState?.status === 'in_progress'
              ? 'You have an unfinished classroom quiz. Continue where you left off.'
              : "Time for the activities! Let's see what you learned."}
          </p>
          <Button size="lg" variant="jungle" className="w-full text-xl h-16 rounded-full shadow-lg" onClick={() => void startGame()} disabled={startAssignmentQuiz.isPending}>
            {savedQuizState?.status === 'in_progress' ? 'Resume Quiz' : 'Start'} <Play className="ml-2 h-6 w-6 fill-current" />
          </Button>
        </Card>
      )}

      {(gameState === 'playing' || gameState === 'feedback') && question && (
        <AssignedQuizGameNavigation allowSkip={!isAssignedQuiz}>
          {isDrawingBoardAvailable(topic, currentIndex, isAssignedQuiz) ? (
            <DrawingCanvas onComplete={handleStructuredGameComplete} />
          ) : topic === 'colors' && currentIndex === 0 ? (
          <ColorMatchingGame onComplete={handleStructuredGameComplete} />
        ) : topic === 'colors' && currentIndex === 1 ? (
          <BalloonFindingGame onComplete={handleStructuredGameComplete} />
        ) : topic === 'colors' && currentIndex === 2 ? (
          <RainbowColorCatcher onComplete={handleStructuredGameComplete} />
        ) : topic === 'colors' && currentIndex === 3 ? (
          <RainbowColorDeluxe onComplete={handleStructuredGameComplete} />
        ) : topic === 'colors' && currentIndex === 4 ? (
          <RainbowGalaxyExplorer onComplete={handleStructuredGameComplete} />
        ) : topic === 'colors' && currentIndex === 5 ? (
          <ChooseWhichColor onComplete={handleStructuredGameComplete} />
        ) : topic === 'colors' && currentIndex === 6 ? (
          <LittleColorArtists onComplete={handleStructuredGameComplete} />
        ) : topic === 'shapes' && currentIndex === 0 ? (
          <ShapeMatchingGame onComplete={handleStructuredGameComplete} />
        ) : topic === 'shapes' && currentIndex === 1 ? (
          <FindTheShape onComplete={handleStructuredGameComplete} />
        ) : topic === 'shapes' && currentIndex === 2 ? (
          <MonsterCafe onComplete={handleStructuredGameComplete} />
        ) : topic === 'shapes' && currentIndex === 3 ? (
          <ShapeMatcher onComplete={handleStructuredGameComplete} />
        ) : topic === 'shapes' && currentIndex === 4 ? (
          <ShapeHunter onComplete={handleStructuredGameComplete} />
        ) : topic === 'shapes' && currentIndex === 5 ? (
          <ShapeRacing onComplete={handleStructuredGameComplete} />
        ) : topic === 'shapes' && currentIndex === 6 ? (
          <ShapeWizard onComplete={handleStructuredGameComplete} />
        ) : topic === 'shapes' && currentIndex === 7 ? (
          <HungryDragon onComplete={handleStructuredGameComplete} />
        ) : topic === 'shapes' && currentIndex === 8 ? (
          <MuntingEksplorador onComplete={handleStructuredGameComplete} />
        ) : topic === 'sequencing' && currentIndex === 0 ? (
          <ArrangeNumbers onComplete={handleStructuredGameComplete} />
        ) : topic === 'sequencing' && currentIndex === 1 ? (
          <ArrangeLetters onComplete={handleStructuredGameComplete} />
        ) : topic === 'sequencing' && currentIndex === 2 ? (
          <SizeSorter onComplete={handleStructuredGameComplete} />
        ) : topic === 'sequencing' && currentIndex === 3 ? (
          <ShortestLongest onComplete={handleStructuredGameComplete} />
        ) : topic === 'sequencing' && currentIndex === 4 ? (
          <SmallestLargestCake onComplete={handleStructuredGameComplete} />
        ) : topic === 'sequencing' && currentIndex === 5 ? (
          <SurpriseSequencing onComplete={handleStructuredGameComplete} />
        ) : topic === 'sequencing' && currentIndex === 6 ? (
          <AnimalVehicleBuilder onComplete={handleStructuredGameComplete} />
        ) : topic === 'sequencing' && currentIndex === 7 ? (
          <PatternTrainAcademy onComplete={handleStructuredGameComplete} />
        ) : topic === 'sequencing' && currentIndex === 8 ? (
          <SandwichMaker onComplete={handleStructuredGameComplete} />
        ) : topic === 'addition' && currentIndex === 0 ? (
          <AdditionReplacementOne onComplete={handleStructuredGameComplete} />
        ) : topic === 'addition' && currentIndex === 1 ? (
          <AdditionReplacementTwo onComplete={handleStructuredGameComplete} />
        ) : topic === 'addition' && currentIndex === 2 ? (
          <AdditionReplacementThree onComplete={handleStructuredGameComplete} />
        ) : topic === 'addition' && currentIndex === 3 ? (
          <AdditionReplacementFour onComplete={handleStructuredGameComplete} />
        ) : topic === 'addition' && currentIndex === 4 ? (
          <AdditionFunGame onComplete={handleStructuredGameComplete} />
        ) : topic === 'addition' && currentIndex === 5 ? (
          <AppleAddition onComplete={handleStructuredGameComplete} />
        ) : topic === 'addition' && currentIndex === 6 ? (
          <FruitPopMath onComplete={handleStructuredGameComplete} />
        ) : topic === 'addition' && currentIndex === 7 ? (
          <AdditionAdventure onComplete={handleStructuredGameComplete} />
        ) : topic === 'addition' && currentIndex === 8 ? (
          <SecondAdditionRound onComplete={handleStructuredGameComplete} />
        ) : topic === 'addition' && currentIndex === 9 ? (
          <AnimalSafari onComplete={handleStructuredGameComplete} />
        ) : topic === 'addition' && currentIndex === 10 ? (
          <UnderTheSea onComplete={handleStructuredGameComplete} />
        ) : topic === 'addition' && currentIndex === 11 ? (
          <Carnival onComplete={handleStructuredGameComplete} />
        ) : topic === 'addition' && currentIndex === 12 ? (
          <IceCreamShop onComplete={handleStructuredGameComplete} />
        ) : topic === 'addition' && currentIndex === 13 ? (
          <Pizza onComplete={handleStructuredGameComplete} />
        ) : topic === 'addition' && currentIndex === 14 ? (
          <ComicStarCatcher onComplete={handleStructuredGameComplete} />
        ) : topic === 'subtraction' && currentIndex === 0 ? (
          <SubtractionBalloon onComplete={handleStructuredGameComplete} />
        ) : topic === 'subtraction' && currentIndex === 1 ? (
          <FruitSubtraction onComplete={handleStructuredGameComplete} />
        ) : topic === 'subtraction' && currentIndex === 2 ? (
          <GentleMathDrift onComplete={handleStructuredGameComplete} />
        ) : topic === 'subtraction' && currentIndex === 3 ? (
          <SubtractionAdventure onComplete={handleStructuredGameComplete} />
        ) : topic === 'subtraction' && currentIndex === 4 ? (
          <SubtractionPop onComplete={handleStructuredGameComplete} />
        ) : topic === 'subtraction' && currentIndex === 5 ? (
          <DinoEgg onComplete={handleStructuredGameComplete} />
        ) : topic === 'subtraction' && currentIndex === 6 ? (
          <FarmHideSeek onComplete={handleStructuredGameComplete} />
        ) : topic === 'subtraction' && currentIndex === 7 ? (
          <FeedTheHippo onComplete={handleStructuredGameComplete} />
        ) : topic === 'subtraction' && currentIndex === 8 ? (
          <SpaceBlast onComplete={handleStructuredGameComplete} />
        ) : topic === 'numbers' && currentIndex === 0 ? (
          <DragCorrectNumber onComplete={handleStructuredGameComplete} />
        ) : topic === 'numbers' && currentIndex === 1 ? (
          <CountMatch onComplete={handleStructuredGameComplete} />
        ) : topic === 'numbers' && currentIndex === 2 ? (
          <NumberReplacementAnimalPop onComplete={handleStructuredGameComplete} />
        ) : topic === 'numbers' && currentIndex === 3 ? (
          <NumberReplacementHungryMonster onComplete={handleStructuredGameComplete} />
        ) : topic === 'numbers' && currentIndex === 4 ? (
          <NumberReplacementWhackMole onComplete={handleStructuredGameComplete} />
        ) : topic === 'numbers' && currentIndex === 5 ? (
          <DeepDive onComplete={handleStructuredGameComplete} />
        ) : topic === 'numbers' && currentIndex === 6 ? (
          <ToyFactory onComplete={handleStructuredGameComplete} />
        ) : topic === 'numbers' && currentIndex === 7 ? (
          <NumberMonster onComplete={handleStructuredGameComplete} />
        ) : topic === 'measurement' && currentIndex === 0 ? (
          <SlowFun onComplete={handleStructuredGameComplete} />
        ) : topic === 'measurement' && currentIndex === 1 ? (
          <SmallShort onComplete={handleStructuredGameComplete} />
        ) : topic === 'measurement' && currentIndex === 2 ? (
          <LightHeavy onComplete={handleStructuredGameComplete} />
        ) : topic === 'measurement' && currentIndex === 3 ? (
          <TinyBuilderRuler onComplete={handleStructuredGameComplete} />
        ) : topic === 'measurement' && currentIndex === 4 ? (
          <MagicRainbowBridge onComplete={handleStructuredGameComplete} />
        ) : topic === 'measurement' && currentIndex === 5 ? (
          <SnakeGame onComplete={handleStructuredGameComplete} />
        ) : topic === 'comparison' && currentIndex === 0 ? (
          <Paghahambing1 onComplete={handleStructuredGameComplete} />
        ) : topic === 'comparison' && currentIndex === 1 ? (
          <AyusinAngLaki onComplete={handleStructuredGameComplete} />
        ) : topic === 'comparison' && currentIndex === 2 ? (
          <MaramiKaunti onComplete={handleStructuredGameComplete} />
        ) : topic === 'comparison' && currentIndex === 3 ? (
          <MataasMababa onComplete={handleStructuredGameComplete} />
        ) : topic === 'comparison' && currentIndex === 4 ? (
          <MatchingTypeA onComplete={handleStructuredGameComplete} />
        ) : topic === 'comparison' && currentIndex === 5 ? (
          <BarnyardBalance onComplete={handleStructuredGameComplete} />
        ) : topic === 'comparison' && currentIndex === 6 ? (
          <SkyExplorer onComplete={handleStructuredGameComplete} />
        ) : topic === 'comparison' && currentIndex === 7 ? (
          <MadScientist onComplete={handleStructuredGameComplete} />
        ) : topic === 'comparison' && currentIndex === 8 ? (
          <WhichIsLonger onComplete={handleStructuredGameComplete} />
        ) : topic === 'comparison' && currentIndex === 9 ? (
          <WhichIsComp onComplete={handleStructuredGameComplete} />
        ) : topic === 'comparison' && currentIndex === 10 ? (
          <CatchFall onComplete={handleStructuredGameComplete} />
        ) : topic === 'comparison' && currentIndex === 11 ? (
          <LittleMathDetectives onComplete={handleStructuredGameComplete} />
        ) : topic === 'clock' && currentIndex === 0 ? (
          <TimeAdventure onComplete={handleStructuredGameComplete} />
        ) : topic === 'clock' && currentIndex === 1 ? (
          <TimeMatcher onComplete={handleStructuredGameComplete} />
        ) : topic === 'clock' && currentIndex === 2 ? (
          <DragMatchingClock onComplete={handleStructuredGameComplete} />
        ) : topic === 'clock' && currentIndex === 3 ? (
          <FillMissingTime onComplete={handleStructuredGameComplete} />
        ) : topic === 'clock' && currentIndex === 4 ? (
          <DailyRoutineTime onComplete={handleStructuredGameComplete} />
        ) : topic === 'clock' && currentIndex === 5 ? (
          <BuildClock onComplete={handleStructuredGameComplete} />
        ) : topic === 'clock' && currentIndex === 6 ? (
          <ClockMultiple onComplete={handleStructuredGameComplete} />
        ) : (
        <div className="w-full max-w-5xl flex flex-col items-center">
          {/* Question Prompt */}
          <div className="mb-12 text-center flex flex-col items-center gap-4">
            <h2
              className="text-3xl md:text-5xl font-display font-extrabold text-foreground"
              dangerouslySetInnerHTML={{ __html: question.prompt || 'Choose the correct answer' }}
            />
          </div>

          {/* Options Grid */}
          <div className="flex flex-wrap justify-center gap-6 md:gap-8">
            {question.options.map((opt: { image: string; isCorrect: boolean }, i: number) => {
              const isSelected = selectedOption === opt;
              let stateClass = 'border-border hover:-translate-y-2 hover:border-primary cursor-pointer';

              if (gameState === 'feedback') {
                if (isSelected) {
                  stateClass = opt.isCorrect
                    ? 'border-primary bg-primary/10 scale-110 cursor-default'
                    : 'border-destructive bg-destructive/10 cursor-default';
                } else {
                  stateClass = 'opacity-50 grayscale cursor-default';
                }
              }

              return (
                <Card
                  key={i}
                  className={`p-6 border-4 transition-all duration-300 flex items-center justify-center relative ${stateClass}`}
                  onClick={() => handleSelect(opt)}
                >
                  <img
                    src={`/assets/images/${opt.image}`}
                    alt="option"
                    className="w-24 h-24 md:w-32 md:h-32 object-contain drop-shadow-md"
                  />
                  {gameState === 'feedback' && isSelected && opt.isCorrect && (
                    <CheckCircle2 className="absolute top-2 right-2 h-8 w-8 text-primary animate-in zoom-in" />
                  )}
                  {gameState === 'feedback' && isSelected && !opt.isCorrect && (
                    <XCircle className="absolute top-2 right-2 h-8 w-8 text-destructive animate-in zoom-in" />
                  )}
                </Card>
              );
            })}
          </div>

          {/* Next button */}
          {gameState === 'feedback' && (
            <div className="mt-12 animate-in fade-in slide-in-from-bottom-4">
              <Button
                size="lg"
                variant={selectedOption?.isCorrect ? 'jungle' : 'secondary'}
                className="h-16 px-12 text-xl rounded-full shadow-lg"
                onClick={handleNext}
                disabled={isSavingGame}
              >
                {selectedOption?.isCorrect ? 'Great! Next Question' : 'Try the next one'}{' '}
                <Play className="ml-2 h-6 w-6 fill-current" />
              </Button>
            </div>
          )}
        </div>
          )}
        </AssignedQuizGameNavigation>
      )}

      {gameState === 'completed' && (
        <Card className="max-w-md w-full p-8 text-center animate-in zoom-in duration-500 shadow-2xl border-4 border-jungle-yellow relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-jungle-yellow/20 rounded-full blur-2xl" />
          <div className="w-24 h-24 bg-jungle-yellow text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-jungle-yellow/30">
            <Trophy className="h-12 w-12" />
          </div>
          <h1 className="text-4xl font-display font-extrabold mb-2 text-foreground">Excellent!</h1>
          <p className="text-xl font-bold text-muted-foreground mb-8">
            {isAssignedQuiz
              ? `Quiz submitted — this assignment can only be taken once. You scored ${score} out of ${maxScore}.`
              : `You scored ${score} out of ${maxScore}`}
          </p>
          {quizPersistenceError && (
            <p className="mb-6 text-sm font-extrabold text-destructive">{quizPersistenceError}</p>
          )}
          <div className="flex flex-col gap-3">
            <Button
              size="lg"
              variant="jungle"
              className="w-full text-lg shadow-md"
              onClick={isAssignedQuiz ? handleExit : () => setLocation(isPublicFreePlay ? '/free-play' : '/')}
            >
              {isAssignedQuiz ? 'Return to Classroom' : isPublicFreePlay ? 'Choose another topic' : 'Return to Main Menu'}
            </Button>
            {assignmentId ? null : (<Button
              size="lg"
              variant="ghost"
              className="w-full font-bold"
              onClick={() => {
                setCurrentIndex(0);
                setScore(0);
                setSelectedOption(null);
                setGameResults([]);
                setGameState('video');
                setSlideIndex(0);
              }}
            >
              Play Again
            </Button>)}
          </div>
        </Card>
      )}

    </GameLayout>
  );
}

