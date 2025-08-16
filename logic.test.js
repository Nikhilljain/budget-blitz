import assert from 'assert/strict';
import { qualityIndex, frugalityIndex } from '../js/data.js';

async function run() {
  // Test 1: Balanced scenario
  let summary = {
    groceriesTotal: 2500,
    transportTotal: 1200,
    utilitiesCount: 1,
    diningTotal: 1400,
    impulseCount: 0
  };
  assert.equal(qualityIndex(summary), 100, 'Quality should be 100 when essentials met');
  assert.equal(frugalityIndex(summary), 100, 'Frugality should be 100 when discretionary within limits');

  // Test 2: Missing groceries lowers quality
  summary = {
    groceriesTotal: 1500,
    transportTotal: 1200,
    utilitiesCount: 1,
    diningTotal: 500,
    impulseCount: 0
  };
  assert.equal(qualityIndex(summary), 85, 'Quality should deduct 15 when groceries unmet');

  // Test 3: Overspending on dining reduces frugality
  summary = {
    groceriesTotal: 2500,
    transportTotal: 1200,
    utilitiesCount: 1,
    diningTotal: 2500,
    impulseCount: 0
  };
  // Dining over by 1000 => floor(1000/500)*10 = 20, frugality 80
  assert.equal(frugalityIndex(summary), 80, 'Frugality should deduct for dining overspend');

  // Test 4: Multiple impulse purchases reduce frugality
  summary = {
    groceriesTotal: 2500,
    transportTotal: 1200,
    utilitiesCount: 1,
    diningTotal: 1000,
    impulseCount: 3
  };
  // (3-1)*20 = 40 deduction
  assert.equal(frugalityIndex(summary), 60, 'Frugality should deduct for impulse purchases');

  console.log('logic tests passed');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});