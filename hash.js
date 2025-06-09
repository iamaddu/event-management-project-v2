// hash.js
const bcrypt = require('bcryptjs');
const password = 'addupassword'; // <-- your plain password
const hash = bcrypt.hashSync(password, 10);
console.log(hash);