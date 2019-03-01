import { Observable, from } from 'rxjs';
import { reduce } from 'rxjs/operators';
import * as _ from 'lodash';

const candidates = ['A', 'B', 'C', 'D'];

const ballots = [
  ['A', 'B', 'C', 'D'],
  ['B', 'D', 'A', 'C'],
  ['D', 'B', 'C'],
  ['B', 'A', 'D', 'C'],
  ['A', 'C', 'B', 'D'],
  ['C', 'B', 'D', 'A'],
];

async function getResults({
  candidates,
  fetchBallots,
}: {
  candidates: string[];
  fetchBallots: () => Observable<string[]>;
}) {
  const rounds: Record<string, number>[] = [];
  const losingCandidates: string[] = [];
  let winner;
  while (!winner) {
    const round = await fetchBallots()
      .pipe(
        reduce<string[], Record<string, number>>((acc, ballot) => {
          const candidate = whoIsThisBallotFor({ ballot, losingCandidates });
          if (acc[candidate] == null) {
            acc[candidate] = 0;
          }
          acc[candidate]++;
          return acc;
        }, {})
      )
      .toPromise();
    rounds.push(round);
    winner = getWinner(round);
    losingCandidates.push(getLast(round));
  }

  return { winner, rounds };
}

function whoIsThisBallotFor({
  ballot,
  losingCandidates,
}: {
  ballot: string[];
  losingCandidates: string[];
}): string {
  return ballot.find(vote => !losingCandidates.includes(vote))!;
}

function getWinner(bins: Record<string, number>) {
  const totalVotes = _(bins)
    .values()
    .reduce((a, b) => a + b);

  if (!totalVotes || totalVotes === 0)
    throw new Error('cannot tally election results with 0 votes');

  return Object.keys(bins).find(key => bins[key] > totalVotes / 2);
}

function getLast(bins: Record<string, number>) {
  return Object.keys(bins).reduce((a, b) => (bins[a] < bins[b] ? a : b));
}

getResults({ candidates, fetchBallots: () => from(ballots) }).then(console.log);

/*
- not what we hired you for
- making my job harder
- driving social change and this isn't what we're looking for
*/
