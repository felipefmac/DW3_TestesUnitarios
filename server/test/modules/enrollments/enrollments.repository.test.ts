import type { Database } from '../../../src/database/connection';
import type { Enrollment } from '../../../src/modules/enrollments/enrollments.repository';
import { PgEnrollmentRepository } from '../../../src/modules/enrollments/enrollments.repository';

function normalizeSql(sql: string): string {
  return sql.replace(/\s+/g, ' ').trim();
}

describe('Repositório de matrículas — PgEnrollmentRepository', () => {
  let db: { query: jest.Mock };
  let repository: PgEnrollmentRepository;
  const fixedDate = new Date('2026-11-15T12:00:00.000Z');

  beforeEach(() => {
    db = { query: jest.fn() };
    repository = new PgEnrollmentRepository(db as unknown as Database);
  });

  // 1. Criação
  test('insere matrícula retornando studentRa, courseId e enrolledAt em camelCase com parâmetros [123, 7]', async () => {
    const fakeEnrollment: Enrollment = {
      studentRa: 123,
      courseId: 7,
      enrolledAt: fixedDate,
    };
    db.query.mockResolvedValue({ rows: [fakeEnrollment] });

    const result = await repository.create(123, 7);

    expect(result).toEqual(fakeEnrollment);
    expect(result.studentRa).toBe(123);
    expect(result.courseId).toBe(7);
    expect(result.enrolledAt).toEqual(fixedDate);
    expect(db.query).toHaveBeenCalledTimes(1);

    const [sql, params] = db.query.mock.calls[0];
    expect(normalizeSql(sql)).toBe(
      'INSERT INTO enrollments (student_ra, course_id) VALUES ($1, $2) RETURNING student_ra AS "studentRa", course_id AS "courseId", enrolled_at AS "enrolledAt"',
    );
    expect(params).toEqual([123, 7]);
  });

  // 2. Listagem com registros
  test('retorna a lista de matrículas ordenada por student_ra, course_id sem array de parâmetros', async () => {
    const fakeEnrollments: Enrollment[] = [
      { studentRa: 123, courseId: 7, enrolledAt: fixedDate },
      { studentRa: 123, courseId: 8, enrolledAt: fixedDate },
    ];
    db.query.mockResolvedValue({ rows: fakeEnrollments });

    const result = await repository.findAll();

    expect(result).toEqual(fakeEnrollments);
    expect(db.query).toHaveBeenCalledTimes(1);

    const [sql, params] = db.query.mock.calls[0];
    expect(normalizeSql(sql)).toBe(
      'SELECT student_ra AS "studentRa", course_id AS "courseId", enrolled_at AS "enrolledAt" FROM enrollments ORDER BY student_ra, course_id',
    );
    expect(params).toBeUndefined();
  });

  // 3. Listagem vazia
  test('retorna array vazio quando não houver matrículas cadastradas', async () => {
    db.query.mockResolvedValue({ rows: [] });

    const result = await repository.findAll();

    expect(result).toEqual([]);
    expect(db.query).toHaveBeenCalledTimes(1);
  });

  // 4. Busca existente
  test('retorna a matrícula encontrada ao buscar por studentRa e courseId com filtro e parâmetros corretos', async () => {
    const fakeEnrollment: Enrollment = {
      studentRa: 123,
      courseId: 7,
      enrolledAt: fixedDate,
    };
    db.query.mockResolvedValue({ rows: [fakeEnrollment] });

    const result = await repository.findOne(123, 7);

    expect(result).toEqual(fakeEnrollment);
    expect(result?.studentRa).toBe(123);
    expect(result?.courseId).toBe(7);
    expect(result?.enrolledAt).toEqual(fixedDate);
    expect(db.query).toHaveBeenCalledTimes(1);

    const [sql, params] = db.query.mock.calls[0];
    expect(normalizeSql(sql)).toBe(
      'SELECT student_ra AS "studentRa", course_id AS "courseId", enrolled_at AS "enrolledAt" FROM enrollments WHERE student_ra = $1 AND course_id = $2',
    );
    expect(params).toEqual([123, 7]);
  });

  // 5. Busca inexistente
  test('retorna undefined ao buscar matrícula inexistente quando rows é vazio', async () => {
    db.query.mockResolvedValue({ rows: [] });

    const result = await repository.findOne(123, 7);

    expect(result).toBeUndefined();
    expect(db.query).toHaveBeenCalledTimes(1);
  });

  // 6. Falhas do banco (create, findAll e findOne testados separadamente)
  test('propaga o erro lançado pelo banco ao falhar em create', async () => {
    const dbError = new Error('Falha no banco durante create');
    db.query.mockRejectedValue(dbError);

    await expect(repository.create(123, 7)).rejects.toBe(dbError);
  });

  test('propaga o erro lançado pelo banco ao falhar em findAll', async () => {
    const dbError = new Error('Falha no banco durante findAll');
    db.query.mockRejectedValue(dbError);

    await expect(repository.findAll()).rejects.toBe(dbError);
  });

  test('propaga o erro lançado pelo banco ao falhar em findOne', async () => {
    const dbError = new Error('Falha no banco durante findOne');
    db.query.mockRejectedValue(dbError);

    await expect(repository.findOne(123, 7)).rejects.toBe(dbError);
  });
});
