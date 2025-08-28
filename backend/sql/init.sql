CREATE TABLE IF NOT EXISTS stats (
  country_code TEXT PRIMARY KEY,
  total BIGINT NOT NULL DEFAULT 0,
  CONSTRAINT country_code_len CHECK (char_length(country_code) = 2)
);
CREATE INDEX IF NOT EXISTS stats_total_idx ON stats (total DESC);

-- seed บางประเทศไว้ก่อน
INSERT INTO stats(country_code, total) VALUES
 ('TH', 0), ('US', 0), ('JP', 0), ('KR', 0), ('CN', 0), ('TW', 0)
ON CONFLICT (country_code) DO NOTHING;
