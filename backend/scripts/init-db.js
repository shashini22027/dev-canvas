import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import Project from '../src/models/Project.js';
import Like from '../src/models/Like.js';
import Follower from '../src/models/Follower.js';
import Notification from '../src/models/Notification.js';

const models = [User, Project, Like, Follower, Notification];

const initDatabase = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required');
  }

  await mongoose.connect(process.env.MONGODB_URI);

  for (const model of models) {
    await model.createCollection();
    await model.syncIndexes();
    console.log(`Initialized ${model.collection.name}`);
  }

  await mongoose.disconnect();
  console.log('Database initialization complete');
};

initDatabase().catch(async (err) => {
  console.error(err.message);
  await mongoose.disconnect();
  process.exit(1);
});
