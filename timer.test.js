import assert from 'assert/strict';
import { performance } from 'perf_hooks';
import { Game } from '../js/game.js';

async function run() {
  // Use a shorter duration for test by overriding remaining
  const targetDuration = 2000; // 2 seconds
  const tolerance = 200; // allow some leeway
  const game = new Game({
    income: 50000,
    difficulty: 'normal',
    onCard: () => {},
    onUpdate: () => {},
    onEnd: () => {}
  });
  game.remaining = targetDuration;
  const start = performance.now();
  await new Promise(resolve => {
    // Override onEnd to capture end
    game.onEnd = () => {
      const end = performance.now();
      const diff = end - start;
      try {
        assert.ok(Math.abs(diff - targetDuration) < tolerance, `Game duration should be ~${targetDuration}ms (got ${diff}ms)`);
        console.log('timer tests passed');
      } catch (err) {
        console.error(err.message);
        process.exit(1);
      }
      resolve();
    };
    game.start();
  });
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});