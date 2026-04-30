export const PLANT_NAMES_ID = {
  "apple": "Apel",
  "banana": "Pisang",
  "blackgram": "Kacang Hitam",
  "chickpea": "Kacang Arab",
  "coconut": "Kelapa",
  "coffee": "Kopi",
  "cotton": "Kapas",
  "grapes": "Anggur",
  "jute": "Rami",
  "kidneybeans": "Kacang Merah",
  "lentil": "Lentil",
  "maize": "Jagung",
  "mango": "Mangga",
  "mothbeans": "Kacang Moth",
  "mungbean": "Kacang Hijau",
  "muskmelon": "Melon",
  "orange": "Jeruk",
  "papaya": "Pepaya",
  "pigeonpeas": "Kacang Gude",
  "pomegranate": "Delima",
  "rice": "Padi",
  "watermelon": "Semangka",
};

export const toIndonesian = (name) =>
  PLANT_NAMES_ID[name?.toLowerCase()] ?? name;
