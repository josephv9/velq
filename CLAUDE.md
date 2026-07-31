# Velq site — editing rules

## index.html is a self-unpacking bundle — edit with extreme care

`index.html` is not normal HTML. The visible page lives inside
`<script type="__bundler/...">` blocks as **JSON**, which a loader script
parses and mounts at load time. If any block fails `JSON.parse`, the entire
site renders blank with an "Error unpacking" toast.

The page content itself is the `__bundler/template` block: one giant
single-line JSON **string** containing the whole HTML document.

**Rules when editing anything inside a `__bundler` block:**

- Never paste raw multi-line text into the JSON string. Every newline must be
  `\n`, every quote `\"`, every backslash `\\`.
- In the `__bundler/template` block, every `<` must be written `\u003c`
  (never a literal `<`). A literal `</script>` or `<!--` inside the JSON
  terminates the script element early and breaks the page even when the JSON
  is valid.
- The block must stay on a single line.

**After ANY edit to index.html, run:**

```
node scripts/check-bundles.js
```

It must print all `OK` before committing. A pre-commit hook
(`githooks/pre-commit`, enabled via `git config core.hooksPath githooks`)
runs the same check.

For substantial content changes, prefer decoding the template string to a
working file, editing that, then re-encoding with
`JSON.stringify(text).replace(/</g, '\\u003c')` — don't hand-edit escapes.

The pages under `guides/` and `products/` are plain HTML — normal editing
rules apply there.
