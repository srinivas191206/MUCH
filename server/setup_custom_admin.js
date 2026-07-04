import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

// Import User model schema
import { User } from './models/User.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/much-database';

console.log('Connecting to MongoDB at:', MONGO_URI);

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB successfully.');

    // 1. Demote 1@gmail.com to member role
    const user1 = await User.findOne({ email: '1@gmail.com' });
    if (user1) {
      user1.role = 'member';
      await user1.save();
      console.log('Successfully demoted "1@gmail.com" to member role.');
    } else {
      console.log('"1@gmail.com" account not found.');
    }

    // 2. Hash password 'mahi7781'
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('mahi7781', salt);

    // 3. Upsert srinivas@admin account
    let srinivas = await User.findOne({ email: 'srinivas@admin' });
    if (srinivas) {
      srinivas.password = hashedPassword;
      srinivas.role = 'admin';
      srinivas.status = 'active';
      await srinivas.save();
      console.log('Successfully updated existing "srinivas@admin" user with admin role and password.');
    } else {
      srinivas = new User({
        email: 'srinivas@admin',
        password: hashedPassword,
        role: 'admin',
        status: 'active'
      });
      await srinivas.save();
      console.log('Successfully created new "srinivas@admin" user with admin role and password.');
    }

    console.log('Admin configuration updates complete!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1);
  });
