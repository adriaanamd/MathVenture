import type { OfflineRepository } from './repository.ts';

export type PendingMutationResult = {
  id: string;
  syncState: 'pending';
};

function makeId(idFactory?: () => string): string {
  return idFactory?.() ?? crypto.randomUUID();
}

export async function createOfflineClass(
  repository: OfflineRepository,
  actorId: string,
  name: string,
  idFactory?: () => string,
): Promise<PendingMutationResult> {
  const id = makeId(idFactory);
  const localEntity = {
    id,
    teacher_id: actorId,
    name: name.trim(),
    created_at: new Date().toISOString(),
    archived_at: null,
  };
  await repository.applyMutation({
    actorId,
    type: 'class.create',
    entityId: id,
    payload: { classId: id, name: localEntity.name },
    dependencies: [],
    localEntity,
  });
  return { id, syncState: 'pending' };
}

export async function renameOfflineClass(
  repository: OfflineRepository,
  actorId: string,
  classId: string,
  name: string,
): Promise<PendingMutationResult> {
  const current = await repository.readByKey('classrooms', classId);
  if (!current || typeof current !== 'object') {
    throw new Error('Classroom is not available offline.');
  }
  const pendingCreate = (await repository.getOutbox()).find(
    (operation) => operation.type === 'class.create' && operation.entityId === classId,
  );
  const localEntity = {
    ...current,
    id: classId,
    name: name.trim(),
  };
  await repository.applyMutation({
    actorId,
    type: 'class.rename',
    entityId: classId,
    payload: { classId, name: name.trim() },
    dependencies: pendingCreate ? [pendingCreate.operationId] : [],
    localEntity,
  });
  return { id: classId, syncState: 'pending' };
}

export async function createOfflineAssignment(
  repository: OfflineRepository,
  actorId: string,
  input: { lessonId: string; name?: string; classId?: string; studentId?: string; dueAt?: string | null },
  idFactory?: () => string,
): Promise<PendingMutationResult> {
  const id = makeId(idFactory);
  await repository.applyMutation({
    actorId,
    type: 'assignment.create',
    entityId: id,
    payload: { id, ...input },
    dependencies: [],
  });
  return { id, syncState: 'pending' };
}

export async function updateOfflineAssignment(
  repository: OfflineRepository,
  actorId: string,
  input: { assignmentId: string; lessonId: string; name?: string; classId?: string; dueAt?: string | null },
  dependencies: string[] = [],
): Promise<PendingMutationResult> {
  await repository.applyMutation({
    actorId,
    type: 'assignment.update',
    entityId: input.assignmentId,
    payload: { ...input, id: input.assignmentId },
    dependencies,
  });
  return { id: input.assignmentId, syncState: 'pending' };
}

export async function deleteOfflineAssignment(
  repository: OfflineRepository,
  actorId: string,
  assignmentId: string,
): Promise<PendingMutationResult> {
  await repository.applyMutation({
    actorId,
    type: 'assignment.delete',
    entityId: assignmentId,
    payload: { assignmentId },
    dependencies: [],
  });
  return { id: assignmentId, syncState: 'pending' };
}

export async function addOfflineStudents(
  repository: OfflineRepository,
  actorId: string,
  classIdOrStudents: string | Array<{ firstName: string; lastName: string }>,
  studentsOrIdFactory?: Array<{ firstName: string; lastName: string }> | (() => string),
  idFactory?: () => string,
): Promise<PendingMutationResult> {
  const classId = typeof classIdOrStudents === 'string' ? classIdOrStudents : undefined;
  const students = typeof classIdOrStudents === 'string'
    ? (studentsOrIdFactory as Array<{ firstName: string; lastName: string }> ?? [])
    : classIdOrStudents;
  const resolvedIdFactory = typeof classIdOrStudents === 'string'
    ? idFactory
    : studentsOrIdFactory as (() => string) | undefined;
  const id = makeId(resolvedIdFactory);
  const localStudents = students.map((student, index) => ({ ...student, localId: `${id}:${index}` }));
  await repository.applyMutation({
    actorId,
    type: 'class.addStudents',
    entityId: id,
    payload: { ...(classId ? { classId } : {}), students: localStudents },
    dependencies: [],
  });
  const classroom = classId
    ? (await repository.readCollection('classrooms')).find((row) => String(row.id) === classId)
    : (await repository.readCollection('classrooms')).length === 1
      ? (await repository.readCollection('classrooms'))[0]
      : undefined;
  await repository.putSnapshot('classStudents', localStudents.map((student) => ({
    id: student.localId,
    student_id: student.localId,
    class_id: classroom?.id ?? '',
    full_name: `${student.firstName} ${student.lastName}`.trim(),
    first_name: student.firstName,
    last_name: student.lastName,
    joined_at: new Date().toISOString(),
  })));
  return { id, syncState: 'pending' };
}

export async function removeOfflineStudent(
  repository: OfflineRepository,
  actorId: string,
  classIdOrStudentId: string,
  selectedStudentId?: string,
): Promise<PendingMutationResult> {
  const classId = selectedStudentId ? classIdOrStudentId : undefined;
  const studentId = selectedStudentId ?? classIdOrStudentId;
  await repository.applyMutation({
    actorId,
    type: 'class.removeStudent',
    entityId: studentId,
    payload: { ...(classId ? { classId } : {}), studentId },
    dependencies: [],
  });
  return { id: studentId, syncState: 'pending' };
}

export async function createOfflinePost(
  repository: OfflineRepository,
  actorId: string,
  input: { classId: string; content: string },
  idFactory?: () => string,
): Promise<PendingMutationResult> {
  const id = makeId(idFactory);
  await repository.applyMutation({
    actorId,
    type: 'post.create',
    entityId: id,
    payload: { id, ...input, authorId: actorId },
    dependencies: [],
  });
  return { id, syncState: 'pending' };
}
