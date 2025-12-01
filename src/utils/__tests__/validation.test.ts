import { sanitizeString, validateContractAddress } from '../validation';

describe('Validation Utilities', () => {
  describe('sanitizeString', () => {
    test('removes leading and trailing whitespace', () => {
      const input = '  hello world  ';
      const result = sanitizeString(input);
      expect(result).toBe('hello world');
    });

    test('removes control characters', () => {
      // \x00 is a null byte (control character)
      const input = 'hello\x00world'; 
      const result = sanitizeString(input);
      expect(result).toBe('helloworld');
    });

    test('returns empty string for non-string input', () => {
      // @ts-expect-error - intentionally passing wrong type
      const result = sanitizeString(null);
      expect(result).toBe('');
    });
  });

  describe('validateContractAddress', () => {
    test('accepts a valid Ethereum address', () => {
      // This is the address of our relayer wallet
      const validAddress = '0x923b0f56076311adda302decd307f2cf3f150317';
      // Should not throw an error
      expect(() => validateContractAddress(validAddress)).not.toThrow();
    });

    test('throws error for invalid address format', () => {
      const invalidAddress = 'invalid-address';
      expect(() => validateContractAddress(invalidAddress)).toThrow(/Invalid contract address format/);
    });
  });
});