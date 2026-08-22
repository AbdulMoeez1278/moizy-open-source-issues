const preventDuplicateSubmit = require('../utils/preventDuplicateSubmit');

async function submitOrder(orderData) {
  console.log(`Processing order for ${orderData.item}...`);
  await new Promise((resolve) => setTimeout(resolve, 300));
  return { status: 200, item: orderData.item };
}

const safeSubmitOrder = preventDuplicateSubmit(submitOrder);

async function main() {
  const click1 = safeSubmitOrder({ item: 'Laptop' });
  const click2 = safeSubmitOrder({ item: 'Laptop' });
  const click3 = safeSubmitOrder({ item: 'Laptop' });

  console.log('Same promise returned:', click1 === click2 && click2 === click3);

  const [res1, res2, res3] = await Promise.all([click1, click2, click3]);
  console.log('Results:', res1, res2, res3);

  const res4 = await safeSubmitOrder({ item: 'Headphones' });
  console.log('Subsequent submission result:', res4);
}

main();
