import { produceWithPatches } from 'immer';
import glob from 'glob';

import { readState, saveState, saveStateSync } from './persist_state';
import { onExit } from './process';

export { mqttActuator, mqttSensor, initMqtt } from './io/mqtt';
export { initWebui, webuiWidget } from './webui/server';
export { default as timeSensor } from './io/time_sensor';
export { default as weatherSensor } from './io/weather_sensor';

/**
 * Hols all states of the state slices which by themselves don't store any data.
 */
export let globalState: Record<string, Record<string, any>> = {};

/**
 * Tracks used properties of state slices during the execution of actuator functions.
 *
 * This is resetted before executing an actuator function and afterwards the used properties can be collected.
 */
const used = { inner: null as Array<any> };

const actuators: Array<{
  producer: () => any;
  transport: (state: any) => Promise<void> | void;
  dependencies: Array<any> | null;
  state: any;
  name: string;
}> = [];

export function registerActuator(
  producer: () => any,
  transport: (state: any) => Promise<void> | void,
  name: string,
) {
  actuators.push({
    producer,
    transport,
    dependencies: null,
    state: {},
    name,
  });
}

export type StateSlice<T> = T & {
  __key: string;
};

const usedKeys: string[] = [];
export function state<T extends object>(
  key: string,
  initial_state: T,
): StateSlice<T> {
  if (usedKeys.includes(key)) {
    throw Error(`attempted to use key "${key}" twice. this is illegal.`);
  }
  usedKeys.push(key);

  const handler = {
    get(obj: {}, prop: string) {
      if (prop === '__key') {
        return key;
      }

      if (!used.inner) {
        throw new Error('You cannot use state outside of actuators.');
      }

      used.inner.push(`${key}.${prop}`);
      return globalState[key][prop];
    },
    set(obj: {}, prop: string, value: any) {
      throw Error('this is not a good idea. use updateState instead!');
    },

    ownKeys(target: {}) {
      return Reflect.ownKeys(globalState[key]);
    },
    getOwnPropertyDescriptor(target: {}, prop: string) {
      return Reflect.getOwnPropertyDescriptor(target, prop);
    },
    has(target: {}, prop: string) {
      return Reflect.has(globalState[key], prop);
    },
  };

  if (typeof globalState[key] !== 'object') {
    globalState[key] = initial_state;
  }

  Object.keys(initial_state).forEach((k) => {
    if (typeof globalState[key][k] !== typeof initial_state[k as keyof T]) {
      globalState[key][k] = initial_state[k as keyof T];
    }
  });

  return (new Proxy(globalState[key], handler) as unknown) as StateSlice<T>;
}

export function updateState<T>(
  state: StateSlice<T>,
  producer: (draft: T) => void,
) {
  const [state_slice, patches] = produceWithPatches(
    globalState[state.__key],
    producer,
  );

  globalState[state.__key] = state_slice;
  updateActuators(patches.map((patch) => `${state.__key}.${patch.path[0]}`));
}

export function updateActuators(changed: string[]) {
  actuators.forEach((actuator) => {
    const needsUpdate =
      actuator.dependencies == null ||
      actuator.dependencies.some((dep) => changed.includes(dep));

    if (needsUpdate) {
      console.log('update actuators', changed, actuator.name);
      used.inner = [];

      try {
        let newActuatorState = actuator.producer();
        actuator.dependencies = used.inner;

        console.log(newActuatorState);

        if (
          JSON.stringify(actuator.state) != JSON.stringify(newActuatorState)
        ) {
          actuator.transport(newActuatorState);
        }

        actuator.state = newActuatorState;
      } catch (e) {
        console.error(`Error in actuator ${actuator.name}`, e);
      }
    }
  });

  // console.debug('Scene update:');
  // actuators.forEach((actuator) => {
  //   console.debug(
  //     actuator.name + ':',
  //     JSON.stringify(actuator.state, null, 2).split('\n').join('\n    '),
  //   );
  // });
}

export async function run(siteRoot: string = `${process.cwd()}/site`) {
  // try to load state from file, fall back to default state
  try {
    globalState = await readState();
  } catch {
    //
    globalState = {};
  }

  // save state before application exits
  onExit(() => {
    saveStateSync(globalState);
  });

  // save state every 15 minutes
  setInterval(async () => {
    await saveState(globalState);
  }, 1000 * 60 * 15);

  glob(`${siteRoot}/**/*.ts*`, function (err, files) {
    console.log(files);
    files.forEach((file) => require(file));
  });
}
