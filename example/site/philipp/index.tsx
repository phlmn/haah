import { state, updateState, webuiWidget } from 'haah';

import { Slider, Switch } from 'antd';
import React from 'react';

export const philippsRoom = state('philippsRoom', {
  lightOn: false,
  brightness: 1.0,
  productive: false,
  deskPower: false,
});

webuiWidget('Philipps Room', philippsRoom, (state) => {
  return (
    <>
      <Switch
        checked={state.lightOn}
        onChange={(checked) =>
          updateState(state, (state) => {
            state.lightOn = checked;
          })
        }
      />
      <Switch
        checked={state.productive}
        onChange={(checked) =>
          updateState(state, (state) => {
            state.productive = checked;
          })
        }
      />
      <Switch
        checked={state.deskPower}
        onChange={(checked) =>
          updateState(state, (state) => {
            state.deskPower = checked;
          })
        }
      />
      <Slider
        value={state.brightness}
        min={0}
        step={0.01}
        max={1.0}
        onChange={(brightness: number) =>
          updateState(state, (state) => {
            state.brightness = brightness;
          })
        }
      />
    </>
  );
});
