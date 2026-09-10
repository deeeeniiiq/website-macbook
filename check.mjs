import { readFile, access, readdir } from 'node:fs/promises';
import vm from 'node:vm';

const root = new URL('./', import.meta.url);
const files = await readdir(root);
for (const name of files.filter(name => name.endsWith('.js'))) {
  new vm.Script(await readFile(new URL(name, root), 'utf8'), { filename: name });
}
const html = await readFile(new URL('index.html', root), 'utf8');
const catalog = await readFile(new URL('catalog.js', root), 'utf8');
const refs = new Set([
  ...Array.from(html.matchAll(/(?:src|href)="([^"#]+)"/g), match => match[1]),
  ...Array.from(catalog.matchAll(/"(assets\/[^"\n]+)"/g), match => match[1])
]);
for (const ref of refs) {
  if (/^(?:https?:|data:|mailto:|tel:)/.test(ref)) continue;
  await access(new URL(ref.split('#')[0], root));
}
console.log('OK: sintaxe JavaScript e referências locais verificadas.');
