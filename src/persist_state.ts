import path from 'path';
import { mkdirSync, writeFileSync, promises as fsAsync } from 'fs';
import { stringify, parse } from './serialize';

const folderPath = path.join(__dirname, '../data');
const filePath = folderPath + '/state.json';

export function saveStateSync(state: Record<string, object>) {
  try {
    mkdirSync(folderPath);
  } catch {}
  writeFileSync(filePath, stringify(state));
}

export async function saveState(state: Record<string, object>) {
  try {
    await fsAsync.mkdir(folderPath);
  } catch {}

  await fsAsync.writeFile(filePath, stringify(state));
}

export async function readState(): Promise<Record<string, object>> {
  const fileContents = await fsAsync.readFile(filePath, { encoding: 'utf8' });
  return parse(fileContents);
}
