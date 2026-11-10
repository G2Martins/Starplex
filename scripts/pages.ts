// Publishes the static build to /docs (GitHub Pages source: main branch, /docs folder).
import { copyFile, cp, mkdir, rm, writeFile } from 'node:fs/promises';

const dist = new URL('../dist/starplex/browser/', import.meta.url);
const docs = new URL('../docs/', import.meta.url);

// ponytail: async cp on purpose, Node 22's cpSync exits 127 silently on non-ASCII paths ("Programação").
await rm(docs, { recursive: true, force: true });
await cp(dist, docs, { recursive: true });
await writeFile(new URL('.nojekyll', docs), '');
// GitHub Pages serves 404.html for unknown paths: the CSR shell boots the router for client-only routes.
await copyFile(new URL('index.csr.html', docs), new URL('404.html', docs));
// Fixed client-only route gets a real file too (200 instead of 404 on reload).
await mkdir(new URL('meus-ingressos/', docs), { recursive: true });
await copyFile(new URL('index.csr.html', docs), new URL('meus-ingressos/index.html', docs));
console.log('pages: dist/starplex/browser -> docs/ (+ .nojekyll, 404.html)');
