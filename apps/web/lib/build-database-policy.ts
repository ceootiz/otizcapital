export function requiresDatabaseDuringBuild(value = process.env.OTIZ_BUILD_REQUIRE_DATABASE) {
  return value === "1";
}
