export interface County {
  id: string;
  name: string;
}

export const counties: County[] = [
  { id: "47", name: "Nairobi City" },
  { id: "01", name: "Mombasa" },
  { id: "02", name: "Kwale" },
  { id: "03", name: "Kilifi" },
  { id: "04", name: "Tana River" },
  { id: "05", name: "Lamu" },
  { id: "06", name: "Taita Taveta" },
  { id: "07", name: "Garissa" },
  { id: "08", name: "Wajir" },
  { id: "09", name: "Mandera" },
  { id: "10", name: "Marsabit" },
  { id: "11", name: "Isiolo" },
  { id: "12", name: "Meru" },
  { id: "13", name: "Tharaka Nithi" },
  { id: "14", name: "Embu" },
  { id: "15", name: "Kitui" },
  { id: "16", name: "Machakos" },
  { id: "17", name: "Makueni" },
  { id: "18", name: "Nyandarua" },
  { id: "19", name: "Nyeri" },
  { id: "20", name: "Kirinyaga" },
  { id: "21", name: "Murang'a" },
  { id: "22", name: "Kiambu" },
  { id: "23", name: "Turkana" },
  { id: "24", name: "West Pokot" },
  { id: "25", name: "Samburu" },
  { id: "26", name: "Trans Nzoia" },
  { id: "27", name: "Uasin Gishu" },
  { id: "28", name: "Elgeyo Marakwet" },
  { id: "29", name: "Nandi" },
  { id: "30", name: "Baringo" },
  { id: "31", name: "Laikipia" },
  { id: "32", name: "Nakuru" },
  { id: "33", name: "Narok" },
  { id: "34", name: "Kajiado" },
  { id: "35", name: "Kericho" },
  { id: "36", name: "Bomet" },
  { id: "37", name: "Kakamega" },
  { id: "38", name: "Vihiga" },
  { id: "39", name: "Bungoma" },
  { id: "40", name: "Busia" },
  { id: "41", name: "Siaya" },
  { id: "42", name: "Kisumu" },
  { id: "43", name: "Homa Bay" },
  { id: "44", name: "Migori" },
  { id: "45", name: "Kisii" },
  { id: "46", name: "Nyamira" },
].sort((a, b) => a.name.localeCompare(b.name));

export function getCountyName(id: string): string {
  return counties.find(c => c.id === id)?.name || "Unknown County";
}
