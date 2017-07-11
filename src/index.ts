import * as dotenv from 'dotenv';
import App from './lib/app';

// load environment variables from .env file
dotenv.config();

// start app
const app = new App();
app.start()
  .catch((error) => {
    console.warn('App Error', error);
    throw error;
  });
