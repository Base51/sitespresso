import * as fs from 'fs';
import { execSync } from 'child_process';

const raw = fs.readFileSync('.env.local', 'utf-8');
// Match across newlines
const m = raw.match(/OPENAI_API_KEY="([\s\S]*?)"(?:\s|$)/);
if (!m) {
  console.error('Key not found');
  process.exit(1);
}

const key = m[1].replace(/\s/g, '');
console.log(`Key length: ${key.length}`);

for (const env of ['production', 'development', 'preview']) {
  try {
    execSync(`npx vercel env rm OPENAI_API_KEY ${env} --yes`, { stdio: 'pipe' });
  } catch {
    // may not exist
  }
  execSync(`echo "${key}" | npx vercel env add OPENAI_API_KEY ${env}`, {
    stdio: 'inherit',
    shell: 'powershell.exe',
  });
  console.log(`Added OPENAI_API_KEY to ${env}`);
}
