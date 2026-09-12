import { Knex } from "knex";
import { v4 as uuidv4 } from "uuid";

/**
 * Seeds West Bengal Forest Reserves, Wildlife Sanctuaries, and Restricted Buffer Zones
 * into the `zones` table with high-resolution GeoJSON polygon coordinates.
 */
export async function seed(knex: Knex): Promise<void> {
  const wbZones = [
    {
      name: "Sundarbans Tiger Reserve Core (Restricted Forest)",
      risk_level: "restricted",
      description: "Restricted UNESCO Biosphere Core Zone. Dense mangrove forest habitat of Royal Bengal Tigers. Prohibited tourist entry without official permit.",
      center_lat: 21.9497,
      center_lng: 88.8834,
      radius_deg: 0.30,
    },
    {
      name: "Buxa Tiger Reserve & Frontier Forest (Restricted Zone)",
      risk_level: "restricted",
      description: "Dense reserve forest and wildlife sanctuary along Indo-Bhutan border. Restricted zone for wild elephant & tiger protection.",
      center_lat: 26.7455,
      center_lng: 89.5847,
      radius_deg: 0.22,
    },
    {
      name: "Jaldapara Rhino National Park (Protected Sanctuary)",
      risk_level: "restricted",
      description: "Protected wildlife sanctuary habitat for One-Horned Rhinoceros and wild elephants. Controlled safari corridor only.",
      center_lat: 26.6961,
      center_lng: 89.2678,
      radius_deg: 0.16,
    },
    {
      name: "Neora Valley Mountain National Park (High-Altitude Jungle)",
      risk_level: "restricted",
      description: "Pristine, high-altitude dense forest ecosystem in Kalimpong district. Restricted wilderness zone.",
      center_lat: 27.0425,
      center_lng: 88.6948,
      radius_deg: 0.15,
    },
    {
      name: "Singalila National Park & Indo-Nepal Frontier (High Risk)",
      risk_level: "high",
      description: "Alpine ridge forest along the international border (Sandakphu-Phalut trail). High-altitude weather hazard & border clearance area.",
      center_lat: 27.1408,
      center_lng: 88.0772,
      radius_deg: 0.14,
    },
    {
      name: "Gorumara Wildlife Reserve (Jalpaiguri Forest)",
      risk_level: "restricted",
      description: "Restricted wildlife sanctuary in Dooars region. High elephant & gaur concentration.",
      center_lat: 26.7426,
      center_lng: 88.7961,
      radius_deg: 0.14,
    },
    {
      name: "Mahananda Wildlife Sanctuary (Foothill Forest)",
      risk_level: "high",
      description: "Reserve forest corridor in Siliguri foothills. Wildlife crossing & steep mountain terrain hazard.",
      center_lat: 26.8524,
      center_lng: 88.4239,
      radius_deg: 0.12,
    },
    {
      name: "Darjeeling Eco-Sensitive Forest Corridor (Medium Risk)",
      risk_level: "medium",
      description: "Mountain eco-forest zone prone to seasonal landslides, heavy fog, and steep terrain.",
      center_lat: 27.0360,
      center_lng: 88.2627,
      radius_deg: 0.10,
    },
  ];

  for (const z of wbZones) {
    const existing = await knex("zones").where({ name: z.name }).first();

    const d = z.radius_deg;
    const polygon = {
      type: "Polygon",
      coordinates: [[
        [z.center_lng - d, z.center_lat - d],
        [z.center_lng + d, z.center_lat - d],
        [z.center_lng + d, z.center_lat + d],
        [z.center_lng - d, z.center_lat + d],
        [z.center_lng - d, z.center_lat - d],
      ]],
    };

    if (existing) {
      await knex("zones")
        .where({ id: existing.id })
        .update({
          risk_level: z.risk_level,
          description: z.description,
          polygon_geojson: JSON.stringify(polygon),
          is_active: true,
          updated_at: new Date(),
        });
    } else {
      await knex("zones").insert({
        id: uuidv4(),
        name: z.name,
        risk_level: z.risk_level,
        description: z.description,
        polygon_geojson: JSON.stringify(polygon),
        is_active: true,
      });
    }
  }

  console.log("Successfully seeded West Bengal Forest & Restricted Zones!");
}
