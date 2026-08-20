import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Add is_active column to zones
  await knex.schema.alterTable("zones", (table) => {
    table.boolean("is_active").defaultTo(true);
  });

  // Add PostGIS geometry column to zones (generated from polygon_geojson)
  await knex.raw(`
    ALTER TABLE zones ADD COLUMN IF NOT EXISTS polygon_geom geometry(Polygon, 4326);
  `);

  // Populate polygon_geom from polygon_geojson for existing rows
  await knex.raw(`
    UPDATE zones
    SET polygon_geom = ST_SetSRID(ST_GeomFromGeoJSON(polygon_geojson::text), 4326)
    WHERE polygon_geom IS NULL AND polygon_geojson IS NOT NULL;
  `);

  // Add a trigger to auto-populate polygon_geom on insert/update
  await knex.raw(`
    CREATE OR REPLACE FUNCTION zones_update_geom() RETURNS trigger AS $$
    BEGIN
      NEW.polygon_geom := ST_SetSRID(ST_GeomFromGeoJSON(NEW.polygon_geojson::text), 4326);
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  await knex.raw(`
    DROP TRIGGER IF EXISTS zones_geom_trigger ON zones;
    CREATE TRIGGER zones_geom_trigger
      BEFORE INSERT OR UPDATE OF polygon_geojson ON zones
      FOR EACH ROW
      EXECUTE FUNCTION zones_update_geom();
  `);

  // Spatial index on zones
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_zones_polygon_geom ON zones USING GIST (polygon_geom);
  `);

  // Add PostGIS geometry column to location_pings
  await knex.raw(`
    ALTER TABLE location_pings ADD COLUMN IF NOT EXISTS location_geom geometry(Point, 4326);
  `);

  // Populate from lat/lng
  await knex.raw(`
    UPDATE location_pings
    SET location_geom = ST_SetSRID(ST_MakePoint(lng, lat), 4326)
    WHERE location_geom IS NULL;
  `);

  // Trigger for location_pings
  await knex.raw(`
    CREATE OR REPLACE FUNCTION location_pings_update_geom() RETURNS trigger AS $$
    BEGIN
      NEW.location_geom := ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326);
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  await knex.raw(`
    DROP TRIGGER IF EXISTS location_pings_geom_trigger ON location_pings;
    CREATE TRIGGER location_pings_geom_trigger
      BEFORE INSERT OR UPDATE OF lat, lng ON location_pings
      FOR EACH ROW
      EXECUTE FUNCTION location_pings_update_geom();
  `);

  // Spatial index on location_pings
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_location_pings_geom ON location_pings USING GIST (location_geom);
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw("DROP TRIGGER IF EXISTS zones_geom_trigger ON zones");
  await knex.raw("DROP FUNCTION IF EXISTS zones_update_geom()");
  await knex.raw("DROP INDEX IF EXISTS idx_zones_polygon_geom");
  await knex.raw("ALTER TABLE zones DROP COLUMN IF EXISTS polygon_geom");
  await knex.raw("ALTER TABLE zones DROP COLUMN IF EXISTS is_active");

  await knex.raw("DROP TRIGGER IF EXISTS location_pings_geom_trigger ON location_pings");
  await knex.raw("DROP FUNCTION IF EXISTS location_pings_update_geom()");
  await knex.raw("DROP INDEX IF EXISTS idx_location_pings_geom");
  await knex.raw("ALTER TABLE location_pings DROP COLUMN IF EXISTS location_geom");
}
