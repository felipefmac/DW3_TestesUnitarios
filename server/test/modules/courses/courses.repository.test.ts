import type { Database } from '../../../src/database/connection';
import type { Course } from '../../../src/modules/courses/courses.repository';
import { PgCourseRepository } from '../../../src/modules/courses/courses.repository';

function normalizeSql(sql: string): string {
  return sql.replace(/\s+/g, ' ').trim();
}

describe('Repositório de disciplinas — PgCourseRepository', () => {
  let db: { query: jest.Mock };
  let repository: PgCourseRepository;

  beforeEach(() => {
    db = { query: jest.fn() };
    repository = new PgCourseRepository(db as unknown as Database);
  });

  // 1. Criação
  test('cria uma disciplina executando o INSERT com RETURNING e retorna o registro criado', async () => {
    const fakeCourse: Course = { id: 7, name: 'Qualidade' };
    db.query.mockResolvedValue({ rows: [fakeCourse] });

    const result = await repository.create({ name: 'Qualidade' });

    expect(result).toEqual(fakeCourse);
    expect(db.query).toHaveBeenCalledTimes(1);

    const [sql, params] = db.query.mock.calls[0];
    expect(normalizeSql(sql)).toBe(
      'INSERT INTO courses (name) VALUES ($1) RETURNING id, name',
    );
    expect(params).toEqual(['Qualidade']);
  });

  // 2. Listagem com registros
  test('retorna a lista de disciplinas ordenada por id sem enviar array de parâmetros', async () => {
    const fakeCourses: Course[] = [
      { id: 1, name: 'Banco de Dados' },
      { id: 2, name: 'Qualidade' },
    ];
    db.query.mockResolvedValue({ rows: fakeCourses });

    const result = await repository.findAll();

    expect(result).toEqual(fakeCourses);
    expect(db.query).toHaveBeenCalledTimes(1);

    const [sql, params] = db.query.mock.calls[0];
    expect(normalizeSql(sql)).toBe(
      'SELECT id, name FROM courses ORDER BY id',
    );
    expect(params).toBeUndefined();
  });

  // 3. Listagem vazia
  test('retorna array vazio quando não houver disciplinas cadastradas', async () => {
    db.query.mockResolvedValue({ rows: [] });

    const result = await repository.findAll();

    expect(result).toEqual([]);
    expect(db.query).toHaveBeenCalledTimes(1);
  });

  // 4. Busca existente
  test('retorna a primeira linha simulada ao buscar por id existente e envia os parâmetros corretos', async () => {
    const fakeCourse: Course = { id: 7, name: 'Qualidade' };
    db.query.mockResolvedValue({ rows: [fakeCourse] });

    const result = await repository.findOne(7);

    expect(result).toEqual(fakeCourse);
    expect(db.query).toHaveBeenCalledTimes(1);

    const [sql, params] = db.query.mock.calls[0];
    expect(normalizeSql(sql)).toBe(
      'SELECT id, name FROM courses WHERE id = $1',
    );
    expect(params).toEqual([7]);
  });

  // 5. Busca inexistente
  test('retorna undefined ao buscar por id inexistente quando rows é vazio', async () => {
    db.query.mockResolvedValue({ rows: [] });

    const result = await repository.findOne(7);

    expect(result).toBeUndefined();
    expect(db.query).toHaveBeenCalledTimes(1);
  });

  // 6. Falhas do banco (create, findAll e findOne testados separadamente)
  test('propaga o erro lançado pelo banco ao falhar em create', async () => {
    const dbError = new Error('Falha no banco durante create');
    db.query.mockRejectedValue(dbError);

    await expect(repository.create({ name: 'Qualidade' })).rejects.toBe(dbError);
  });

  test('propaga o erro lançado pelo banco ao falhar em findAll', async () => {
    const dbError = new Error('Falha no banco durante findAll');
    db.query.mockRejectedValue(dbError);

    await expect(repository.findAll()).rejects.toBe(dbError);
  });

  test('propaga o erro lançado pelo banco ao falhar em findOne', async () => {
    const dbError = new Error('Falha no banco durante findOne');
    db.query.mockRejectedValue(dbError);

    await expect(repository.findOne(7)).rejects.toBe(dbError);
  });
});
