import test from 'node:test';
import assert from 'node:assert/strict';
import {
  campaign,
  chooseWords,
  currentLevel,
  evaluateStars,
  generateGrid,
  levelRunTime,
  levelStarTime,
  totalStars,
  wordDefinition,
} from './gameLogic.js';

test('awards three stars for a clean, fast win', () => {
  const level = campaign[0];
  const stars = evaluateStars(true, 30, 0, level);
  assert.equal(stars, 3);
});

test('returns the first unlocked campaign level with no stars', () => {
  const saveCampaign = { '1-1': 1 };
  const level = currentLevel(saveCampaign);
  assert.equal(level.id, '1-2');
});

test('chooses the requested number of words from the selected category', () => {
  const words = chooseWords('Animals', 7, 'Easy', false, 'test-seed');
  assert.equal(words.length, 7);
  assert.equal(new Set(words).size, 7);
  assert.ok(words.every(word => word.length <= 10));
});

test('generates a grid that includes all word placements', () => {
  const words = ['CAT', 'DOG', 'BIRD'];
  const result = generateGrid(8, words, 'grid-seed');
  assert.equal(result.grid.length, 8);
  assert.equal(result.placements.length, 3);
  assert.ok(result.placements.every(p => p.cells.length === p.word.length));
});

test('tracks total stars from the campaign save state', () => {
  const stars = totalStars({ '1-1': 2, '1-2': 1, '2-1': 3 });
  assert.equal(stars, 6);
});

test('returns a definition for a known word and a fallback for unknown ones', () => {
  assert.match(wordDefinition('TIGER'), /big cat|cat/i);
  assert.match(wordDefinition('MYSTERYWORD'), /Keep playing/i);
});

test('keeps timing within the difficulty config', () => {
  const level = campaign[0];
  assert.ok(levelRunTime(level) > 0);
  assert.ok(levelStarTime(level) > 0);
});
