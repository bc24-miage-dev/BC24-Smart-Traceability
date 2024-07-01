import { ressourceTemplates } from '../resource_templates/templates';
import * as fs from 'fs-extra';

const saveDataAsJson = async () => {
  const jsonContent = JSON.stringify(ressourceTemplates, null, 2); // Convert to JSON with indentation
  const outputPath = './output.json';

  try {
    await fs.writeFile(outputPath, jsonContent, 'utf8');
    console.log(`Data has been saved to ${outputPath}`);
  } catch (err) {
    console.error('Error writing to file', err);
  }
};

saveDataAsJson();