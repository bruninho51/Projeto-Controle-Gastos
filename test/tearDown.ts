import * as Docker from "dockerode";

export default async function () {
  const docker = new Docker({ socketPath: "/var/run/docker.sock" });
  const container = docker.getContainer("orcamentos_tests");

  console.log("Parando container MySQL 8.0");
  await container.stop();

  console.log("Removendo container MySQL 8.0");
  await container.remove();

  console.log("Container MySQL 8.0 removido com sucesso");
}
