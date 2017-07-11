import * as Mongoose from 'mongoose';
import * as Express from 'express';
import { Game } from '../../models';
import * as Debug from 'debug';

const debug = Debug('sb:routes:1:game');

export default class GameRoute {
  private userId = 'dummyUserId';
  private defenderShips = [{
    name: 'Battleship',
    type: 'battleship',
    amount: 1,
    size: 4,
  }, {
    name: 'Cruiser',
    type: 'cruiser',
    amount: 2,
    size: 3,
  }, {
    name: 'Destroyer',
    type: 'destroyer',
    amount: 3,
    size: 2,
  }, {
    name: 'Submarine',
    type: 'submarine',
    amount: 4,
    size: 1,
  }];
  private mapConfig = {
    width: 10,
    height: 10,
  }

  public constructor(router: Express.Router) {
    router.get('/', this.find.bind(this));
    router.post('/', this.create.bind(this));
    router.post('/:id/shot/:x/:y', this.fireShot.bind(this));
  }

  public async find(req, res) {
    try {
      const games = await Game.find(this.userId);
      res.json(games);
    } catch(error) {
      res.status(500).json({
        error: true,
        message: 'Custom error message',
      });
    }
  }

  public async create(req, res) {
    try {
      const games = await Game.find(this.userId, {
        status: 'open',
      });

      if (games.length) return res.status(400).json({
        error: true,
        message: 'You are only allowed to have one open game at a time.',
      });

      const defenderShips = this.spawnDefenderShips();

      const game = await Game.create(this.userId, defenderShips);

      res.json({
        id: game._id,
      });
    } catch(error) {
      console.warn('error', error);
      res.status(500).json({
        error: true,
        message: 'Custom error message',
      });
    }
  }

  public async fireShot(req, res) {
    try {
      const games = await Game.find(this.userId, {
        status: 'open',
        _id: Mongoose.Types.ObjectId(req.params.id),
      });

      if (games.length === 0) return res.status(400).json({
        error: true,
        message: 'Game does not exists or is already over.',
      });
      const game = games[0];
      const x = parseInt(req.params.x);
      const y = parseInt(req.params.y);

      const ships = game.defenderShips.filter((ship) => {
        const positions = ship.positions.filter((p) => {
          return p.x === x && p.y === y && p.isShot === false;
        });

        if (positions.length > 0) {
          positions[0].isShot = true;
          return true;
        }

        return false;
      });

      let message = '';
      game.totalShots++;

      if (ships.length > 0) {
        let hitsLeft = 0;
        game.defenderShips.forEach(ship => hitsLeft += ship.positions.filter(p => p.isShot === false).length);

        const shipHitsLeft = ships[0].positions.filter(p => p.isShot === false).length

        if (hitsLeft <= 0) {
          game.status = 'done';
          message = 'Win ! You completed the game in ' + game.totalShots + ' moves';
        } else if (shipHitsLeft === 0) {
          message = 'You just sank the ' + ships[0].name;
        } else {
          message = 'Hit';
        }
      } else {
        message = 'Miss';
      }

      await game.save();

      res.send(message);
    } catch(error) {
      console.warn('error', error);
      res.status(500).json({
        error: true,
        message: 'Custom error message',
      });
    }
  }

  private spawnDefenderShips() {
    let currentShip = 0;
    const ships = [];
    const map = this.createEmptyMap(10, 10);

    // sort ships by ascending size
    const shipTypes = this.defenderShips.sort((a, b) => b.size - a.size);

    // create simple list of all entities
    shipTypes.forEach((type) => {
      for (let i = 0; i < type.amount; i++) {
        ships.push({
          name: type.name,
          type: type.type,
          size: type.size,
        });
      }
    });

    while (currentShip < ships.length) {
      debug('ship spawn cycle | currentShip=' + currentShip);

      const ship = ships[currentShip];
      const direction = Math.round(Math.random()); // 0=down 1=right

      const maxX = this.mapConfig.width - 1 - (direction === 0 ? 0 : ship.size)
      const maxY = this.mapConfig.height - 1 - (direction === 1 ? 0 : ship.size)
      const point = this.generateRandomPoint(maxX, maxY);

      if (this.validateShipPosition(map, ship, point, direction)) {
        currentShip++;
        ship.positions = this.calculateShipPositions(ship, point, direction);
        this.setMapPositions(map, ship.positions, true);

        debug('found valid position ', ship);
      }
    }

    return ships;
  }

  private createEmptyMap(width, height) {
    const map = [];

    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        if (!map[x]) map[x] = [];

        map[x][y] = 0;
      }
    }

    return map;
  }

  private generateRandomPoint(maxX, maxY) {
    const x = Math.floor(Math.random() * maxX);
    const y = Math.floor(Math.random() * maxY);

    return { x, y, };
  }

  private validateShipPosition(map, ship, point, direction) {
    if (direction === 0) {
      for (let y = point.y - 1; y < ship.size + 1; y++) {
        if (map[point.x - 1] && map[point.x - 1][y] === true) return false;
        if (map[point.x] && map[point.x][y] === true) return false;
        if (map[point.x + 1] && map[point.x + 1][y] === true) return false;
      }
    } else {
      for (let x = point.x - 1; x < ship.size + 1; x++) {
        if (!map[x]) return true;
        if (map[x][point.y - 1] === true) return false;
        if (map[x][point.y] === true) return false;
        if (map[x][point.y + 1] === true) return false;
      }
    }

    return true;
  }

  private calculateShipPositions(ship, point, direction) {
    debug('calculateShipPositions', point, direction);

    const positions = [];

    if (direction === 0) {
      for (let y = point.y; y - point.y < ship.size; y++) {
        positions.push({
          x: point.x,
          y: y,
        });
      }
    } else {
      for (let x = point.x; x - point.x < ship.size; x++) {
        positions.push({
          x: x,
          y: point.y,
        });
      }
    }

    return positions;
  }

  private setMapPositions(map, positions, value) {
    for (let i = 0; i < positions.length; i++) {
      const position = positions[i];
      map[position.x][position.y] = value;
    }
  }
}
