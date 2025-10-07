const JSON_DATE_MARKER = '__date_value__';

export function stringify(input: object) {
  return JSON.stringify(
    input,
    function (key, value) {
      if (this[key] instanceof Date) {
        return {
          [JSON_DATE_MARKER]: this[key].toISOString(),
        };
      }
      return value;
    },
    4,
  );
}

export function parse(input: string): any {
  return JSON.parse(input, (_, value) => {
    if (
      value !== null &&
      typeof value === 'object' &&
      typeof value[JSON_DATE_MARKER] === 'string'
    ) {
      return new Date(value[JSON_DATE_MARKER]);
    }
    return value;
  });
}
