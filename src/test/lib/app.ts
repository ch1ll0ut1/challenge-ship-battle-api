import 'mocha';
import { expect } from 'chai';
import App from '../../lib/app';
import * as request from 'supertest';

describe('App', () => {

  it('start and stop app', async function () {
    const app = new App();

    await app.start();
    await app.stop();
  });

  it('request a route', async function () {
    const app = new App();
    await app.start();

    const response = await request(app.getExpress())
        .get(app.getRoutePath('games'))
        .expect('Content-Type', /json/)
        .expect(200);

    expect(response.body).to.have.lengthOf(0);

    await app.stop();
  });

});
