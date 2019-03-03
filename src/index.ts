import { Observable } from 'rxjs';
import { reduce } from 'rxjs/operators';
import * as _ from 'lodash';

// const candidates = ['A', 'B', 'C', 'D'];

// const ballots = [
//   ['A', 'B', 'C', 'D'],
//   ['B', 'D', 'A', 'C'],
//   ['D', 'B', 'C'],
//   ['B', 'A', 'D', 'C'],
//   ['A', 'C', 'B', 'D'],
//   ['C', 'B', 'D', 'A'],
// ];

// const ballots = [['A'], ['A'], ['B'], ['B'], ['C', 'D', 'B'], ['C', 'D', 'B'], ['D']];

//this will represent the bin to hold ballots that don't have any votes for a candidate remaining in the race
const TRASH = 'trash';

export async function getResults({
  fetchBallots,
}: {
  fetchBallots: () => Observable<string[]>;
}) {
  const rounds: Record<string, number>[] = [];
  const losingCandidates: string[] = [];
  let winner;
  while (!winner) {
    //   for (let i = 0; i < 5; i++) {
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
  return ballot.find(vote => !losingCandidates.includes(vote)) || TRASH;
}

function getWinner(bins: Record<string, number>) {
  const totalVotes = _(getRemaining(bins))
    .values()
    .reduce((a, b) => a + b);

  if (!totalVotes || totalVotes === 0)
    throw new Error('cannot tally election results with 0 votes');

  return Object.keys(getRemaining(bins)).find(key => bins[key] > totalVotes / 2);
}

function getLast(bins: Record<string, number>) {
  /*
    Tiebreaker Logic:
    Whichever bin was created last this round will have the disadvantage.
    This is pretty random since it's based on the order that candidates appear 
    on ballots of this round, however it is deterministic,which is great 
    for replayability and tests.

    If someone has a better idea let me know.

    Tiebreakers are extremely unlikely to happen with a decent number of votes.
    */
  return Object.keys(getRemaining(bins)).reduce((a, b) => (bins[a] < bins[b] ? a : b));
}

//helper to filter out the trash bin
function getRemaining(bins): Record<string, number> {
  return Object.keys(bins)
    .filter(key => key !== TRASH)
    .reduce((acc, key) => {
      acc[key] = bins[key];
      return acc;
    }, {});
}

// getResults({ fetchBallots: () => from(ballots) }).then(console.log);
