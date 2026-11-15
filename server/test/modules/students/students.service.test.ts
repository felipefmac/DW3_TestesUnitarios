import { HttpError } from '../../../src/errors';
import type {
  Student,
  StudentRepository,
} from '../../../src/modules/students/students.repository';
import { StudentsService } from '../../../src/modules/students/students.service';

describe('Serviço de alunos — StudentsService', () => {
  let repository: jest.Mocked<StudentRepository>;
  let service: StudentsService;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
    };
    service = new StudentsService(repository);
  });

  // 1. Criação válida
  test('cria um aluno com dados válidos e repassa ra e name ao repositório', async () => {
    const student: Student = { ra: 123, name: 'Ana' };
    repository.create.mockResolvedValue(student);

    const result = await service.create({ ra: 123, name: 'Ana' });

    expect(result).toEqual(student);
    expect(repository.create).toHaveBeenCalledTimes(1);
    expect(repository.create).toHaveBeenCalledWith({ ra: 123, name: 'Ana' });
  });

  // 2. RA inválido
  test('rejeita criação com RA inválido, lança erro 400 e não consulta o repositório', async () => {
    let error: unknown;
    try {
      await service.create({ ra: 0, name: 'Ana' });
    } catch (err) {
      error = err;
    }

    expect(error).toBeInstanceOf(HttpError);
    expect((error as HttpError).statusCode).toBe(400);
    expect(repository.create).not.toHaveBeenCalled();
  });

  // 3. RA duplicado
  test('lança erro 409 quando o repositório indica violação de unicidade (código 23505)', async () => {
    repository.create.mockRejectedValue({ code: '23505' });

    let error: unknown;
    try {
      await service.create({ ra: 123, name: 'Ana' });
    } catch (err) {
      error = err;
    }

    expect(error).toBeInstanceOf(HttpError);
    expect((error as HttpError).statusCode).toBe(409);
  });

  // 4. Aluno inexistente
  test('lança erro 404 quando o aluno não for encontrado pelo RA', async () => {
    repository.findOne.mockResolvedValue(undefined);

    let error: unknown;
    try {
      await service.findOne(123);
    } catch (err) {
      error = err;
    }

    expect(error).toBeInstanceOf(HttpError);
    expect((error as HttpError).statusCode).toBe(404);
  });

  // 5. Falha inesperada na criação
  test('propaga exatamente a mesma instância de Error ao falhar inesperadamente em create', async () => {
    const unexpectedError = new Error('Erro inesperado no banco');
    repository.create.mockRejectedValue(unexpectedError);

    await expect(service.create({ ra: 123, name: 'Ana' })).rejects.toBe(
      unexpectedError,
    );
  });

  // 6. Listagem
  test('lista todos os alunos chamando repository.findAll uma única vez sem argumentos', async () => {
    const list: Student[] = [
      { ra: 123, name: 'Ana' },
      { ra: 456, name: 'Bruno' },
    ];
    repository.findAll.mockResolvedValue(list);

    const result = await service.findAll();

    expect(result).toEqual(list);
    expect(repository.findAll).toHaveBeenCalledTimes(1);
    expect(repository.findAll).toHaveBeenCalledWith();
  });

  // 7. Aluno existente
  test('retorna o aluno encontrado ao buscar por RA existente e encaminha o RA ao repositório', async () => {
    const student: Student = { ra: 123, name: 'Ana' };
    repository.findOne.mockResolvedValue(student);

    const result = await service.findOne(123);

    expect(result).toEqual(student);
    expect(repository.findOne).toHaveBeenCalledTimes(1);
    expect(repository.findOne).toHaveBeenCalledWith(123);
  });
});
