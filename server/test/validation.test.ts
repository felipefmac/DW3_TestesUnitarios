import { HttpError } from '../src/errors';
import {
  parseId,
  positiveInteger,
  validateBody,
  validateName,
} from '../src/validation';

describe('Validações — validation.ts', () => {
  describe('positiveInteger', () => {
    test.each([1, 2147483647])(
      'retorna o próprio número para o valor positivo válido %p',
      (val) => {
        expect(positiveInteger(val, 'RA')).toBe(val);
      },
    );

    test.each([0, -1, 1.5, NaN, Infinity, 2147483648, '123', null, undefined])(
      'rejeita a entrada inválida %p lançando HttpError com statusCode 400',
      (val) => {
        let error: unknown;
        try {
          positiveInteger(val, 'RA');
        } catch (err) {
          error = err;
        }

        expect(error).toBeInstanceOf(HttpError);
        expect((error as HttpError).statusCode).toBe(400);
      },
    );
  });

  describe('parseId', () => {
    test.each([
      ['1', 1],
      ['2147483647', 2147483647],
    ])(
      'converte a string numérica %p para o número correspondente %p',
      (input, expected) => {
        expect(parseId(input, 'RA')).toBe(expected);
      },
    );

    test.each(['1abc', '1.2', '1e2', '', '-1', '0', '2147483648', 123])(
      'rejeita a entrada inválida %p lançando HttpError com statusCode 400',
      (val) => {
        let error: unknown;
        try {
          parseId(val, 'RA');
        } catch (err) {
          error = err;
        }

        expect(error).toBeInstanceOf(HttpError);
        expect((error as HttpError).statusCode).toBe(400);
      },
    );
  });

  describe('validateName', () => {
    test.each(['Ana', 'a'.repeat(100)])(
      'retorna o nome recebido válido %p',
      (name) => {
        expect(validateName(name)).toBe(name);
      },
    );

    test.each([
      '',
      'ab',
      '   ',
      ' a ',
      'a'.repeat(101),
      123,
      null,
      undefined,
    ])('rejeita o nome inválido %p lançando HttpError com statusCode 400', (val) => {
      let error: unknown;
      try {
        validateName(val);
      } catch (err) {
        error = err;
      }

      expect(error).toBeInstanceOf(HttpError);
      expect((error as HttpError).statusCode).toBe(400);
    });
  });

  describe('validateBody', () => {
    test('retorna a mesma referência de um objeto congelado sem modificá-lo', () => {
      const obj = Object.freeze({ name: 'Ana' });
      const result = validateBody(obj);
      expect(result).toBe(obj);
      expect(result).toEqual({ name: 'Ana' });
    });

    test.each([null, undefined, [], 'Ana', 12])(
      'rejeita o corpo inválido %p lançando HttpError com statusCode 400',
      (val) => {
        let error: unknown;
        try {
          validateBody(val);
        } catch (err) {
          error = err;
        }

        expect(error).toBeInstanceOf(HttpError);
        expect((error as HttpError).statusCode).toBe(400);
      },
    );

    test('aceita campos extras e retorna a mesma referência sem alterar o objeto', () => {
      const obj = { name: 'Ana', extra: true };
      const result = validateBody(obj);
      expect(result).toBe(obj);
      expect(result).toEqual({ name: 'Ana', extra: true });
    });
  });
});
