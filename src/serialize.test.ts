import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parse, stringify } from './serialize';

test('serialize', async (t) => {
  await t.test('date roundtrip', (t) => {
    const input = {
      date: new Date(2025, 0, 6),
    };
    const str = stringify(input);
    const parsed = parse(str);

    assert.deepStrictEqual(parsed, input);
  });

  await t.test('complete roundtrip', (t) => {
    const input = {
      null: null as null,
      string: 'value',
      true: true,
      false: false,
      number: 42,
      zero: 0,
      date: new Date(2025, 9, 6),
      nested: {
        null: null as null,
        string: 'value',
        number: 42,
        date: new Date(2025, 9, 6),
      },
      array: [
        null,
        'value',
        42,
        new Date(2025, 9, 6),
        {
          string: 'value',
          number: 42,
          date: new Date(2025, 9, 6),
        },
      ],
    };

    const str = stringify(input);
    const parsed = parse(str);

    assert.deepStrictEqual(parsed, input);
  });

  await t.test('pin API', (t) => {
    const input = `
      {
        "null": null,
        "string": "value",
        "true": true,
        "false": false,
        "number": 42,
        "date": {
          "__date_value__": "2025-10-06T00:00:00.000Z"
        },
        "nested": {
          "string": "value"
        }
      }
    `;

    const parsed = parse(input);

    assert.deepStrictEqual(parsed, {
      null: null,
      string: 'value',
      true: true,
      false: false,
      number: 42,
      date: new Date(Date.UTC(2025, 9, 6)),
      nested: {
        string: 'value',
      },
    });
  });
});
