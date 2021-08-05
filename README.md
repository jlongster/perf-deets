Super rough right now, but this a library for profiling in user-space. It provides two pieces: a backend API used to collect data, and a frontend for displaying that data. You don't have to use this frontend, but you can listen to events and display the data yourself.

This API **will** change, this is just a proof of concept.

This is meant to help you understand more complex situations like:

* The overhead of some internal code that is run many times
* How many times something is run
* etc

First, setup a frontend to display the data:

```js
import { listenForPerfData } from 'perf-deets/frontend';

listenForPerfData(window);
```

Now, collect the data like this:

```js
import * as perf from 'perf-deets';

perf.start();

for(let i=0; i<1000; i++) {
  perf.record('render');

  // Do something heavy

  perf.endRecording('render');
}

perf.stop()
```


This will collect many different timing for the heavy work. When the data is ready, a "Perf results are ready!" notification will pop up in the top right of the screen. Clicking "display" will visualize the results.

This fully supports workers. If you want to record data from workers, do this:

```js
let worker = new Worker(...);
listenForPerfData(worker);

worker.postMessage({ type: '__perf-deets:start-profile' });
// Tell the worker to do some work
worker.postMessage({ type: '__perf-deets:stop-profile' });
```

Inside the worker, import `perf-deets` and record data normally. The same "perf results are ready" notification will pop up.