> Me: Mom, can we have home automation?  
> Mom: No, we have home automation at home  
> Home automation at home:  


# Home automation at home
A library / framework to describe home automation rules as code.

Coming from Home Assistant, my roommate and me one day decided that it would be cool to not describe our home automation setup with YAML-files that are created using UI dialogs but rather directly with code. 

## Structure / Getting Started
This repository consists of two pieces: the library part of haah (located in `src/`) and the site specific configuration of our flat that also serves as an example of how this library can be used (located in `example/`).

If you want to give `haah` a try, simply copy the example folder somewhere and start hacking.
Multiple styles of configuration and multiple things that can be done are used in the example configuration to give you inspiration.
The example configuration mainly uses `zigbee2mqtt` for interacting with the real world and expects that to be started and configured.

## Concepts
All home automation is about manipulating some kind of state: If you press a light switch, you change the state of the light. If you turn the knob on your heater, you change its state.

Therfore the most central concept of `haah` is a State Slice. State slices can hold state that can be manipulated by sensors (eg. a light switch) and used by actuators (eg. a lamp). So if we want to create a light that can be controlled by a switch, we can do that in the following way with `haah`: 
```typescript

const lampState = state('lampState', {
//                       ^ this is the name of the state slice
//                         it must be unique and identifies it
  lightOn: false,
//         ^ this is the default state.
});


mqttSensor('zigbee2mqtt/some_switch', (payload) =>
//          ^ this is the mqtt topic of the switch
  updateState(lampState, (draft) => {
// ^ we need to call updateState, to notify haah, that we change something.
//   this allows haah to automatically execute all Actuators that need to update.
      draft.lightOn: !draft.lightOn;
  })
)

// the mqttActuator is always re-executed, when some state that it uses changed
mqttActuator('zigbee2mqtt/some_lamp/set', () => {
//            ^ this is the mqtt topic of the lamp

  if (!lampState.lightOn) {
    // the return value is published into the mqtt topic of this actuator
    return { state: 'off', brightness: 0, transition: 0 };
  } else {
    return { state: 'on', brightness: 255, transition: 0 };
  }
});
```
