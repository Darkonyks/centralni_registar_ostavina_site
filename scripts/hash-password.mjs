/**
 * Pravi scrypt heš administratorske lozinke za ADMIN_PASSWORD_HASH.
 *
 *   npm run admin:hash-password
 *
 * Lozinka se unosi u terminal (ne prikazuje se) i nigde se ne čuva; ispisuje se samo heš.
 * Format i parametri moraju odgovarati server/auth.ts.
 */
import { randomBytes, scryptSync } from 'node:crypto';
import { stdin, stdout } from 'node:process';
import { createInterface } from 'node:readline';

const MIN_LENGTH = 12;
const SCRYPT = { N: 32768, r: 8, p: 1, keyLength: 64, maxmem: 128 * 1024 * 1024 };

function ask(question) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: stdin, output: stdout, terminal: true });
    // Unos se ne ispisuje na ekran.
    rl._writeToOutput = (text) => {
      if (text.includes(question)) stdout.write(text);
    };
    rl.question(question, (answer) => {
      rl.close();
      stdout.write('\n');
      resolve(answer);
    });
  });
}

const password = await ask('Nova administratorska lozinka: ');
if (password.length < MIN_LENGTH) {
  console.error(`Lozinka mora imati najmanje ${MIN_LENGTH} znakova.`);
  process.exit(1);
}
const repeated = await ask('Ponovite lozinku: ');
if (repeated !== password) {
  console.error('Lozinke se ne poklapaju.');
  process.exit(1);
}

const salt = randomBytes(16);
const hash = scryptSync(password, salt, SCRYPT.keyLength, {
  N: SCRYPT.N,
  r: SCRYPT.r,
  p: SCRYPT.p,
  maxmem: SCRYPT.maxmem,
});

console.log('\nUpišite u .env (ili env promenljive servera):\n');
console.log(
  `ADMIN_PASSWORD_HASH=${['scrypt', SCRYPT.N, SCRYPT.r, SCRYPT.p, salt.toString('base64url'), hash.toString('base64url')].join(':')}`,
);
