import type { Database } from '../../../src/database/connection';
import type { Student } from '../../../src/modules/students/students.repository';
import { PgStudentRepository } from '../../../src/modules/students/students.repository';

function normalizeSql(sql: string): string {
  return sql.replace(/\s+/g, ' ').trim();
}

describe('Repositório de alunos — PgStudentRepository', () => {
  let db: { query: jest.Mock };
  let repository: PgStudentRepository;

  beforeEach(() => {
    db = { query: jest.fn() };
    repository = new PgStudentRepository(db as unknown as Database);
  });

  // 1. Criação
  test('insere um novo aluno com ra e name e retorna o registro criado', async () => {
    const fakeStudent: Student = { ra: 123, name: 'Ana' };
    db.query.mockResolvedValue({ rows: [fakeStudent] });

    const result = await repository.create({ ra: 123, name: 'Ana' });

    expect(result).toEqual(fakeStudent);
    expect(db.query).toHaveBeenCalledTimes(1);

    const [sql, params] = db.query.mock.calls[0];
    expect(normalizeSql(sql)).toBe(
      'INSERT INTO students (ra, name) VALUES ($1, $2) RETURNING ra, name',
    );
    expect(params).toEqual([123, 'Ana']);
  });

  // 2. Listagem com registros
  test('retorna a lista de alunos ordenada por name sem enviar array de parâmetros', async () => {
    const fakeStudents: Student[] = [
      { ra: 123, name: 'Ana' },
      { ra: 456, name: 'Bruno' },
    ];
    db.query.mockResolvedValue({ rows: fakeStudents });

    const result = await repository.findAll();

    expect(result).toEqual(fakeStudents);
    expect(db.query).toHaveBeenCalledTimes(1);

    const [sql, params] = db.query.mock.calls[0];
    expect(normalizeSql(sql)).toBe(
      'SELECT ra, name FROM students ORDER BY name',
    );
    expect(params).toBeUndefined();
  });

  // 3. Listagem vazia
  test('retorna array vazio quando não houver alunos cadastrados', async () => {
    db.query.mockResolvedValue({ rows: [] });

    const result = await repository.findAll();

    expect(result).toEqual([]);
    expect(db.query).toHaveBeenCalledTimes(1);
  });

  // 4. Busca existente
  test('retorna a primeira linha simulada ao buscar por RA existente e envia o parâmetro correto', async () => {
    const fakeStudent: Student = { ra: 123, name: 'Ana' };
    db.query.mockResolvedValue({ rows: [fakeStudent] });

    const result = await repository.findOne(123);

    expect(result).toEqual(fakeStudent);
    expect(db.query).toHaveBeenCalledTimes(1);

    const [sql, params] = db.query.mock.calls[0];
    expect(normalizeSql(sql)).toBe(
      'SELECT ra, name FROM students WHERE ra = $1',
    );
    expect(params).toEqual([123]);
  });

  // 5. Busca inexistente
  test('retorna undefined ao buscar por RA inexistente quando rows é vazio', async () => {
    db.query.mockResolvedValue({ rows: [] });

    const result = await repository.findOne(123);

    expect(result).toBeUndefined();
    expect(db.query).toHaveBeenCalledTimes(1);
  });

  // 6. Falhas do banco (create, findAll e findOne testados separadamente)
  test('propaga o erro lançado pelo banco ao falhar em create', async () => {
    const dbError = new Error('Falha no banco durante create');
    db.query.mockRejectedValue(dbError);

    await expect(repository.create({ ra: 123, name: 'Ana' })).rejects.toBe(
      dbError,
    );
  });

  test('propaga o erro lançado pelo banco ao falhar em findAll', async () => {
    const dbError = new Error('Falha no banco durante findAll');
    db.query.mockRejectedValue(dbError);

    await expect(repository.findAll()).rejects.toBe(dbError);
  });

  test('propaga o erro lançado pelo banco ao falhar em findOne', async () => {
    const dbError = new Error('Falha no banco durante findOne');
    db.query.mockRejectedValue(dbError);

    await expect(repository.findOne(123)).rejects.toBe(dbError);
  });
});
