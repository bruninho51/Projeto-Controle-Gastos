import * as dotenv from "dotenv";
import { GenericContainer, Wait } from "testcontainers";

dotenv.config({
  path: ".env.test",
});

export default async function () {
  // Cria container MySQL
  const container = await new GenericContainer("mysql:8.0")
    .withExposedPorts(3306)
    .withEnvironment({
      MYSQL_ROOT_PASSWORD: process.env.DB_PASSWORD!,
      MYSQL_DATABASE: process.env.DB_NAME!,
    })
    .withHealthCheck({
      test: [
        "CMD-SHELL",
        "mysql -h 127.0.0.1 -P 3306 -uroot -p${MYSQL_ROOT_PASSWORD} -e 'SELECT 1'",
      ],
      interval: 5_000,
      timeout: 3_000,
      retries: 10,
      startPeriod: 10_000,
    })
    .withWaitStrategy(Wait.forHealthCheck())
    .start();

  // Porta dinâmica!
  const host = container.getHost();
  const port = container.getMappedPort(3306);

  process.env.DB_HOST = host;
  process.env.DB_PORT = port.toString();

  // Salva no global para teardown
  (global as any).__MYSQL_CONTAINER__ = container;

  console.log(`MySQL container started at ${host}:${port}`);
}
