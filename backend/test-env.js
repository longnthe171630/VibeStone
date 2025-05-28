import 'dotenv/config';

console.log('Environment variables:');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Defined' : 'Not defined');
console.log('PORT:', process.env.PORT);
