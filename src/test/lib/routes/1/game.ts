import 'mocha';
import { expect } from 'chai';
import App from '../../../../lib/app';
import { Game } from '../../../../lib/models';
import * as request from 'supertest';
import * as Mongoose from 'mongoose';

const userId = 'dummyUserId';

function createGameFixture() {
  return Game.create(userId, [{
    name: 'Battleship',
    type: 'battleship',
    size: 1,
    positions: [{
      x: 0,
      y: 0,
      isShot: false,
    }]
  }]);
}

describe('/api/v1/games', () => {
  let app;

  before(async function () {
    app = new App();

    await app.start();
  });

  after(async function () {
    await app.stop();
  });


  describe('GET /', async function () {
    let game;

    before(async function () {
      game = await createGameFixture();
    });

    after(async function () {
      await game.remove();
    });

    it('return one game', async function () {
      const response = await request(app.getExpress())
          .get(app.getRoutePath('games'))
          .expect('Content-Type', /json/)
          .expect(200);

      expect(response.body).to.have.lengthOf(1);
    });
  });

  describe('POST /', async function () {
    it('success', async function () {
      const response = await request(app.getExpress())
          .post(app.getRoutePath('games'))
          .expect('Content-Type', /json/)
          .expect(200);

      expect(response.body.id).to.be.ok;

      // cleanup
      await Game.remove(userId, Mongoose.Types.ObjectId(response.body.id));
      await (new Promise(cb => setTimeout(cb, 100)));
    });
  });

  describe('POST /:id/shot', async function () {
    it('Hit', async function () {
      const createResponse = await request(app.getExpress())
          .post(app.getRoutePath('games'))
          .expect('Content-Type', /json/)
          .expect(200);
      const games = await Game.find(userId);
      const validPosition = games[0].defenderShips.filter(s => s.size > 1)[0].positions[0];

      const response = await request(app.getExpress())
          .post(app.getRoutePath('games/' + createResponse.body.id + '/shot/' + validPosition.x + '/' + validPosition.y))
          .expect(200)
          .expect('Hit');

      // cleanup
      await Game.remove(userId, Mongoose.Types.ObjectId(createResponse.body.id));
      await (new Promise(cb => setTimeout(cb, 100)));
    });

    it('Miss', async function () {
      const createResponse = await request(app.getExpress())
          .post(app.getRoutePath('games'))
          .expect('Content-Type', /json/)
          .expect(200);
      const games = await Game.find(userId);
      const validPosition = games[0].defenderShips.filter(s => s.size > 1)[0].positions[0];
      validPosition.x += 1;
      validPosition.y += 1;

      const response = await request(app.getExpress())
          .post(app.getRoutePath('games/' + createResponse.body.id + '/shot/' + validPosition.x + '/' + validPosition.y))
          .expect(200)
          .expect('Miss');

      // cleanup
      await Game.remove(userId, Mongoose.Types.ObjectId(createResponse.body.id));
      await (new Promise(cb => setTimeout(cb, 100)));
    });

    it('You just sank the X', async function () {
      const createResponse = await request(app.getExpress())
          .post(app.getRoutePath('games'))
          .expect('Content-Type', /json/)
          .expect(200);
      const games = await Game.find(userId);
      const ship = games[0].defenderShips.filter(s => s.size === 1)[0];
      const validPosition = ship.positions[0];

      const response = await request(app.getExpress())
          .post(app.getRoutePath('games/' + createResponse.body.id + '/shot/' + validPosition.x + '/' + validPosition.y))
          .expect(200)
          .expect('You just sank the ' + ship.name);

      // cleanup
      await Game.remove(userId, Mongoose.Types.ObjectId(createResponse.body.id));
      await (new Promise(cb => setTimeout(cb, 100)));
    });

    it('Completed the game', async function () {
      const createResponse = await request(app.getExpress())
          .post(app.getRoutePath('games'))
          .expect('Content-Type', /json/)
          .expect(200);
      const games = await Game.find(userId);
      const game = games[0];
      let totalShots = 0;

      for (let s = 0; s < game.defenderShips.length; s++) {
        const ship = game.defenderShips[s];

        for (let p = 0; p < ship.positions.length; p++) {
          const position = ship.positions[p];
          totalShots++;

          const response = await request(app.getExpress())
            .post(app.getRoutePath('games/' + createResponse.body.id + '/shot/' + position.x + '/' + position.y))

          if (s + 1 === game.defenderShips.length && p + 1 === ship.positions.length) {
            expect(response.text).to.equal('Win ! You completed the game in ' + totalShots + ' moves');
          }
        }
      }

      // cleanup
      await Game.remove(userId, Mongoose.Types.ObjectId(createResponse.body.id));
      await (new Promise(cb => setTimeout(cb, 500)));
    });
  });

});
