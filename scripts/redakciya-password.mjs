// Makes a password hash for REDAKCIYA_USERS: `npm run redakciya:password -- "пароль"`.
// Same scheme as hashPassword() in src/lib/redakciya/auth.ts.
import crypto from "node:crypto";

const password = process.argv[2];
if (!password) {
  console.error('Usage: npm run redakciya:password -- "пароль"');
  process.exit(1);
}
const salt = crypto.randomBytes(16).toString("base64url");
const hash = crypto.scryptSync(password, salt, 32).toString("base64url");
console.log(`scrypt:${salt}:${hash}`);
