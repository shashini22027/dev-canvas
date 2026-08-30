import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../src/models/User.js';

const email = process.argv[2]?.trim().toLowerCase();

const makeAdmin = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required');
  }

  if (!email) {
    throw new Error('Usage: npm run admin:promote -- user@example.com');
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const user = await User.findOneAndUpdate(
    { email },
    { role: 'ADMIN', isNewUser: false },
    { new: true, runValidators: true }
  );

  if (!user) {
    throw new Error(`No user found for ${email}. Login once first, then run this command again.`);
  }

  console.log(`${user.email} is now an ADMIN`);
  await mongoose.disconnect();
};

makeAdmin().catch(async (err) => {
  console.error(err.message);
  await mongoose.disconnect();
  process.exit(1);
});
