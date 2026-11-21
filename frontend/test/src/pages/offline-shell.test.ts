import { assertStringIncludes } from 'jsr:@std/assert';

Deno.test('app shell mounts the offline classroom provider and status indicator', async () => {
  const app = await Deno.readTextFile(new URL('../../../src/App.tsx', import.meta.url));
  const providers = await Deno.readTextFile(new URL('../../../src/app/providers.tsx', import.meta.url));
  const layout = await Deno.readTextFile(new URL('../../../src/components/layout.tsx', import.meta.url));
  assertStringIncludes(`${app}\n${providers}`, 'OfflineClassroomProvider');
  assertStringIncludes(layout, 'OfflineStatusIndicator');
});

Deno.test('teacher class management shows the automatic offline pack control', async () => {
  const classList = await Deno.readTextFile(new URL('../../../src/components/teacher/TeacherClassList.tsx', import.meta.url));
  assertStringIncludes(classList, 'OfflinePackPanel');
});

Deno.test('offline classroom provider declares callbacks before its loading return', async () => {
  const provider = await Deno.readTextFile(new URL('../../../src/lib/offline/classroom/useOfflineClassroom.ts', import.meta.url));
  const loadingReturn = provider.indexOf("if (!resolvedRepository) {");
  const syncCallback = provider.indexOf('const syncNow = useCallback');
  const bootstrapCallback = provider.indexOf('const bootstrapNow = useCallback');
  const automaticBootstrap = provider.indexOf('Automatic offline classroom refresh skipped');
  const initialEffectStart = provider.indexOf('if (!resolvedRepository || !teacherId');
  const initialEffectEnd = provider.indexOf('  }, [bootstrapNow, resolvedRepository, teacherId]);', initialEffectStart);
  const initialEffect = provider.slice(initialEffectStart, initialEffectEnd);

  if (loadingReturn < 0 || syncCallback < 0 || bootstrapCallback < 0 || automaticBootstrap < 0 || syncCallback > loadingReturn || bootstrapCallback > loadingReturn) {
    throw new Error('Offline callbacks must be declared before the provider loading return.');
  }
  if (!initialEffect.includes('.finally(() => { void syncNow(); })')) {
    throw new Error('Automatic online startup must also flush the durable outbox.');
  }
  const retryEffect = provider.slice(provider.indexOf('const AUTO_SYNC_INTERVAL_MS'));
  if (!retryEffect.includes('window.setInterval') || !retryEffect.includes('summary.pendingCount > 0')) {
    throw new Error('Pending operations must be retried automatically while online.');
  }
});

Deno.test('offline outbox sync uses the active signed-in auth client', async () => {
  const provider = await Deno.readTextFile(new URL('../../../src/lib/offline/classroom/useOfflineClassroom.ts', import.meta.url));
  const syncStart = provider.indexOf('const syncNow = useCallback');
  const syncEnd = provider.indexOf('const bootstrapNow = useCallback');
  const syncCallback = provider.slice(syncStart, syncEnd);

  if (!syncCallback.includes('return invokeFunction<unknown>(name, options);')) {
    throw new Error('Offline outbox sync must use the active auth client so student sessions can sync their work.');
  }
  if (syncCallback.includes('return invokeTeacherFunction<unknown>(name, options);')) {
    throw new Error('Offline outbox sync must not force the teacher auth client.');
  }
});
