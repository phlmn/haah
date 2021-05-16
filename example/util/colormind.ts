import fetch from 'isomorphic-fetch';

type ColormindResponse = { result: number[][] };

export async function fetchRandomColorPalette() {
  const res = await fetch('http://colormind.io/api/', {
    body: `{"model":"default"}`,
    method: 'POST',
  });
  return ((await res.json()) as ColormindResponse).result;
}
