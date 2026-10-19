// Official PSA PSGC barangays of Bulan, Sorsogon (municipality code 056203000).
// Source: psgc.gitlab.io API. Do not edit names by hand — refresh from PSGC.
// Names are kept exactly as the registry spells them (punctuation included), sorted A–Z.

export const MUNICIPALITY = "Bulan";
export const PROVINCE = "Sorsogon";
export const SERVICE_AREA = `${MUNICIPALITY}, ${PROVINCE}`;

// Town center used to center the map.
export const MAP_CENTER: [number, number] = [12.6706, 123.8747];
export const MAP_ZOOM = 13;

// Approximate vicinity box around the municipality — used only to gently warn
// when a pin looks far outside Bulan. It is NOT an official boundary.
export const APPROX_BOUNDS = { minLat: 12.55, maxLat: 12.82, minLng: 123.79, maxLng: 124.0 };

export function looksOutsideBulan(lat: number, lng: number): boolean {
  return lat < APPROX_BOUNDS.minLat || lat > APPROX_BOUNDS.maxLat || lng < APPROX_BOUNDS.minLng || lng > APPROX_BOUNDS.maxLng;
}

export type Barangay = { name: string; psgc: string };

export const BARANGAYS: Barangay[] = [
  { name: "A. Bonifacio", psgc: "056203001" },
  { name: "Abad Santos", psgc: "056203002" },
  { name: "Aguinaldo", psgc: "056203003" },
  { name: "Antipolo", psgc: "056203004" },
  { name: "Beguin", psgc: "056203012" },
  { name: "Benigno S. Aquino", psgc: "056203025" },
  { name: "Bical", psgc: "056203011" },
  { name: "Bonga", psgc: "056203013" },
  { name: "Butag", psgc: "056203014" },
  { name: "Cadandanan", psgc: "056203015" },
  { name: "Calomagon", psgc: "056203016" },
  { name: "Calpi", psgc: "056203017" },
  { name: "Cocok-Cabitan", psgc: "056203018" },
  { name: "Daganas", psgc: "056203019" },
  { name: "Danao", psgc: "056203020" },
  { name: "Dolos", psgc: "056203021" },
  { name: "E. Quirino", psgc: "056203022" },
  { name: "Fabrica", psgc: "056203023" },
  { name: "G. Del Pilar", psgc: "056203062" },
  { name: "Gate", psgc: "056203024" },
  { name: "Inararan", psgc: "056203026" },
  { name: "J. Gerona", psgc: "056203027" },
  { name: "J.P. Laurel", psgc: "056203045" },
  { name: "Jamorawon", psgc: "056203028" },
  { name: "Lajong", psgc: "056203030" },
  { name: "Libertad", psgc: "056203029" },
  { name: "M. Roxas", psgc: "056203049" },
  { name: "Magsaysay", psgc: "056203031" },
  { name: "Managanaga", psgc: "056203032" },
  { name: "Marinab", psgc: "056203033" },
  { name: "Montecalvario", psgc: "056203035" },
  { name: "N. Roque", psgc: "056203036" },
  { name: "Namo", psgc: "056203037" },
  { name: "Nasuje", psgc: "056203034" },
  { name: "Obrero", psgc: "056203038" },
  { name: "Osme\u00f1a", psgc: "056203039" },
  { name: "Otavi", psgc: "056203040" },
  { name: "Padre Diaz", psgc: "056203041" },
  { name: "Palale", psgc: "056203042" },
  { name: "Quezon", psgc: "056203046" },
  { name: "R. Gerona", psgc: "056203047" },
  { name: "Recto", psgc: "056203048" },
  { name: "Sagrada", psgc: "056203050" },
  { name: "San Francisco", psgc: "056203051" },
  { name: "San Isidro", psgc: "056203052" },
  { name: "San Juan Bag-o", psgc: "056203053" },
  { name: "San Juan Daan", psgc: "056203054" },
  { name: "San Rafael", psgc: "056203055" },
  { name: "San Ramon", psgc: "056203056" },
  { name: "San Vicente", psgc: "056203057" },
  { name: "Santa Remedios", psgc: "056203058" },
  { name: "Santa Teresita", psgc: "056203059" },
  { name: "Sigad", psgc: "056203060" },
  { name: "Somagongsong", psgc: "056203061" },
  { name: "Taromata", psgc: "056203063" },
  { name: "Zone I Pob.", psgc: "056203005" },
  { name: "Zone II Pob.", psgc: "056203006" },
  { name: "Zone III Pob.", psgc: "056203007" },
  { name: "Zone IV Pob.", psgc: "056203008" },
  { name: "Zone V Pob.", psgc: "056203009" },
  { name: "Zone VI Pob.", psgc: "056203010" },
  { name: "Zone VII Pob.", psgc: "056203064" },
  { name: "Zone VIII Pob.", psgc: "056203065" }
];

export const BARANGAY_NAMES = BARANGAYS.map((b) => b.name);
