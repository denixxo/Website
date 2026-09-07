// data/posters.js — poster gallery.
//
// HOW TO ADD A POSTER
//   1. Drop the PDF into assets/pdf/posters/<id>.pdf
//   2. Run:  python tools/make_thumbnails.py   (full-page thumbnail in assets/img/posters/)
//   3. Add one object below. `award` may be null or { en, fr }.
//
// TODO(Denis): several titles below are placeholders inferred from the research
// topic of the period — replace them with the actual poster titles and drop in
// the PDFs (which will also fix the thumbnails).
window.SITE = window.SITE || {};
window.SITE.posters = [
  {
    id: "2024-poster-surface-architectures",
    year: 2024,
    title: "Optimizing on-surface quantum architectures with quantum optimal control",
    event: "Asian Conference on Molecular Magnetism (ACMM)",
    location: "",
    award: null,
    pdf: "assets/pdf/posters/2024-poster-surface-architectures.pdf",
    thumbnail: "assets/img/posters/2024-poster-surface-architectures.webp"
  },
  {
    id: "2023-poster-noisy-qudit",
    year: 2023,
    title: "Noisy qudit vs multiple qubits: conditions on gate efficiency",
    event: "European Summer School in Quantum Science and Technology",
    location: "Durbach, Germany",
    award: { en: "Best poster — 1st place", fr: "Meilleur poster — 1re place", ko: "최우수 포스터 — 1위", de: "Bestes Poster — 1. Platz" },
    pdf: "assets/pdf/posters/2023-poster-noisy-qudit.pdf",
    thumbnail: "assets/img/posters/2023-poster-noisy-qudit.webp"
  },
  {
    id: "2023-poster-ed182",
    year: 2023,
    title: "Hyperfine interactions in lanthanide complexes for QIP",
    event: "ED182 PhD Day, Université de Strasbourg",
    location: "Strasbourg, France",
    award: { en: "Best poster award", fr: "Prix du meilleur poster", ko: "최우수 포스터상", de: "Best-Poster-Preis" },
    pdf: "assets/pdf/posters/2023-poster-ed182.pdf",
    thumbnail: "assets/img/posters/2023-poster-ed182.webp"
  },
  {
    id: "2022-poster-les-houches",
    year: 2022,
    title: "Hyperfine qudits in lanthanide-organic complexes",
    event: "Quantum Information Spring School, École de Physique des Houches",
    location: "Les Houches, France",
    award: null,
    pdf: "assets/pdf/posters/2022-poster-les-houches.pdf",
    thumbnail: "assets/img/posters/2022-poster-les-houches.webp"
  },
  {
    id: "2021-poster-sorbonne",
    year: 2021,
    title: "Computational modelling of lanthanide spin qudits",
    event: "Paris International School on Advanced Computational Materials Science, Sorbonne Université",
    location: "Paris, France",
    award: { en: "Best poster — 2nd place", fr: "Meilleur poster — 2e place", ko: "최우수 포스터 — 2위", de: "Bestes Poster — 2. Platz" },
    pdf: "assets/pdf/posters/2021-poster-sorbonne.pdf",
    thumbnail: "assets/img/posters/2021-poster-sorbonne.webp"
  },
  {
    id: "2021-poster-joliot-curie",
    year: 2021,
    title: "Hyperfine interactions and nuclear spin qudits",
    event: "39e École Internationale Joliot-Curie",
    location: "Île d'Oléron, France",
    award: null,
    pdf: "assets/pdf/posters/2021-poster-joliot-curie.pdf",
    thumbnail: "assets/img/posters/2021-poster-joliot-curie.webp"
  },
  {
    id: "2020-poster-ksop-qmat",
    year: 2020,
    title: "Lanthanide-organic complexes for quantum information processing",
    event: "KSOP-QMat Summer School, Karlsruhe Institute of Technology",
    location: "Karlsruhe, Germany",
    award: { en: "Best poster — Materials & Photonic Devices", fr: "Meilleur poster — Matériaux & Dispositifs photoniques", ko: "최우수 포스터 — 재료 및 광소자 부문", de: "Bestes Poster — Materialien & Photonische Bauelemente" },
    pdf: "assets/pdf/posters/2020-poster-ksop-qmat.pdf",
    thumbnail: "assets/img/posters/2020-poster-ksop-qmat.webp"
  },
  {
    id: "2022-poster-egas54",
    year: 2022,
    title: "Electrical addressing of lanthanide nuclear spins",
    event: "EGAS 54 Conference",
    location: "",
    award: null,
    pdf: "assets/pdf/posters/2022-poster-egas54.pdf",
    thumbnail: "assets/img/posters/2022-poster-egas54.webp"
  }
];
