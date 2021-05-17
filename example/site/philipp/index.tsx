import { state, updateState, webuiWidget } from 'haah';

import { Slider, Switch } from 'antd';
import React from 'react';

export const philippsRoom = state('philippsRoom', {
  lightOn: false,
  brightness: 1.0,
  productive: false,
  deskPower: false,
});

webuiWidget('Philipps Room', () => {
  return (
    <>
      <Switch
        checked={philippsRoom.lightOn}
        onChange={(checked) =>
          updateState(philippsRoom, (state) => {
            state.lightOn = checked;
          })
        }
      />
      <Switch
        checked={philippsRoom.productive}
        onChange={(checked) =>
          updateState(philippsRoom, (state) => {
            state.productive = checked;
          })
        }
      />
      <Switch
        checked={philippsRoom.deskPower}
        onChange={(checked) =>
          updateState(philippsRoom, (state) => {
            state.deskPower = checked;
          })
        }
      />
      <Slider
        value={philippsRoom.brightness}
        min={0}
        step={0.01}
        max={1.0}
        onChange={(brightness: number) =>
          updateState(philippsRoom, (state) => {
            state.brightness = brightness;
          })
        }
      />
    </>
  );
});
