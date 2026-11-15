import { isForeignKeyViolation } from '../../src/database/foreign-key-violation';

describe('Identificação de erro de chave estrangeira — foreign-key-violation.ts', () => {
  test('retorna true para erro com code "23503"', () => {
    expect(isForeignKeyViolation({ code: '23503' })).toBe(true);
  });

  test.each([null, undefined, '23505', 23503, {}, { code: 'outro' }])(
    'retorna false para a entrada não reconhecida %p',
    (input) => {
      expect(isForeignKeyViolation(input)).toBe(false);
    },
  );
});
