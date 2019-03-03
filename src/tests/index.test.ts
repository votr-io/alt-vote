import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'csvtojson';

import { getResults } from '../index';
import { from } from 'rxjs';

interface TestCase {
  expectedWinner: string;
  ballots: string[][];
}
const TEST_ELECTIONS_DIRECTORY = path.join(__dirname, 'elections');

//read the files from our test elections directory. each one is a test case
fs.readdirSync(TEST_ELECTIONS_DIRECTORY)
  .map(fileName => path.join(TEST_ELECTIONS_DIRECTORY, fileName))
  .forEach(filePath => {
    it(filePath, async () => {
      const { expectedWinner, ballots } = await csvToTestCase(filePath);
      const results = await getResults({
        fetchBallots: () => {
          return from(ballots);
        },
      });
      console.log(results);
      expect(results.winner).toBe(expectedWinner);
    });
  });

//take the path to one of our test election files, return a TestCase
async function csvToTestCase(filePath: string): Promise<TestCase> {
  return csv({ noheader: true, output: 'csv' })
    .fromFile(filePath)
    .then(rawFile => {
      return {
        expectedWinner: rawFile[0][0],
        ballots: rawFile.slice(1),
      };
    });
}
