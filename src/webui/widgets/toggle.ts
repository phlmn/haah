import { nanoid } from 'nanoid';
import { resolve } from 'path';
import { registerWidgetRenderer, webuiActuator, webuiSensor } from '..';

export function toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: () => boolean;
  onChange: (checked: boolean) => void;
}): string {
  const id = `toggle-${nanoid()}`;

  webuiSensor(id, (payload) => {
    onChange(payload.value);
  });

  webuiActuator('toggle', id, () => {
    return {
      label,
      value: value(),
    };
  });

  return id;
}

registerWidgetRenderer('toggle', resolve(__dirname, '../../../src/webui/widgets/toggle.web.tsx'));
