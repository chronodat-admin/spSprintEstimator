import { parseAdoWorkItemId } from './adoWorkItemId';

describe('parseAdoWorkItemId', () => {
  it('parses plain numeric ids', () => {
    expect(parseAdoWorkItemId('12345')).toBe(12345);
  });

  it('parses ids with hash prefix and whitespace', () => {
    expect(parseAdoWorkItemId('  #678  ')).toBe(678);
  });

  it('rejects invalid values', () => {
    expect(parseAdoWorkItemId('')).toBeUndefined();
    expect(parseAdoWorkItemId('abc')).toBeUndefined();
    expect(parseAdoWorkItemId('0')).toBeUndefined();
    expect(parseAdoWorkItemId('-5')).toBeUndefined();
  });
});
