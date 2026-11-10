import { assertEquals } from 'jsr:@std/assert';
import {
  createClassOperationApplier,
  type ClassOperationPersistence,
} from '../../../../supabase/functions/_shared/offline_operations.ts';

function operation(type: 'class.create' | 'class.rename', payload: Record<string, unknown>) {
  return {
    operationId: `operation-${type}`,
    deviceId: 'device-1',
    actorId: 'teacher-1',
    type,
    entityId: type === 'class.create' ? 'class-local-1' : 'class-1',
    payload,
    dependencies: [],
    createdAt: '2026-11-10T00:00:00.000Z',
  };
}

Deno.test('class.create persists a teacher-owned classroom and returns it', async () => {
  let createdInput: { id: string; teacherId: string; name: string } | null = null;
  const persistence: ClassOperationPersistence = {
    createClass: async (input) => {
      createdInput = input;
      return { id: input.id, teacher_id: input.teacherId, name: input.name, archived_at: null };
    },
    getTeacherClass: async () => null,
    renameClass: async () => null,
  };

  const result = await createClassOperationApplier(persistence)('teacher-1', operation('class.create', {
    classId: 'class-local-1',
    name: '  Year 5  ',
  }));

  assertEquals(createdInput, { id: 'class-local-1', teacherId: 'teacher-1', name: 'Year 5' });
  assertEquals(result, {
    status: 'accepted',
    result: {
      classroom: { id: 'class-local-1', teacher_id: 'teacher-1', name: 'Year 5', archived_at: null },
    },
  });
});

Deno.test('class.rename requires an existing classroom owned by the teacher', async () => {
  let renamed = false;
  const persistence: ClassOperationPersistence = {
    createClass: async () => ({ id: 'class-1', teacher_id: 'teacher-1', name: 'Classroom' }),
    getTeacherClass: async (teacherId, classId) => teacherId === 'teacher-1' && classId === 'class-1'
      ? { id: 'class-1', teacher_id: 'teacher-1', name: 'Classroom' }
      : null,
    renameClass: async (classId, name) => {
      renamed = true;
      return { id: classId, teacher_id: 'teacher-1', name };
    },
  };

  const result = await createClassOperationApplier(persistence)('teacher-1', operation('class.rename', {
    classId: 'class-1',
    name: 'Blue Class',
  }));

  assertEquals(renamed, true);
  assertEquals(result.status, 'accepted');
});

Deno.test('class.rename rejects a classroom owned by another teacher', async () => {
  let renamed = false;
  const persistence: ClassOperationPersistence = {
    createClass: async () => ({ id: 'class-1', teacher_id: 'teacher-2', name: 'Classroom' }),
    getTeacherClass: async () => null,
    renameClass: async () => {
      renamed = true;
      return null;
    },
  };

  const result = await createClassOperationApplier(persistence)('teacher-1', operation('class.rename', {
    classId: 'class-1',
    name: 'Not allowed',
  }));

  assertEquals(result, { status: 'rejected', error: 'Classroom not found.' });
  assertEquals(renamed, false);
});
