import { isValidSessionCode, parseSessionCodeFromUrl } from './codeGenerator';

describe('codeGenerator', () => {
  it('validates 6-character unambiguous codes', () => {
    expect(isValidSessionCode('ABC234')).toBe(true);
    expect(isValidSessionCode('ABC23')).toBe(false);
    expect(isValidSessionCode('ABC23O')).toBe(false);
  });

  it('parses estimatrSession query parameter', () => {
    expect(parseSessionCodeFromUrl('?estimatrSession=abc234')).toBe('ABC234');
    expect(parseSessionCodeFromUrl('?other=1')).toBeUndefined();
  });
});
