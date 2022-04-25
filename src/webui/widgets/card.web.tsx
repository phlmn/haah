import React from 'react';
import { WidgetProps, DynamicWidget, registerWidget } from 'haah/lib/webui/client';

type Props = {
  label: string;
  children: string[];
};

function Card({ data }: WidgetProps<Props>) {
  return (
    <div>
      <h2>{data.label}</h2>
      {data.children.map(id => <DynamicWidget id={id}/>)}
    </div>
  );
}

registerWidget('card', Card);
