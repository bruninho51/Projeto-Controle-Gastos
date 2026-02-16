import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

function readJsonFile(filename: string) {
  const filePath = path.join(process.cwd(), 'secrets', filename);
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    throw new Error(`Erro ao ler o arquivo ${filename}: ${error.message}`);
  }
}

admin.initializeApp({
  credential: admin.credential.cert(readJsonFile('firebase-cert.json')),
});

export { admin };