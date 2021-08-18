let buffer = 40000;
let baseTime;
let timings = {};
let counts = {};

let apiVersion = 1;

console.warn(
  'perf-deets loaded. If this is the production bundle, you should remove it'
);

function last(arr) {
  return arr.length === 0 ? null : arr[arr.length - 1];
}

async function writeData(type, name, data) {
  globalThis.postMessage({
    type: '__perf-deets:log-perf',
    dataType: type,
    name,
    data,
    apiVersion
  });
}

export function start() {
  globalThis.postMessage({ type: '__perf-deets:clear-perf' });

  timings = {};
  counts = {};
  baseTime = performance.now();
}

export async function stop() {
  Object.keys(timings).map(name => {
    let timing = timings[name];
    writeData(
      'timing',
      name,
      timing.data.map(x => ({ x: x.start + x.took, y: x.took }))
    );
  });

  Object.keys(counts).map(name => {
    let count = counts[name];
    writeData('count', name, count.map((c, i) => ({ x: c.time, y: i })));
  });
}

export function record(name) {
  if (timings[name] == null) {
    timings[name] = { start: null, data: [] };
  }
  let timer = timings[name];

  if (timer.start != null) {
    throw new Error(`timer already started ${name}`);
  }
  timer.start = performance.now();
}

export function endRecording(name) {
  let now = performance.now();
  let timer = timings[name];

  if (timer && timer.start != null) {
    let took = now - timer.start;
    let start = timer.start - baseTime;
    timer.start = null;

    if (timer.data.length < buffer) {
      timer.data.push({ start, took });
    }
  }
}

export function count(name) {
  if (counts[name] == null) {
    counts[name] = [];
  }
  counts[name].push({ time: performance.now() });
}

// TODO: To support other environments/setups, we should abstract how
// to communicate to this package and allow custom protocols. While
// the message handler below is just a convenience, to log data we
// currently use `postMessage` which makes assumptions about the
// environment
if (globalThis.addEventListener == null) {
  throw new Error(
    'perf-deets currently only supports browser and web worker environments. ' +
      'Other environments should alias the package to `perf-deets/noop`.'
  );
}

// Add a listener to handle start/stop events
globalThis.addEventListener('message', e => {
  switch (e.data.type) {
    case '__perf-deets:start-profile':
      start();
      break;
    case '__perf-deets:stop-profile':
      stop();
      break;
    // In the case of nested workers, we want to propagate these
    // events up to the main thread. Note that this assumes the perf
    // library is loaded throughout the whole worker tree. If one of
    // the child workers doesn't load, this listener won't run and
    // data will be lost
    case '__perf-deets:clear-perf':
    case '__perf-deets:log-perf':
      if (typeof window === 'undefined') {
        self.postMessage(e.data);
      }
  }
});
