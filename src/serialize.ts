const JSON_DATE_MARKER = '__magic__this__is__a_daaaate';

export function stringify(input: object) {
  return JSON.stringify(
    input,
    (key, value) => {
      if (value instanceof Date) {
        console.log(value);
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
