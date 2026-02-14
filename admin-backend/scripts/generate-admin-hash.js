import bcrypt from 'bcrypt';

const plainPassword = 'Davlatbek09';
const rounds = 12;

const hash = await bcrypt.hash(plainPassword, rounds);
console.log(hash);
