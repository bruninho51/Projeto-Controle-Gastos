export default async function () {
  const container = (global as any).__MYSQL_CONTAINER__;
  if (container) {
    await container.stop();
    console.log("MySQL container stopped");
  }
}