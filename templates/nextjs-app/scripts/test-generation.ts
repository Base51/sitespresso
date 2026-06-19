import { WebsiteSchema } from '../lib/schemas/website';

const TEST_CASES = [
  { name: 'Pizza Restaurant', type: 'restaurant', city: 'Austin, TX' },
  { name: 'Fresh Cuts Barbershop', type: 'barbershop', city: 'Brooklyn, NY' },
  { name: 'FitZone Gym', type: 'gym', city: 'Denver, CO' },
  { name: 'Glamour Salon', type: 'salon', city: 'San Francisco, CA' },
  { name: 'Quick Fix Auto Repair', type: 'repair', city: 'Portland, OR' },
];

async function testGeneration() {
  console.log('🧪 Testing M3 AI Generation Pipeline...\n');

  const results = [];

  for (const testCase of TEST_CASES) {
    try {
      console.log(`Testing: ${testCase.name} (${testCase.type})`);

      const response = await fetch('https://sitespresso.com/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_name: testCase.name,
          business_type: testCase.type,
          city: testCase.city,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error(
          `  ❌ HTTP ${response.status}: ${error.substring(0, 100)}`
        );
        results.push({
          test: testCase.name,
          status: 'failed',
          reason: `HTTP ${response.status}`,
        });
        continue;
      }

      const data = await response.json();

      if (!data.success) {
        console.error(`  ❌ Response not successful: ${data.error}`);
        results.push({
          test: testCase.name,
          status: 'failed',
          reason: data.error,
        });
        continue;
      }

      // Validate against schema
      const validated = WebsiteSchema.parse(data.website);

      console.log(`  ✅ Generated successfully`);
      console.log(`     - Tagline: "${validated.tagline.substring(0, 50)}..."`);
      console.log(
        `     - Services: ${validated.services.items.length} items`
      );
      console.log(
        `     - Colors: ${validated.color_scheme.primary}, ${validated.color_scheme.secondary}`
      );

      results.push({
        test: testCase.name,
        status: 'passed',
        website: validated,
      });
    } catch (error) {
      console.error(`  ❌ Error: ${(error as Error).message}`);
      results.push({
        test: testCase.name,
        status: 'failed',
        reason: (error as Error).message,
      });
    }
    console.log('');
  }

  // Summary
  const passed = results.filter((r) => r.status === 'passed').length;
  const failed = results.filter((r) => r.status === 'failed').length;

  console.log('═'.repeat(60));
  console.log(`📊 Test Results: ${passed}/${TEST_CASES.length} passed`);
  console.log('═'.repeat(60));

  if (failed === 0) {
    console.log('\n✅ T-028 COMPLETE: All 5 business types generated successfully!');
  } else {
    console.log(`\n⚠️  ${failed} test(s) failed. Review errors above.`);
  }

  return failed === 0;
}

testGeneration().then((success) => {
  process.exit(success ? 0 : 1);
});
