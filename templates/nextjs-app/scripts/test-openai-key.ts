import * as fs from 'fs';
import * as path from 'path';

// Read .env.local manually
const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');

// Extract OPENAI_API_KEY
const match = envContent.match(/OPENAI_API_KEY="([^"]+)"/s);
if (!match) {
  console.error('OPENAI_API_KEY not found in .env.local');
  process.exit(1);
}

const key = match[1].replace(/\s/g, '');
console.log(`Key length: ${key.length}, prefix: ${key.substring(0, 12)}...`);

// Test OpenAI API directly
async function testOpenAI() {
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: 'Say hello in one word.' }],
      max_tokens: 10,
    }),
  });

  console.log(`Status: ${resp.status} ${resp.statusText}`);
  const body = await resp.json();
  if (resp.ok) {
    console.log(`Response: ${body.choices[0].message.content}`);
  } else {
    console.error('Error:', JSON.stringify(body, null, 2));
  }
}

testOpenAI().catch(console.error);
