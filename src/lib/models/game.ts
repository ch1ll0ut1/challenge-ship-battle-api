import * as Mongoose from 'mongoose';

export interface GameModelDocument extends Mongoose.Document {
  userId: string;
  status: string;
  defenderShips: GameShipModelDocument[];
  sizeWidth: number;
  sizeHeight: number;
  totalShots: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface GameShipModelDocument {
  name: string;
  type: string;
  size: number;
  positions: GamePositionModelDocument[];
}

export interface GamePositionModelDocument {
  x: number;
  y: number;
  isShot: Boolean;
}

export default class GameModel {
  private schema: Mongoose.Schema;
  private model: Mongoose.Model<GameModelDocument>;

  public constructor() {
    this.schema = new Mongoose.Schema({
      userId: { type: String, required: true, index: true },
      status: { type: String, default: 'open', enum: ['open', 'done', 'canceled'] },
      defenderShips: { type: [this.getShipPositionSchema()], required: true, min: 1 },
      sizeWidth: { type: Number, default: 10 },
      sizeHeight: { type: Number, default: 10 },
      totalShots: { type: Number, default: 0 },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
    });

    this.model = Mongoose.model<GameModelDocument>('Game', this.schema);
  }

  public find(userId: string, conditions: any = {}): Promise<GameModelDocument[]> {
    return this.model.find(Object.assign({
      userId: userId,
    }, conditions)).exec();
  }

  public create(userId: string, defenderShips: GameShipModelDocument[]) {
    return this.model.create({
      userId,
      defenderShips,
    });
  }

  public remove(userId, id) {
    return this.model.remove({
      userId,
      _id: id,
    });
  }

  // public update() {
  //   return this.model.up();
  // }

  private getShipPositionSchema() {
    const position = new Mongoose.Schema({
      x: { type: Number, required: true, min: 0 },
      y: { type: Number, required: true, min: 0 },
      isShot: { type: Boolean, default: false },
    });

    return new Mongoose.Schema({
      name: { type: String, required: true },
      type: { type: String, required: true, enum: [
        'battleship',
        'cruiser',
        'destroyer',
        'submarine',
      ] },
      size: { type: Number, required: true },
      positions: { type: [position], required: true, min: 1 },
    });
  }
}
