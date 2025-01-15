import * as Docker from "dockerode";

process.env.DATABASE_URL = "mysql://root:root@localhost:10330/orcamentos";

export default async function () {
  return new Promise(async (resolve, reject) => {
    const docker = new Docker({ socketPath: "/var/run/docker.sock" });

    console.log("\nCriando container Docker MySQL 8.0");

    const container = await docker.createContainer({
      name: "orcamentos_tests",
      Image: "mysql:8.0",
      Env: ["MYSQL_ROOT_PASSWORD=root", "MYSQL_DATABASE=orcamentos"],
      ExposedPorts: {
        "3306/tcp": {},
      },
      HostConfig: {
        PortBindings: {
          "3306/tcp": [
            {
              HostPort: "10330",
            },
          ],
        },
      },
    });

    await container.start();

    setTimeout(() => {
      console.log("Container MySQL 8.0 iniciado com sucesso");
      resolve(true);
    }, 20000);
  });
}
