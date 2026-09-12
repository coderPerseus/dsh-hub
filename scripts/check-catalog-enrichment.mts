import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { catalogSnapshotSchema } from '../packages/catalog/src/schema';
import { enrichmentSourceHash } from '../packages/catalog/src/enrichment';

const root = path.resolve(import.meta.dirname, '..');
const snapshot = catalogSnapshotSchema.parse(JSON.parse(await readFile(path.join(root, '.catalog/catalog.snapshot.json'), 'utf8')));
const data = JSON.parse(await readFile(path.join(root, 'data/catalog-enrichment.json'), 'utf8'));
const failures: Array<{ id: string; reason: string }> = [];
let maxAnalysisLength = 0;
for (const plugin of snapshot.plugins) {
  const entry = data.entries?.[plugin.id];
  let reason = '';
  if (!entry) reason = 'missing';
  else if (entry.sourceHash !== enrichmentSourceHash(plugin)) reason = 'stale source';
  else if (typeof entry.descriptionZh !== 'string' || !/\p{Script=Han}/u.test(entry.descriptionZh)) reason = 'missing Chinese description';
  else if ([...entry.descriptionZh].length > 100) reason = 'description exceeds 100 characters';
  else if (typeof entry.analysisZh !== 'string' || !/\p{Script=Han}/u.test(entry.analysisZh)) reason = 'missing Chinese analysis';
  else if ([...entry.analysisZh].length > 100) reason = 'analysis exceeds 100 characters';
  if (reason) failures.push({ id: plugin.id, reason });
  else maxAnalysisLength = Math.max(maxAnalysisLength, [...entry.analysisZh].length);
}
console.log(JSON.stringify({ plugins: snapshot.plugins.length, valid: snapshot.plugins.length - failures.length, maxAnalysisLength, failures: failures.slice(0, 20) }, null, 2));
if (failures.length) process.exitCode = 1;
