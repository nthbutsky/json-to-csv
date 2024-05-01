import fs from 'fs';
import { json2csv } from 'json-2-csv';
import readline from 'readline';

type Row = {
  key: string[];
  value: string | number | boolean | null;
};

const flatten = (source: any, path: string[]): Row[] => {
  const result: Row[] = [];

  const tick = (source: any, path: string[]) => {
    if (typeof source === 'object') {
      for (const key in source) {
        tick(source[key], [...path, key]);
      }
      return;
    }
    result.push({
      key: path,
      value: source,
    });
  };
  tick(source, path);

  return result;
};

const loadJsonFiles = (filePaths: string[]): any => {
  const jsonObjects: any = {};
  filePaths.forEach(filePath => {
    const moduleName = filePath.split('/').pop()?.replace('.json', '');
    if (moduleName) {
      jsonObjects[moduleName] = require(filePath);
    }
  });
  return jsonObjects;
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const getFilePaths = async (): Promise<string[]> => {
  const filePaths: string[] = [];
  let filePath = '';
  while (true) {
    filePath = await new Promise((resolve) => {
      rl.question('Enter the path to a JSON file (or type "done" to finish): ', (answer) => {
        resolve(answer.trim());
      });
    });
    if (filePath.toLowerCase() === 'done') {
      break;
    }
    filePaths.push(filePath);
  }
  rl.close();
  return filePaths;
};

const main = async () => {
  const filePaths = await getFilePaths();
  const rowList: Row[] = [];
  const jsonFiles = loadJsonFiles(filePaths);

  for (const moduleName in jsonFiles) {
    if (jsonFiles.hasOwnProperty(moduleName)) {
      const rows = flatten(jsonFiles[moduleName], []);
      rowList.push(...rows);
    }
  }

  fs.writeFileSync('./result.csv', json2csv(rowList, {
    delimiter: {
      field: ';',
      wrap: '',
    },
  }));

  console.log('CSV file created successfully.');
};

main();
