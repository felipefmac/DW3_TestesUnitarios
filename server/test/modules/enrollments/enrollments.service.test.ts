import { HttpError } from '../../../src/errors';
import type {
  Enrollment,
  EnrollmentRepository,
} from '../../../src/modules/enrollments/enrollments.repository';
import { EnrollmentsService } from '../../../src/modules/enrollments/enrollments.service';

describe('Serviço de matrículas — EnrollmentsService', () => {
  let repository: jest.Mocked<EnrollmentRepository>;
  let service: EnrollmentsService;
  const fixedDate = new Date('2026-11-15T12:00:00.000Z');

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
    };
    service = new EnrollmentsService(repository);
  });

  // 1. Criação válida
  test('cria uma matrícula com dados válidos e repassa studentRa e courseId separadamente', async () => {
    const enrollment: Enrollment = {
      studentRa: 123,
      courseId: 1,
      enrolledAt: fixedDate,
    };
    repository.create.mockResolvedValue(enrollment);

    const result = await service.create({ studentRa: 123, courseId: 1 });

    expect(result).toEqual(enrollment);
    expect(repository.create).toHaveBeenCalledTimes(1);
    expect(repository.create).toHaveBeenCalledWith(123, 1);
  });

  // 2. Chave inválida
  test.each([
    { studentRa: 0, courseId: 1 },
    { studentRa: 123, courseId: 0 },
  ])(
    'rejeita criação com chave inválida %p, lança erro 400 e não consulta o repositório',
    async (input) => {
      let error: unknown;
      try {
        await service.create(input);
      } catch (err) {
        error = err;
      }

      expect(error).toBeInstanceOf(HttpError);
      expect((error as HttpError).statusCode).toBe(400);
      expect(repository.create).not.toHaveBeenCalled();
    },
  );

  // 3. Referência inexistente
  test('lança erro 404 quando o repositório indica violação de chave estrangeira (código 23503)', async () => {
    repository.create.mockRejectedValue({ code: '23503' });

    let error: unknown;
    try {
      await service.create({ studentRa: 123, courseId: 1 });
    } catch (err) {
      error = err;
    }

    expect(error).toBeInstanceOf(HttpError);
    expect((error as HttpError).statusCode).toBe(404);
  });

  // 4. Matrícula duplicada
  test('lança erro 409 quando o repositório indica violação de unicidade (código 23505)', async () => {
    repository.create.mockRejectedValue({ code: '23505' });

    let error: unknown;
    try {
      await service.create({ studentRa: 123, courseId: 1 });
    } catch (err) {
      error = err;
    }

    expect(error).toBeInstanceOf(HttpError);
    expect((error as HttpError).statusCode).toBe(409);
  });

  // 5. Busca inexistente
  test('lança erro 404 ao buscar matrícula inexistente e encaminha os identificadores na ordem correta', async () => {
    repository.findOne.mockResolvedValue(undefined);

    let error: unknown;
    try {
      await service.findOne(123, 1);
    } catch (err) {
      error = err;
    }

    expect(error).toBeInstanceOf(HttpError);
    expect((error as HttpError).statusCode).toBe(404);
    expect(repository.findOne).toHaveBeenCalledTimes(1);
    expect(repository.findOne).toHaveBeenCalledWith(123, 1);
  });

  // 6. Falha inesperada na criação
  test('propaga exatamente a mesma instância de Error ao falhar inesperadamente em create', async () => {
    const unexpectedError = new Error('Erro inesperado no banco');
    repository.create.mockRejectedValue(unexpectedError);

    await expect(
      service.create({ studentRa: 123, courseId: 1 }),
    ).rejects.toBe(unexpectedError);
  });

  // 7. Listagem
  test('retorna a lista de matrículas chamando repository.findAll uma única vez sem argumentos', async () => {
    const list: Enrollment[] = [
      { studentRa: 123, courseId: 1, enrolledAt: fixedDate },
    ];
    repository.findAll.mockResolvedValue(list);

    const result = await service.findAll();

    expect(result).toEqual(list);
    expect(repository.findAll).toHaveBeenCalledTimes(1);
    expect(repository.findAll).toHaveBeenCalledWith();
  });

  // 8. Busca existente
  test('retorna a matrícula encontrada ao buscar por studentRa e courseId existentes', async () => {
    const enrollment: Enrollment = {
      studentRa: 123,
      courseId: 1,
      enrolledAt: fixedDate,
    };
    repository.findOne.mockResolvedValue(enrollment);

    const result = await service.findOne(123, 1);

    expect(result).toEqual(enrollment);
    expect(repository.findOne).toHaveBeenCalledTimes(1);
    expect(repository.findOne).toHaveBeenCalledWith(123, 1);
  });
});
