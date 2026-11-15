import { isUniqueViolation } from '../../src/database/unique-violation';

describe('Identificação de erro de unicidade — unique-violation.ts', () => {
  test('retorna true para erro com code "23505"', () => {
    expect(isUniqueViolation({ code: '23505' })).toBe(true);
  });

  test.each([null, undefined, '23505', 23503, {}, { code: 'outro' }])(
    'retorna false para a entrada não reconhecida %p',
    (input) => {
      expect(isUniqueViolation(input)).toBe(false);
    },
  );
});
