import React from 'react';
import { WidgetProps, emitEvent, registerWidget } from 'haah/lib/webui/client';

type Props = {
  label: string;
  value: boolean;
  onChange: (checked: boolean) => void;
};

function Toggle({ id, data }: WidgetProps<Props>) {
  return (
    <div>
      <h2 onClick={() => emitEvent(id, { value: !data.value })}>
        {data.label}: {data.value ? 'on' : 'off'}
      </h2>
    </div>
  );
}

registerWidget('toggle', Toggle);
