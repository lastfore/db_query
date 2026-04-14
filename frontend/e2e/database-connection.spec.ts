import { test, expect } from "@playwright/test";

/**
 * Mirrors the sidebar flow: PUT /api/v1/dbs/{name} with { url, description }.
 *
 * Common400 cause: password typo — e.g. `Zc0118postgre` vs `Zc0118postgres` (psql used the latter).
 */
test.describe("Add database (API)", () => {
  test("returns 400 when postgres password is wrong (typo variant)", async ({
    request,
  }) => {
    const res = await request.put("/api/v1/dbs/db_query_dev", {
      data: {
        url: "postgresql://postgres:Zc0118postgre@127.0.0.1:5432/db_query_dev",
        description: "playwright: intentional wrong password",
      },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty("detail");
    expect(String(body.detail)).toMatch(/Connection test failed/i);
  });

  test("returns 200 when E2E_PG_URL is a working DSN", async ({ request }) => {
    const url = process.env.E2E_PG_URL;
    test.skip(!url, "Set E2E_PG_URL to the same postgresql://... string that works in psql");
    const name = process.env.E2E_DB_NAME ?? "e2e_pg_ok";
    const res = await request.put(`/api/v1/dbs/${name}`, {
      data: { url, description: "playwright e2e ok" },
    });
    expect(res.status(), await res.text()).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ name, dbType: "postgresql" });
  });
});
