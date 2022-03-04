import { produceWithPatches } from 'immer';
import { registerModuleCleanup } from './modules';

/**
 * Holds all states of the state slices which by themselves don't store any data.
 */
type GlobalStateType = Record<string, Record<string, any>>;
export const globalState = { inner: {} as GlobalStateType };

class usedTrackerClass {
  /**
   * Tracks used properties of state slices during the execution of actuator functions.
   *
   * This is resetted before executing an actuator function and afterwards the used properties can be collected.
   */
  used = null as string[];

  startUsed() {
    this.used = [];
  }

  finishUsed(): string[] {
    const to_return = this.used;
    this.used = null;
    return to_return;
  }

  use(key: string) {
    if (!this.used) {
      throw new Error('You cannot use state outside of actuators.');
    }
    this.used.push(key);
  }

  withUsedTracker(fn: () => any): [any, string[]] {
    this.startUsed();
    const returnValue = fn();
    return [returnValue, this.finishUsed()];
  }
}

export const usedTracker = new usedTrackerClass();

export const updateStateHooks: Array<(patch: PatchType) => void> = [];

export function registerActuator(
  producer: () => any,
  transport: (state: any) => Promise<void> | void,
  name: string,
) {
  let dependencies: string[] = null;
  let state = null as any;

  const hook = (patch: PatchType) => {
    const needsUpdate =
      dependencies == null ||
      dependencies.some((dep) => patch.changed.includes(dep));

    if (needsUpdate) {
      console.log('update actuator', name, 'reason', patch.changed);

      try {
        const [newActuatorState, newDependencies] = usedTracker.withUsedTracker(
          () => producer(),
        );

        if (JSON.stringify(state) != JSON.stringify(newActuatorState)) {
          transport(newActuatorState);
        }

        dependencies = newDependencies;
        state = newActuatorState;
      } catch (e) {
        console.error(`Error in actuator ${name}`, e);
      }
    }
  };

  updateStateHooks.push(hook);

  return () => {
    updateStateHooks.splice(updateStateHooks.findIndex((item) => item == hook), 1);
  }
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

  registerModuleCleanup(() => {
    usedKeys.splice(usedKeys.findIndex(item => item === key));
  });

  const handler = {
    get(obj: {}, prop: string) {
      if (prop === '__key') {
        return key;
      }

      usedTracker.use(`${key}.${prop}`);
      return globalState.inner[key][prop];
    },
    set(obj: {}, prop: string, value: any) {
      throw Error('this is not a good idea. use updateState instead!');
    },

    ownKeys(target: {}) {
      return Reflect.ownKeys(globalState.inner[key]);
    },
    getOwnPropertyDescriptor(target: {}, prop: string) {
      return Reflect.getOwnPropertyDescriptor(target, prop);
    },
    has(target: {}, prop: string) {
      return Reflect.has(globalState.inner[key], prop);
    },
  };

  if (typeof globalState.inner[key] !== 'object') {
    globalState.inner[key] = initial_state;
  }

  Object.keys(initial_state).forEach((k) => {
    if (
      typeof globalState.inner[key][k] !== typeof initial_state[k as keyof T]
    ) {
      globalState.inner[key][k] = initial_state[k as keyof T];
    }
  });

  // We proxy `{}` instead of `globalState.inner[key]` because the latter is
  // autofreezed by immer.js  and proxies of freezed objects may only return
  // the original value on `get`, which would be bad for our us.
  return new Proxy({}, handler) as unknown as StateSlice<T>;
}

export let lastPatchProducer: () => PatchType = () => ({
  changed: [],
  slices: {},
});
export function updateState<T>(
  state: StateSlice<T>,
  producer: (draft: T) => void,
) {
  lastPatchProducer = () => createPatchImmer(state, producer);
  const patch = lastPatchProducer();
  applyStatePatch(patch);
}

export type PatchType = {
  changed: string[];
  slices: Record<
    string,
    {
      oldSlice: Record<string, any>;
      newSlice: StateSlice<any>;
    }
  >;
};

export function createAllNewPatch<T>(newState: GlobalStateType): PatchType {
  const changed: string[] = [];
  const slices = Object.fromEntries(
    Object.entries(newState).map(([key, v]) => {
      changed.push(...Object.keys(v).map((k) => `${key}.${k}`));
      return [key, { oldSlice: null, newSlice: v }];
    }),
  );
  return { slices, changed };
}

export function createPatchImmer<T>(
  oldSlice: StateSlice<T>,
  producer: (draft: T) => void,
): PatchType {
  const [newSlice, patches] = produceWithPatches(
    globalState.inner[oldSlice.__key],
    producer,
  );
  const changed = patches.map((patch) => `${oldSlice.__key}.${patch.path[0]}`);
  return {
    changed,
    slices: {
      [oldSlice.__key]: {
        oldSlice: globalState.inner[oldSlice.__key],
        newSlice,
      },
    },
  };
}

export function applyStatePatch(
  patch: PatchType,
  acceptIncompatiblePatch = false,
) {
  Object.entries(patch.slices).forEach(([k, v]) => {
    if (
      !acceptIncompatiblePatch &&
      JSON.stringify(v.oldSlice) !== JSON.stringify(globalState.inner[k])
    ) {
      throw Error('incompatible patch');
    }

    globalState.inner[k] = v.newSlice;
  });
  updateStateHooks.forEach((fn) => fn(patch));
}
