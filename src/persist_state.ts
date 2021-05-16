import { mkdirSync, writeFileSync, promises as fsAsync } from 'fs';
import path from 'path';

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

const JSON_DATE_MARKER = '__magic__this__is__a_daaaate';

export function stringify(input: object) {
  return JSON.stringify(
    input,
    (key, value) => {
      if (value instanceof Date) {
        return { [JSON_DATE_MARKER]: value.toISOString() };
      } else {
        return value;
      }
    },
    4,
  );
}

export function parse(input: string): any {
  return JSON.parse(input, (key, value) => {
    if (
      typeof value === 'object' &&
      typeof value[JSON_DATE_MARKER] == 'string'
    ) {
      return new Date(value);
    } else {
      return value;
    }
  });
}
