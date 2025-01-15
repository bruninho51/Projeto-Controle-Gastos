import { exec } from "child_process";

export async function runPrismaMigrations() {
  return new Promise<void>((resolve, reject) => {
    exec("npx prisma migrate reset --force", (err, stdout, stderr) => {
      if (err) {
        reject(`Error running migrations: ${stderr}`);
      } else {
        resolve();
      }
    });
  });
}
