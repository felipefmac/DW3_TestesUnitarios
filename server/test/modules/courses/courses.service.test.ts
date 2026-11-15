import { HttpError } from '../../../src/errors';
import type {
  Course,
  CourseRepository,
} from '../../../src/modules/courses/courses.repository';
import { CoursesService } from '../../../src/modules/courses/courses.service';

describe('Serviço de disciplinas — CoursesService', () => {
  let repository: jest.Mocked<CourseRepository>;
  let service: CoursesService;

  beforeEach(() => {
    // Mock para registrar e verificar interações
    repository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
    };
    service = new CoursesService(repository);
  });

  // 1. Criação válida (uso de mock para verificar interações)
  test('cria uma disciplina com dados válidos e repassa ao repositório', async () => {
    const created: Course = { id: 1, name: 'Qualidade' };
    repository.create.mockResolvedValue(created);

    const result = await service.create({ name: 'Qualidade' });

    expect(result).toEqual(created);
    expect(repository.create).toHaveBeenCalledTimes(1);
    expect(repository.create).toHaveBeenCalledWith({ name: 'Qualidade' });
  });

  // 2. Criação inválida
  test.each([null, {}, { name: 'A' }])(
    'rejeita criação inválida com %p, lança erro 400 e não consulta o repositório',
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

  // 3. Nome duplicado
  test('lança erro 409 quando o repositório indica violação de unicidade (código 23505)', async () => {
    repository.create.mockRejectedValue({ code: '23505' });

    let error: unknown;
    try {
      await service.create({ name: 'Qualidade' });
    } catch (err) {
      error = err;
    }

    expect(error).toBeInstanceOf(HttpError);
    expect((error as HttpError).statusCode).toBe(409);
  });

  // 4. Listagem com stub (uso de stub para devolver resposta predefinida)
  test('lista disciplinas utilizando stub com resposta predefinida', async () => {
    const stubCourses: Course[] = [
      { id: 1, name: 'Qualidade' },
      { id: 2, name: 'Desenvolvimento Web III' },
    ];
    repository.findAll.mockResolvedValue(stubCourses);

    const result = await service.findAll();

    expect(result).toEqual(stubCourses);
    expect(repository.findAll).toHaveBeenCalledTimes(1);
  });

  // 5. Busca existente
  test('retorna o registro encontrado ao buscar por ID existente e encaminha o identificador', async () => {
    const course: Course = { id: 123, name: 'Qualidade' };
    repository.findOne.mockResolvedValue(course);

    const result = await service.findOne(123);

    expect(result).toEqual(course);
    expect(repository.findOne).toHaveBeenCalledTimes(1);
    expect(repository.findOne).toHaveBeenCalledWith(123);
  });

  // 6. Busca inexistente
  test('lança erro 404 quando a disciplina não é encontrada', async () => {
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

  // 7. Identificador inválido
  test('rejeita identificador inválido no findOne com erro 400 sem consultar o repositório', async () => {
    let error: unknown;
    try {
      await service.findOne(0);
    } catch (err) {
      error = err;
    }

    expect(error).toBeInstanceOf(HttpError);
    expect((error as HttpError).statusCode).toBe(400);
    expect(repository.findOne).not.toHaveBeenCalled();
  });

  // 8. Falhas inesperadas (create, findAll e findOne testados separadamente)
  test('propaga exatamente a mesma instância de Error ao falhar inesperadamente em create', async () => {
    const unexpectedError = new Error('Falha inesperada no banco');
    repository.create.mockRejectedValue(unexpectedError);

    await expect(service.create({ name: 'Qualidade' })).rejects.toBe(unexpectedError);
  });

  test('propaga exatamente a mesma instância de Error ao falhar inesperadamente em findAll', async () => {
    const unexpectedError = new Error('Falha inesperada no banco');
    repository.findAll.mockRejectedValue(unexpectedError);

    await expect(service.findAll()).rejects.toBe(unexpectedError);
  });

  test('propaga exatamente a mesma instância de Error ao falhar inesperadamente em findOne', async () => {
    const unexpectedError = new Error('Falha inesperada no banco');
    repository.findOne.mockRejectedValue(unexpectedError);

    await expect(service.findOne(123)).rejects.toBe(unexpectedError);
  });

  // 9. Uso de spy (observar um método de um objeto existente com jest.spyOn)
  test('observa findOne com spy utilizando jest.spyOn em um stub existente', async () => {
    const stubRepo: CourseRepository = {
      async create(data) {
        return { id: 1, name: data.name };
      },
      async findAll() {
        return [];
      },
      async findOne(id) {
        return { id, name: 'Qualidade' };
      },
    };

    const spy = jest.spyOn(stubRepo, 'findOne');
    const spyService = new CoursesService(stubRepo);

    const result = await spyService.findOne(1);

    expect(result).toEqual({ id: 1, name: 'Qualidade' });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(1);
  });

  // 10. Campos extras
  test('ignora campos extras no payload e envia apenas { name } ao repositório', async () => {
    const created: Course = { id: 1, name: 'Qualidade' };
    repository.create.mockResolvedValue(created);

    await service.create({ name: 'Qualidade', extra: true });

    expect(repository.create).toHaveBeenCalledWith({ name: 'Qualidade' });
  });
});
