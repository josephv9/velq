#!/usr/bin/env node
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const api = require('../assets/research/calculators.js');
const root = path.resolve(__dirname, '..');
const raw = {name: 'Example A', pieces: '2', portion: '1', protein: '', fiber: '5', sugar: '0', calories: '30'};
const result = api.serving(raw);
assert.equal(result.perPiece.fiber, 2.5);
assert.equal(result.perPortion.fiber, 2.5);
assert.equal(result.perPiece.protein, null, 'Unknown protein must remain unknown');
assert.equal(result.perPiece.sugar, 0, 'Labeled zero must be retained as zero');
assert.equal(result.per100kcal.calories, 100);
assert.equal(api.serving({...raw, portion: 0}).perPortion.fiber, 0);
assert.equal(api.serving({...raw, calories: 0}).per100kcal.fiber, null, 'Zero calories cannot be a divisor');
assert.equal(api.serving({...raw, calories: ''}).per100kcal.fiber, null, 'Unknown calories cannot be a divisor');
assert.equal(api.serving({...raw, pieces: 3, portion: 1.5, fiber: 6}).perPortion.fiber, 3, 'Fractional portions are scaled exactly');
const costA = api.value({price: 24, servings: 12, protein: 10, fiber: 5, sugar: 2, caffeine: 0});
const costB = api.value({price: 30, servings: 30, protein: 8, fiber: 4, sugar: '', caffeine: ''});
assert.deepEqual([costA.perServing, costA.per10gProtein, costA.per5gFiber], [2, 2, 2]);
assert.deepEqual([costB.perServing, costB.per10gProtein, costB.per5gFiber], [1, 1.25, 1.25]);
assert.equal(costB.input.sugar, null);
assert.equal(api.value({price: 0, servings: 30, protein: 8}).per10gProtein, 0, 'A free package is a valid zero price');
assert.equal(api.value({price: 30, servings: 30, protein: 0}).per10gProtein, null, 'Zero nutrient has no normalized cost');
for (const pieces of ['', '0', '-1', 'Infinity', 'NaN', '1e309', '0x10', {}, true, '100001', '1e-320']) {
  assert.throws(() => api.serving({...raw, pieces}), Error, 'Reject invalid serving divisor ' + String(pieces));
}
for (const fiber of ['-1', '1e309', '1e-320', '1000001', '<1']) {
  assert.throws(() => api.serving({...raw, fiber}), Error, 'Reject nonexact or invalid nutrient ' + fiber);
}
assert.throws(() => api.serving({...raw, protein: '', fiber: '', sugar: '', calories: ''}), /at least one/);
assert.throws(() => api.value({price: 10, servings: ''}), /Enter servings/);
assert.throws(() => api.value({price: -1, servings: 20}), /Package price/);
const bounded = api.preset({id: 'sample', product_name: 'Bounded label', pieces_per_serving: 2, protein_g: null, fiber_g: 5, sugars_g: 0, calories_kcal: 15, qualifiers: {protein_g: 'less_than_1g', fiber_g: 'exact', sugars_g: 'exact', calories_kcal: 'exact'}});
assert.equal(bounded.protein, null);
assert.equal(bounded.sugar, 0);
assert.equal(bounded.pieces, 2);
assert.equal(api.preset({id: 'unknown', product_name: 'Unknown count', pieces_per_serving: null}).pieces, null);
assert.equal(api.preset({id: 'not-exact', protein_g: 1, qualifiers: {protein_g: 'less_than_1g'}}).protein, null, 'A bound can never become an exact preset');
assert.deepEqual(api.boundNotes({qualifiers: {protein_g: 'less_than_1g'}}), ['Protein is reported as less than 1 g; an exact number is not entered.'], 'Bounds must remain explicit in the source note');
const emitted = [];
const complete = api.completionTracker(detail => emitted.push(detail));
assert(complete('nutrition-label-value', 'example', [costA.input, costB.input]));
assert.equal(complete('nutrition-label-value', 'example', [costA.input, costB.input]), false, 'Repeat submit must not double-count');
assert.equal(complete('nutrition-label-value', 'manual', [{...costA.input, name: 'Renamed'}, costB.input]), false, 'Renaming a product does not create a new calculation');
assert(complete('nutrition-label-value', 'manual', [{...costA.input, price: 25}, costB.input]));
assert.equal(emitted.length, 2);
assert.deepEqual(Object.keys(emitted[0]).sort(), ['calculatorId', 'mode'], 'Analytics completion detail must exclude entered values and names');
for (const route of ['serving-comparison-calculator', 'nutrition-label-value-calculator']) {
  const html = fs.readFileSync(path.join(root, 'tools', route, 'index.html'), 'utf8');
  assert(html.includes('rel="canonical" href="https://velqnutrition.com/tools/' + route + '"'));
  assert(!/<style\b|\sstyle=|\son(?:click|input|submit|change)=/i.test(html), 'CSP disallows inline styling and handlers');
  assert.equal((html.match(/<h1[ >]/g) || []).length, 1);
  assert(html.includes('id="label-comparison-form"'));
  assert(html.includes('type="submit"'));
  assert(html.includes('data-waitlist-cta="calculator"'));
  assert(html.includes('id="calculator-status" role="status" aria-live="polite"'));
  assert(html.match(/<title>(.*?)<\/title>/)[1].replace(/&amp;/g, '&').length <= 60);
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length, 'Element IDs must be unique');
  for (const label of html.matchAll(/<label for="([^"]+)"/g)) assert(ids.includes(label[1]), 'Every input label must have a target');
  for (const match of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) JSON.parse(match[1]);
}
console.log('PASS: serving and value arithmetic, unknown/zero/bounded values, validation, fractional portions, completion deduplication, privacy, accessible inputs and metadata');
