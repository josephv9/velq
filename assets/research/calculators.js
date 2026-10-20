/* Velq label arithmetic. Inputs stay in this browser; analytics receives only a tool ID and mode. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root && root.document) api.mount(root);
})(typeof window === 'undefined' ? null : window, function () {
  'use strict';
  const DATASET_URL = '/assets/research/gummy-labels-2026-10-20.json';
  const NUTRIENTS = ['protein', 'fiber', 'sugar', 'calories'];
  const LABELS = {pieces: 'Pieces in one labeled serving', portion: 'Pieces in your portion', price: 'Package price', servings: 'Servings in the package', protein: 'Protein', fiber: 'Dietary fiber', sugar: 'Total sugars', calories: 'Calories', caffeine: 'Caffeine'};
  function number(value, options) {
    const {field, required = false, min = 0, max = 1000000} = options;
    if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
      if (!required) return null;
      const error = new Error('Enter ' + LABELS[field].toLowerCase() + '.'); error.field = field; throw error;
    }
    const candidate = typeof value === 'string' ? value.trim() : value;
    const validType = typeof candidate === 'number' || (typeof candidate === 'string' && /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(candidate));
    const result = validType ? Number(candidate) : NaN;
    if (!Number.isFinite(result) || result < min || result > max) {
      const message = min > 0 ? LABELS[field] + ' must be greater than zero and no more than ' + max.toLocaleString('en-US') + '.' : LABELS[field] + ' must be a number from 0 to ' + max.toLocaleString('en-US') + '.';
      const error = new Error(message); error.field = field; throw error;
    }
    if (result > 0 && result < 0.000001) {
      const error = new Error(LABELS[field] + ' is too small to calculate reliably. Use 0 or a value of at least 0.000001.'); error.field = field; throw error;
    }
    return result;
  }
  function normalize(raw, kind) {
    const input = {name: typeof raw.name === 'string' ? raw.name.trim().slice(0, 80) : ''};
    const fields = kind === 'serving-comparison' ? ['pieces', 'portion', ...NUTRIENTS] : ['price', 'servings', 'protein', 'fiber', 'sugar', 'caffeine'];
    fields.forEach(field => {
      input[field] = number(raw[field], {field, required: ['pieces', 'portion', 'price', 'servings'].includes(field), min: ['pieces', 'servings'].includes(field) ? 0.000001 : 0, max: ['pieces', 'portion'].includes(field) ? 100000 : 1000000});
    });
    if (kind === 'serving-comparison' && NUTRIENTS.every(field => input[field] === null)) {
      const error = new Error('Enter at least one known nutrient or calorie value. Leave unreported values blank.'); error.field = 'protein'; throw error;
    }
    return input;
  }
  function serving(raw) {
    const input = normalize(raw, 'serving-comparison');
    const result = {input, perPiece: {}, perPortion: {}, per100kcal: {}};
    NUTRIENTS.forEach(field => {
      const value = input[field];
      result.perPiece[field] = value === null ? null : value / input.pieces;
      result.perPortion[field] = value === null ? null : value * input.portion / input.pieces;
      result.per100kcal[field] = value === null || input.calories === null || input.calories === 0 ? null : value / input.calories * 100;
    });
    return result;
  }
  function value(raw) {
    const input = normalize(raw, 'nutrition-label-value');
    const perServing = input.price / input.servings;
    return {input, perServing, per10gProtein: input.protein === null || input.protein === 0 ? null : perServing * 10 / input.protein, per5gFiber: input.fiber === null || input.fiber === 0 ? null : perServing * 5 / input.fiber};
  }
  function preset(row) {
    const exact = key => {
      const qualifier = row.qualifiers && row.qualifiers[key];
      return typeof row[key] === 'number' && Number.isFinite(row[key]) && row[key] >= 0 && (!qualifier || qualifier === 'exact') ? row[key] : null;
    };
    const pieces = exact('pieces_per_serving');
    return {name: row.product_name || row.brand || row.id, pieces, portion: pieces, protein: exact('protein_g'), fiber: exact('fiber_g'), sugar: exact('sugars_g'), calories: exact('calories_kcal')};
  }
  function boundNotes(row) {
    const names = {protein_g: 'Protein', fiber_g: 'Dietary fiber', sugars_g: 'Total sugars', added_sugars_g: 'Added sugars', calories_kcal: 'Calories', caffeine_mg: 'Caffeine'};
    return Object.entries(row.qualifiers || {}).flatMap(([key, qualifier]) => {
      if (!names[key] || typeof qualifier !== 'string') return [];
      const bound = qualifier.match(/^less_than_(\d+(?:\.\d+)?)(g|mg|kcal)?$/);
      if (bound) return [names[key] + ' is reported as less than ' + bound[1] + ' ' + (bound[2] || (key.endsWith('_kcal') ? 'kcal' : key.endsWith('_mg') ? 'mg' : 'g')) + '; an exact number is not entered.'];
      if (/^\s*[<>]/.test(qualifier)) return [names[key] + ' is reported as ' + qualifier + '; an exact number is not entered.'];
      return [];
    });
  }
  function completionTracker(emit) {
    const seen = new Set();
    return function complete(calculatorId, mode, inputs) {
      // Product names and values are used only for local arithmetic; names do not affect deduplication.
      const numbersOnly = inputs.map(input => Object.fromEntries(Object.entries(input).filter(([key]) => key !== 'name')));
      const signature = JSON.stringify([calculatorId, numbersOnly]);
      if (seen.has(signature)) return false;
      seen.add(signature);
      emit({calculatorId, mode: ['manual', 'example', 'preset'].includes(mode) ? mode : 'manual'});
      return true;
    };
  }
  function mount(win) {
    const doc = win.document;
    const form = doc.getElementById('label-comparison-form');
    if (!form) return;
    const kind = form.dataset.calculator;
    if (!['serving-comparison', 'nutrition-label-value'].includes(kind)) return;
    const servingMode = kind === 'serving-comparison';
    const calculate = servingMode ? serving : value;
    const fields = servingMode ? ['name', 'pieces', 'portion', ...NUTRIENTS] : ['name', 'price', 'servings', 'protein', 'fiber', 'sugar', 'caffeine'];
    const status = doc.getElementById('calculator-status');
    const results = doc.getElementById('calculator-results');
    const exampleNotice = doc.getElementById('example-notice');
    const inputs = id => Object.fromEntries(fields.map(field => {
      const input = doc.getElementById(id + '-' + field);
      if (input.validity && input.validity.badInput) {
        const error = new Error('Enter a valid number for ' + LABELS[field].toLowerCase() + '.'); error.field = field; throw error;
      }
      return [field, input.value];
    }));
    let mode = 'manual';
    let presets = [];
    const emitComplete = completionTracker(detail => win.dispatchEvent(new win.CustomEvent('velq:calculator-complete', {detail})));
    const setStatus = (message, error) => {
      status.textContent = message;
      status.classList.toggle('vc-error', Boolean(error));
    };
    const hideResults = message => { results.hidden = true; setStatus(message || 'Select Compare labels to calculate with the entered values.', false); };
    const fill = (id, values) => fields.forEach(field => { doc.getElementById(id + '-' + field).value = values[field] === null || values[field] === undefined ? '' : String(values[field]); });
    const format = (amount, unit) => {
      if (amount === null) return 'Not entered';
      const text = amount !== 0 && amount < 0.01 ? '<0.01' : amount.toLocaleString('en-US', {maximumFractionDigits: 2});
      return text + (unit ? ' ' + unit : '');
    };
    const dollars = amount => amount === null ? 'Not entered' : amount !== 0 && amount < 0.01 ? '<$0.01' : amount.toLocaleString('en-US', {style: 'currency', currency: 'USD', maximumFractionDigits: 2});
    function render(id, result) {
      const fallback = 'Product ' + id.toUpperCase();
      doc.getElementById(id + '-result-name').textContent = result.input.name || fallback;
      if (servingMode) {
        doc.getElementById(id + '-portion-heading').textContent = format(result.input.portion, '') + ' pieces';
        doc.getElementById(id + '-serving-description').textContent = 'One labeled serving = ' + format(result.input.pieces, '') + ' pieces. Your portion = ' + format(result.input.portion / result.input.pieces, '') + ' labeled servings.';
        NUTRIENTS.forEach(field => {
          const unit = field === 'calories' ? 'kcal' : 'g';
          doc.getElementById(id + '-result-' + field + '-serving').textContent = format(result.input[field], unit);
          doc.getElementById(id + '-result-' + field + '-piece').textContent = format(result.perPiece[field], unit);
          doc.getElementById(id + '-result-' + field + '-portion').textContent = format(result.perPortion[field], unit);
          doc.getElementById(id + '-result-' + field + '-100').textContent = result.input.calories === 0 ? 'N/A: zero kcal' : result.input.calories === null ? 'Calories not entered' : format(result.per100kcal[field], unit);
        });
      } else {
        doc.getElementById(id + '-result-serving').textContent = dollars(result.perServing);
        doc.getElementById(id + '-result-protein').textContent = result.input.protein === 0 ? 'N/A: 0 g protein' : dollars(result.per10gProtein);
        doc.getElementById(id + '-result-fiber').textContent = result.input.fiber === 0 ? 'N/A: 0 g fiber' : dollars(result.per5gFiber);
        doc.getElementById(id + '-result-sugar').textContent = format(result.input.sugar, 'g');
        doc.getElementById(id + '-result-caffeine').textContent = format(result.input.caffeine, 'mg');
      }
    }
    form.addEventListener('submit', event => {
      event.preventDefault();
      form.querySelectorAll('[aria-invalid="true"]').forEach(input => input.removeAttribute('aria-invalid'));
      const pair = [];
      for (const id of ['a', 'b']) {
        try { pair.push(calculate(inputs(id))); }
        catch (error) {
          results.hidden = true;
          setStatus('Product ' + id.toUpperCase() + ': ' + error.message, true);
          const input = doc.getElementById(id + '-' + error.field);
          if (input) { input.setAttribute('aria-invalid', 'true'); input.focus(); }
          return;
        }
      }
      pair.forEach((result, index) => render(index === 0 ? 'a' : 'b', result));
      results.hidden = false;
      setStatus('Comparison ready. Results use the entered label values and are rounded to two decimals.', false);
      emitComplete(kind, mode, pair.map(result => result.input));
      doc.getElementById('results-heading').focus({preventScroll: true});
    });
    form.addEventListener('input', event => {
      if (!event.target.matches('input')) return;
      // Keep fictional examples labeled even after an edit. A portion change does
      // not change the manufacturer label and must retain its source and bounds.
      mode = exampleNotice.hidden ? 'manual' : 'example';
      const product = event.target.closest('[data-product]');
      if (product) {
        const select = doc.getElementById(product.dataset.product + '-preset');
        const note = doc.getElementById(product.dataset.product + '-source');
        const portionOnly = event.target.id.endsWith('-portion') && select && select.value;
        if (portionOnly) mode = 'preset';
        else {
          if (select) select.value = '';
          if (note) note.textContent = exampleNotice.hidden ? 'Manual values. Use a single current product label for this comparison.' : 'Edited fictional arithmetic example. These are not verified product facts.';
        }
      }
      event.target.removeAttribute('aria-invalid');
      hideResults('Inputs changed. Select Compare labels to update the results.');
    });
    doc.getElementById('calculator-reset').addEventListener('click', () => {
      form.reset();
      form.querySelectorAll('[aria-invalid]').forEach(input => input.removeAttribute('aria-invalid'));
      exampleNotice.hidden = true;
      mode = 'manual';
      ['a', 'b'].forEach(id => { const note = doc.getElementById(id + '-source'); if (note) note.textContent = 'Use your package label, or choose a dated brand source.'; });
      hideResults('Enter the required values for both products to compare their labels.');
      doc.getElementById('a-name').focus();
    });
    doc.getElementById('calculator-example').addEventListener('click', () => {
      const exampleA = servingMode ? {name: 'Fictional gummy A', pieces: 2, portion: 1, protein: '', fiber: 5, sugar: 2, calories: 30} : {name: 'Fictional product A', price: 24, servings: 12, protein: 10, fiber: 5, sugar: 2, caffeine: 0};
      const exampleB = servingMode ? {name: 'Fictional gummy B', pieces: 3, portion: 1, protein: '', fiber: 6, sugar: 0, calories: 20} : {name: 'Fictional product B', price: 30, servings: 30, protein: 8, fiber: 4, sugar: 0, caffeine: 0};
      fill('a', exampleA); fill('b', exampleB);
      ['a', 'b'].forEach(id => { const select = doc.getElementById(id + '-preset'); if (select) select.value = ''; const note = doc.getElementById(id + '-source'); if (note) note.textContent = 'Fictional arithmetic example. These are not real product facts.'; });
      mode = 'example';
      exampleNotice.hidden = false;
      hideResults('Fictional example loaded. Select Compare labels to see the calculation.');
    });
    function applyPreset(id, row) {
      fill(id, preset(row));
      const note = doc.getElementById(id + '-source');
      note.replaceChildren();
      const date = row.observed_at ? String(row.observed_at).slice(0, 10) : '2026-10-20';
      note.append(doc.createTextNode((row.serving_label || 'Brand-reported serving') + '. Observed ' + date + '. '));
      try {
        const url = new URL(row.source_url);
        if (url.protocol === 'https:') {
          const link = doc.createElement('a'); link.href = url.href; link.textContent = 'View manufacturer source'; link.rel = 'noopener noreferrer'; note.append(link);
        }
      } catch (_) {}
      note.append(doc.createTextNode('. Blank values were not established as exact numbers.'));
      boundNotes(row).forEach(message => note.append(doc.createTextNode(' ' + message)));
      if (row.pieces_per_serving === null) note.append(doc.createTextNode(' Piece count is not verified; enter it from your current package to calculate.'));
      if (row.notes) note.append(doc.createTextNode(' ' + row.notes));
      mode = 'preset';
      exampleNotice.hidden = true;
      hideResults('Dated label values loaded. Check the serving and portion for both products, then select Compare labels.');
    }
    if (servingMode && typeof win.fetch === 'function') {
      win.fetch(DATASET_URL, {credentials: 'same-origin'}).then(response => { if (!response.ok) throw new Error('Dataset unavailable'); return response.json(); }).then(dataset => {
        if (!dataset || !Array.isArray(dataset.products)) throw new Error('Dataset invalid');
        presets = dataset.products.filter(row => row && typeof row.id === 'string' && typeof row.product_name === 'string');
        ['a', 'b'].forEach(id => {
          const select = doc.getElementById(id + '-preset');
          presets.forEach(row => { const option = doc.createElement('option'); option.value = row.id; option.textContent = row.product_name; select.append(option); });
          select.disabled = false;
          select.addEventListener('change', () => {
            const row = presets.find(row => row.id === select.value);
            if (row) applyPreset(id, row);
            else { fill(id, {}); doc.getElementById(id + '-source').textContent = 'Manual values. Use a single current product label for this comparison.'; mode = 'manual'; hideResults(); }
          });
          const queryId = new URLSearchParams(win.location.search).get(id);
          const queryRow = presets.find(row => row.id === queryId);
          if (queryRow) { select.value = queryRow.id; applyPreset(id, queryRow); }
        });
      }).catch(() => {
        ['a', 'b'].forEach(id => { doc.getElementById(id + '-source').textContent = 'Dated presets are temporarily unavailable. You can still enter your package label manually.'; });
      });
    }
  }
  return {number, normalize, serving, value, preset, boundNotes, completionTracker, mount};
});
