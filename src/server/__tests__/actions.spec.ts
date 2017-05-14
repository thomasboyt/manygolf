/// <reference types="mocha" />

import * as expect from 'expect';
import * as I from 'immutable';
// import * as actions from '../actions';
import * as messages from '../messages';

import {Player, State} from '../records';
import {PlayerState} from '../../universal/constants';

class MockSocks {
  messages: any[] = [];

  sendTo(id: number, msg: any) {
    this.messages.push(msg);
  }

  sendAll(msg: any) {
    this.messages.push(msg);
  }
}

describe('sync messages', () => {
  it('do not include players not in the current round', () => {
    const players = I.Map<number, Player>([
      [1, new Player({
        body: {
          position: [0, 0],
          velocity: [0, 0],
        },
      })],
      [2, new Player({
        state: PlayerState.leftRound,
        body: {
          position: [0, 0],
          velocity: [0, 0],
        },
      })],
      [3, new Player({
        state: PlayerState.leftMatch,
      })],
    ]);

    const msg = messages.createSync(new State({
      players,
    }));

    expect(msg.players.length).toEqual(2);
    expect(msg.players[0].id).toEqual(1);
    expect(msg.players[1].id).toEqual(2);
  });
});

// describe('hurry-up messages', () => {
//   it('only take into account currently-connected players', () => {

//   });
// });

// describe('idle kick sweep', () => {
//   it('only takes into account currently-connected players', () => {

//   });
// });

// describe('initial message', () => {
//   it('does not include match-left players', () => {

//   });
// });