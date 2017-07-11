import * as Debug from 'debug';
import * as Mongoose from 'mongoose';

const debug = Debug('sb:mongo-db');
(<any>Mongoose).Promise = Promise;

export default class MongoDb {
  private url: string;

  public constructor() {
    this.url = process.env.MONGO_DB_URL;
  }

  public async start() {
    // NOTE: typescript does not allow setting option useMongoClient #ignoring deprecation warning for now
    await Mongoose.connect(this.url);

    debug('connected to', this.url);
  }

  public async stop() {
    await Mongoose.connection.close();
  }
}
