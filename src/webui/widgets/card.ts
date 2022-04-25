import { nanoid } from 'nanoid';
import { resolve } from 'path';
import { registerWidgetRenderer, webuiActuator } from '..';

export function card({
  label,
  children,
}: {
  label: string;
  children: Array<string>;
}) {
  const id = `card-${nanoid()}`;

  webuiActuator('card', id, () => {
    return {
      label,
      children,
    };
  });

  return id;
}

registerWidgetRenderer('card', resolve(__dirname, '../../../src/webui/widgets/card.web.tsx'));
