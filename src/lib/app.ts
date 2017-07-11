import { Server, createServer } from 'http';
import * as Express from 'express';
import * as BodyParser from 'body-parser';
import GameRoute from './routes/1/game';
import MongoDb from './integrations/mongo-db';
import * as Debug from 'debug';

const debug = Debug('sb:app');

export default class App {
  private app: Express.Application;
  private port: string;
  private server: Server;
  private db: MongoDb;

  public constructor() {
    this.port = process.env.PORT || '1337';
    this.db = new MongoDb();
  }

  public async start() {
    debug('start');

    // configure mongoose
    await this.db.start();

    // configure web server
    this.app = Express();

    this.app.use(BodyParser.urlencoded({ extended: true }));
    this.app.use(BodyParser.json());

    // load routes (normaly solved with a dynamic route loader, in this case its only a single route)
    const gameRouter = Express.Router();
    const gameController = new GameRoute(gameRouter);

    this.app.use(this.getRoutePath('games'), gameRouter);

    // start handling requests
    this.server = createServer(this.app);
    this.server.listen(this.port);
  }

  public async stop() {
    debug('stop');

    await (new Promise(cb => this.server.close(cb)));
    await this.db.stop();
  }

  public getExpress() {
    return this.app;
  }

  public getRoutePath(resource, version = 'v1') {
    return '/api/' + version + '/' + resource;
  }
}
