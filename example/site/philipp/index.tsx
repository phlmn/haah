import { state, updateState, webuiWidget } from 'haah';

import { Slider, Switch } from 'antd';
import React from 'react';
import { LabeledSwitch } from '../../util/frontend';

export const philippsRoom = state('philippsRoom', {
  lightOn: false,
  brightness: 1.0,
  productive: false,
  deskPower: false,
  deskTempFactor: 1.0,
});

webuiWidget('Philipps Room', () => {
  return (
    <>
      <LabeledSwitch
        label="Light On"
        checked={philippsRoom.lightOn}
        onChange={(checked) =>
          updateState(philippsRoom, (state) => {
            state.lightOn = checked;
          })
        }
      />
      <LabeledSwitch
        label="Productive"
        checked={philippsRoom.productive}
        onChange={(checked) =>
          updateState(philippsRoom, (state) => {
            state.productive = checked;
          })
        }
      />
      <LabeledSwitch
        label="Desk Power"
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
      <Slider
        value={philippsRoom.deskTempFactor}
        min={0.5}
        step={0.05}
        max={1.5}
        onChange={(value: number) =>
          updateState(philippsRoom, (state) => {
            state.deskTempFactor = value;
          })
        }
      />
    </>
  );
});
