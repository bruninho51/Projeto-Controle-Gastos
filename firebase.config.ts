import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

let firebaseApp: admin.app.App | null = null;

function tryInitializeFirebase() {
  try {
    const filePath = path.join(process.cwd(), 'secrets', 'firebase-cert.json');

    if (!fs.existsSync(filePath)) {
      console.warn('Certificado do Firebase não encontrado. Firebase não será inicializado.');
      return null;
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const serviceAccount = JSON.parse(fileContent);

    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

  } catch (error) {
    console.error('Erro ao inicializar o Firebase:', error.message);
    return null;
  }
}

firebaseApp = tryInitializeFirebase();

export { firebaseApp };