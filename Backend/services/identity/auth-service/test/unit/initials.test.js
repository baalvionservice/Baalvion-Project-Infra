'use strict';
import { describe, it, expect } from 'vitest';
import { computeInitials, displayNameFromParts } from '../../utils/initials.js';

describe('computeInitials', () => {
    it('uses first + last initials', () => {
        expect(computeInitials({ first_name: 'Ada', last_name: 'Lovelace' })).toBe('AL');
    });
    it('falls back to a single initial when only the first name is set', () => {
        expect(computeInitials({ first_name: 'Ada' })).toBe('A');
    });
    it('derives from full_name (first + last word)', () => {
        expect(computeInitials({ full_name: 'Grace Brewster Hopper' })).toBe('GH');
    });
    it('single-word full_name yields one initial', () => {
        expect(computeInitials({ full_name: 'Madonna' })).toBe('M');
    });
    it('falls back to the email initial', () => {
        expect(computeInitials({ email: 'zoe@example.com' })).toBe('Z');
    });
    it('returns ? when nothing is available', () => {
        expect(computeInitials({})).toBe('?');
    });
    it('uppercases lower-cased names', () => {
        expect(computeInitials({ first_name: 'john', last_name: 'doe' })).toBe('JD');
    });
});

describe('displayNameFromParts', () => {
    it('combines first + last', () => {
        expect(displayNameFromParts({ firstName: 'Ada', lastName: 'Lovelace' })).toBe('Ada Lovelace');
    });
    it('uses only the part that is present', () => {
        expect(displayNameFromParts({ firstName: 'Ada' })).toBe('Ada');
    });
    it('falls back to fullName', () => {
        expect(displayNameFromParts({ fullName: 'Ada Lovelace' })).toBe('Ada Lovelace');
    });
    it('returns null when empty', () => {
        expect(displayNameFromParts({})).toBeNull();
    });
});
