import pkg from 'pg'
const { Pool } = pkg

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 10000
})

export async function getTotal() {
  const { rows } = await pool.query('SELECT COALESCE(SUM(total),0) AS total FROM stats')
  return Number(rows[0].total || 0)
}

export async function getLeaderboard(limit = 200) {
  const { rows } = await pool.query('SELECT country_code, total FROM stats ORDER BY total DESC NULLS LAST LIMIT $1', [limit])
  return rows.map(r => ({ country: r.country_code, total: Number(r.total) }))
}

export async function addPops(country, n) {
  const up = `
    INSERT INTO stats (country_code, total)
    VALUES ($1, $2)
    ON CONFLICT (country_code)
    DO UPDATE SET total = stats.total + EXCLUDED.total
    RETURNING total
  `
  const { rows } = await pool.query(up, [country, n])
  const countryTotal = Number(rows[0].total)
  const globalTotal = await getTotal()
  return { countryTotal, globalTotal }
}
