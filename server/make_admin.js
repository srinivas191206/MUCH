import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Import User model schema
import { User } from './models/User.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/much-database';

console.log('Connecting to MongoDB at:', MONGO_URI);

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB successfully.');
    
    const users = await User.find({});
    if (users.length === 0) {
      console.log('No registered users found in the database. Please sign up in the browser first!');
      process.exit(0);
    }

    console.log(`Found ${users.length} registered user account(s).`);
    
    for (const user of users) {
      user.role = 'admin';
      user.status = 'active';
      await user.save();
      console.log(`Successfully promoted "${user.email}" to admin role.`);
    }

    console.log('Promotion complete! Please refresh your browser.');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1);
  });
