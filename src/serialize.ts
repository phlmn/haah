const JSON_DATE_MARKER = '__magic__this__is__a__daaaate';

export function stringify(input: object) {
  return JSON.stringify(
    input,
    (_, value) =>
      recursiveReplace(
        (value) => value instanceof Date,
        (value) => {
          return {
            [JSON_DATE_MARKER]: value.toISOString(),
          };
        },
        value,
      ),
    4,
  );
}

export function parse(input: string): any {
  return JSON.parse(input, (_, value) =>
    recursiveReplace(
      (value: any) =>
        value === 'object' && typeof value[JSON_DATE_MARKER] === 'string',
      (value: any) => new Date(value),
      value,
    ),
  );
}

function recursiveReplace(
  condition: (value: any) => boolean,
  replace: (value: any) => any,
  value: any,
): any {
  if (value == null) {
    return value;
  }

  if (condition(value)) {
    return replace(value);
  } else if (value instanceof Array) {
    return value.map((val) => recursiveReplace(condition, replace, val));
  } else if (typeof value === 'object') {
    return Object.entries(value).reduce((acc, [key, value]) => {
      acc[key] = recursiveReplace(condition, replace, value);
      return acc;
    }, {} as any);
  } else {
    return value;
  }
}
