/* ================================================
   KLOZET KAARAN — CENTRAL PRODUCT CATALOG
   ================================================
   Single source of truth for every product shown across the
   site (homepage hero, Collections page, cart, wishlist).

   This is the FULL real catalog — no placeholder/fake products
   remain. 9 real collections, 23 real products, matching the
   brand's actual product list exactly (including the correction
   that "Fan Edition" is just ACDC — Believe (Skull) and Racer
   are their own "Special Edition" category, not Fan Edition).

   IMAGES ARE STILL PLACEHOLDERS (reused stock photography URLs,
   cycled across products). Swap in real product photography —
   search "REPLACE IMAGE" to find every spot that needs one.

   sizes:  array of strings shown as size buttons
   colors: array of { name, hex } shown as swatches — names are
           what gets sent in the WhatsApp order message.
================================================ */

window.KK_COLLECTIONS = {
  "acid-wash":        { label: "Acid Wash",        tagline: "Engineered Fade",  drop: "DROP 01" },
  "plain":            { label: "Plain",             tagline: "No Noise",         drop: "DROP 02" },
  "terrain":          { label: "Terrain",           tagline: "Raw Ground",       drop: "DROP 03" },
  "motorist":         { label: "Motorist Edition",  tagline: "Built for Speed",   drop: "DROP 04" },
  "fan-edition":      { label: "Fan Edition",        tagline: "Loud and Proud",   drop: "DROP 05" },
  "classic-cartoon":  { label: "Classic Cartoon",    tagline: "Frame by Frame",   drop: "DROP 06" },
  "special-edition":  { label: "Special Edition",    tagline: "Not for Everyone", drop: "DROP 07" },
  "womens":           { label: "Women's",            tagline: "Soft Rebellion",   drop: "DROP 08" },
  "festive":          { label: "Festive",            tagline: "Onam Collection",  drop: "DROP 09" },
};

// Cycled across products below — REPLACE IMAGE with real photography.
const IMG = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuA5y4xVLrhuIu9-sn2cE7LvwzPBsSCCpGD3665jMSPty5vtjoraZd0lCg7FXN6nmSR8il3DCCcpHPAOAi1CqcXBABeCZMTEO_3DytiqQYLHan4loO5E7SRmWIAGcy-6VF4fn5wz5b1iGslTGK9vuSdWNRJiGjxxbfwdi6R1jw6FeE8dk1P16ahBd_I",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAGAmTyrsAC4Uanis5IrW6_k0go4xoAFiVS8jpBDJ3TPW-QyZ6M5A1evxnIbZdGgYUmSRbUI6z5s7C-I5hiQyy2mouqPLT21sF6Vwufeo5RK2Mg5T4BltNjzGLRA7kNVX-9OFBm_qzYemlMVBezOpYQGfgyJI2fPEZcsWYg13hHSG_5KZwA55aKi31vB_dH2CXcn3qoavUe5yKIiyhE04lgKEZ0-v_qKfDB7blAHaxK2gR4r2U5kdsWAfhCXyYSXuNpkaD6E4yGeO8",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuB67PobdSVuCMgSxnyGKdgqTHnV5zsXXhJew5fRrDqhupEwY6E_xN2LHPFWVAaEwXgsOYXaOAPL7YcozvwDiHHRg1SrUbA0qNwfzdDoMVpxpIsIw165uXXJu-jQU0CFijO6Z5ZcvXnYtLRABnmZno82RVnnUi79qLGRkbVMQZqZCGNr6pnWEBsuDNS6Dv3eTG81lgGSxlyP2KOXI8RncVfNH53ixzeRrmNO4EOlGVcaDmffUFvQhwe17jBU6xJJiM9S0oxQ",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuB7-6LCxmny2X2aubS-0LYfQ4tWhJrlLIsAyowvGmXkDSxZzxklNrlC2vz-de-OPjfPAxRy3JcnvhT9krwgObJc7kqiyWn0KAWxcVEXQ65XDqC_UwfW0a4pskQcGlWzOHkoiN6HUejBal6qvhLLgGq7VC_aF8MmbIEPpe7mWS7Vg6rud7TBi2lzCtdWPmmDbYMaNoRalloAOoX6EtNF7ihAXpyn3Q4_oUZieOscMeoUj0z_yWYumMd6wVhSUgUzORWBsO5YlpUuZWc",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBtHvt4ZxFFhaM7XofUoCHCnjRaU1GAM9zCBtakmLn0go0LmTWCuDuKxfvormrYcpJu5I1m6_p_SQgPp9Tq_3DAUMdYtbzdPmwF75Q4lYlld6oZjWCPSmnPJ4rajfbPtnp8FpvD-eUTtsJJmCmCJfRHTIwceK8QV6iJlzCfn3o2g6wzuUUkHWSE--feIV10uo7mzeQ41w6Mz2agQeEf45GH28GXbH03KCPIm0PDmkXbI6X1rQAmTtimZhxS_Wkxb6gRpN14i2Aifrs",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCkXlCwvJ2QBT4lkb150GrHWdvSmqc8hAy7bRq9LjoUFMLCsY2HvYCtqSpqc4z8wfJ7p4BknfOgRXbuiKs2m1s4YcqGB7K7THvIX6AC7oHcveHVmcmwMo9q9F-GV7CRDA1bAsoy7jEe2anepKXIOPxV2cZ1d329TymCPTDYHGFmbF1Tzvju2EIfAMaZgeYyBEeFhFGTBLGQmSn-UexRHDPPvag_xOvB86KDUYS5k9iuGVtM5HaiiaIo6tJv7xroQWr6qpfwZxfqgE0",
];
function img(i) { return IMG[i % IMG.length]; }

window.KK_PRODUCTS = {

  // ─── 1. Acid Wash Collection (washed tees) ───
  "lava-rust":          { id: "lava-rust", title: "Lava Rust", code: "001", price: 1599, category: "acid-wash", desc: "Washed oversized tee. Burnt rust-orange, aged like it's already been worn in.", images: [img(0)], sizes: ["S","M","L","XL"], colors: [{ name: "Lava Rust", hex: "#a4502c" }] },
  "purple-isnt-basic":  { id: "purple-isnt-basic", title: "Purple Isn't Basic", code: "002", price: 1599, category: "acid-wash", desc: "Washed oversized tee. The one that started the conversation.", images: [img(1)], sizes: ["S","M","L","XL"], colors: [{ name: "Purple", hex: "#6b4c9e" }] },
  "sivappu-rebel":      { id: "sivappu-rebel", title: "Sivappu Rebel", code: "003", price: 1599, category: "acid-wash", desc: "Washed oversized tee. Bold red, built to be seen.", images: [img(2)], sizes: ["S","M","L","XL"], colors: [{ name: "Sivappu Red", hex: "#9e2b25" }] },
  "pachai-flow":        { id: "pachai-flow", title: "Pachai Flow", code: "004", price: 1599, category: "acid-wash", desc: "Washed oversized tee. Deep green, calm on the surface.", images: [img(3)], sizes: ["S","M","L","XL"], colors: [{ name: "Pachai Green", hex: "#3f5c3f" }] },
  "neelam-static":      { id: "neelam-static", title: "Neelam Static", code: "008", price: 1599, category: "acid-wash", desc: "Washed oversized tee. Electric blue with a static-wash finish.", images: [img(4)], sizes: ["S","M","L","XL"], colors: [{ name: "Neelam Blue", hex: "#2e4a7a" }] },
  "bhoomi-brown":       { id: "bhoomi-brown", title: "Bhoomi Brown", code: "009", price: 1599, category: "acid-wash", desc: "Washed oversized tee. Earth-brown, named for the ground it's built from.", images: [img(5)], sizes: ["S","M","L","XL"], colors: [{ name: "Bhoomi Brown", hex: "#5b4636" }] },
  "karuppu-core":       { id: "karuppu-core", title: "Karuppu Core", code: "010", price: 1599, category: "acid-wash", desc: "Washed oversized tee. Deep black core wash.", images: [img(0)], sizes: ["S","M","L","XL"], colors: [{ name: "Karuppu Black", hex: "#1c1c1c" }] },

  // ─── 2. Plain Collection ───
  "plain-black":        { id: "plain-black", title: "Plain Black", code: "006", price: 1299, category: "plain", desc: "Clean oversized essential tee. No print, all fit.", images: [img(1)], sizes: ["S","M","L","XL"], colors: [{ name: "Black", hex: "#141414" }] },
  "plain-red":          { id: "plain-red", title: "Plain Red", code: "007", price: 1299, category: "plain", desc: "Clean oversized essential tee. No print, all fit.", images: [img(2)], sizes: ["S","M","L","XL"], colors: [{ name: "Red", hex: "#8c1c1c" }] },

  // ─── 3. Terrain Collection ───
  "azure-calm":         { id: "azure-calm", title: "Azure Calm", code: "011", price: 1599, category: "terrain", desc: "Washed oversized tee. Calm, muted blue — the archive's quiet one.", images: [img(0)], sizes: ["S","M","L","XL"], colors: [{ name: "Azure Calm", hex: "#4c7a9e" }] },
  "olive-form":         { id: "olive-form", title: "Olive Form", code: "012", price: 1599, category: "terrain", desc: "Washed oversized tee. Military olive, built for the terrain.", images: [img(3)], sizes: ["S","M","L","XL"], colors: [{ name: "Olive", hex: "#5c5c3d" }] },

  // ─── 4a. Printed Collection > Motorist Edition ───
  "ktm-tee":            { id: "ktm-tee", title: "KTM", code: "0001", price: 1799, category: "motorist", desc: "Racing-inspired graphic tee.", images: [img(4)], sizes: ["S","M","L","XL"], colors: [{ name: "Jet Black", hex: "#141414" }] },
  "mustang-tee":        { id: "mustang-tee", title: "Mustang", code: "0002", price: 1799, category: "motorist", desc: "Motorsport-inspired graphic tee.", images: [img(5)], sizes: ["S","M","L","XL"], colors: [{ name: "Jet Black", hex: "#141414" }] },
  "kawasaki-tee":       { id: "kawasaki-tee", title: "Kawasaki", code: "0003", price: 1799, category: "motorist", desc: "Racing-inspired graphic tee. 2 colour options.", images: [img(0)], sizes: ["S","M","L","XL"], colors: [{ name: "Jet Black", hex: "#141414" }, { name: "Racing Green", hex: "#2f4a34" }] },
  "mclaren-tee":        { id: "mclaren-tee", title: "McLaren", code: "0004", price: 1799, category: "motorist", desc: "Puffy-print motorsport graphic tee. 2 colour options.", images: [img(1)], sizes: ["S","M","L","XL"], colors: [{ name: "Jet Black", hex: "#141414" }, { name: "Papaya Orange", hex: "#ff8000" }] },

  // ─── 4b. Printed Collection > Fan Edition ───
  "acdc-band-tee":      { id: "acdc-band-tee", title: "AC/DC Band", price: 1699, category: "fan-edition", desc: "Licensed rock band graphic tee.", images: [img(2)], sizes: ["S","M","L","XL"], colors: [{ name: "Jet Black", hex: "#141414" }] },

  // ─── 4c. Printed Collection > Classic Cartoon Collection ───
  "tom-and-jerry-tee":  { id: "tom-and-jerry-tee", title: "Tom and Jerry", price: 1599, category: "classic-cartoon", desc: "Licensed classic-cartoon graphic tee.", images: [img(3)], sizes: ["S","M","L","XL"], colors: [{ name: "Cream", hex: "#ded4bd" }] },
  "senal-de-respecto":  { id: "senal-de-respecto", title: "Se\u00f1al De Respecto", price: 1599, category: "classic-cartoon", desc: "Minimal chest-print graphic tee.", images: [img(4)], sizes: ["S","M","L","XL"], colors: [{ name: "Cream", hex: "#ded4bd" }] },

  // ─── 4d. Printed Collection > Special Edition ───
  "believe-skull-tee":  { id: "believe-skull-tee", title: "Believe (Skull)", price: 1699, category: "special-edition", desc: "Bold skull graphic tee — limited run.", images: [img(5)], sizes: ["S","M","L","XL"], colors: [{ name: "Jet Black", hex: "#141414" }] },
  "racer-tee":          { id: "racer-tee", title: "Racer", price: 1699, category: "special-edition", desc: "Motorsport special-edition graphic tee.", images: [img(0)], sizes: ["S","M","L","XL"], colors: [{ name: "Jet Black", hex: "#141414" }] },

  // ─── 5a. Women's Collection > Crop Tops ───
  "be-happy-crop":      { id: "be-happy-crop", title: "Be Happy", price: 1299, category: "womens", desc: "Women's cropped graphic tee.", images: [img(1)], sizes: ["S","M","L"], colors: [{ name: "Off White", hex: "#e9e5da" }] },
  "butterfly-crop":     { id: "butterfly-crop", title: "Butterfly", price: 1299, category: "womens", desc: "Women's cropped graphic tee.", images: [img(2)], sizes: ["S","M","L"], colors: [{ name: "Off White", hex: "#e9e5da" }] },

  // ─── Festive Edition ───
  "onam-collection":    { id: "onam-collection", title: "Onam Collection", price: 1499, category: "festive", desc: "Limited festive-edition oversized tee.", images: [img(3)], sizes: ["S","M","L","XL"], colors: [{ name: "Cream", hex: "#ded4bd" }] },
};

function getProductsByCollection(collectionKey) {
  return Object.values(window.KK_PRODUCTS).filter((p) => p.category === collectionKey);
}
window.KK_getProductsByCollection = getProductsByCollection;
