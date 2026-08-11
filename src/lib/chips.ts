import type { Section } from "./site-log";

export const CHIPS: Record<Section, string[]> = {
  Progress: [
    "Blockwork continuing",
    "1st fix M&E ongoing",
    "Drylining boarding",
    "Screed poured",
    "Ceiling grid",
    "Snagging",
  ],
  Deliveries: [
    "Plasterboard",
    "Blocks & mortar",
    "Ductwork",
    "Cable & containment",
    "Doors & frames",
    "Skip exchange",
  ],
  Labour: [
    "Same as yesterday",
    "Groundworks x4",
    "Dryliners x6",
    "Electricians x3",
    "Plumbers x2",
    "Labourers x2",
  ],
  Plant: ["Telehandler", "MEWP / scissor", "Tower crane", "Dumper", "Generator", "Off-hire today"],
  Issues: [
    "RFI outstanding",
    "Chasing the spark",
    "Material shortage",
    "Access blocked",
    "Design clash",
    "Weather stop",
  ],
  Safety: [
    "Daily briefing done",
    "Permit issued",
    "Near miss",
    "PPE observation",
    "Edge protection checked",
    "Fire points checked",
  ],
  Visitors: ["Client PM", "Architect", "M&E consultant", "HSE / safety advisor", "Building Control", "Supplier rep"],
  Photos: [],
};