import * as dotenv from 'dotenv';
import * as Mongoose from 'mongoose';

// load environment variables from .env file
dotenv.config();

process.env.MONGO_DB_URL = 'mongodb://localhost:27017/test-ship-battle-game';

Mongoose.connection.dropDatabase();
