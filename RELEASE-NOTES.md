# Engineer Flow - Release Notes

Language: [English](#english) | [Bahasa Indonesia](#bahasa-indonesia)

<a id="english"></a>

<details open>
<summary><strong>English</strong></summary>

## v0.2.0 (2026-08-24)

Engineer Flow v0.2.0 improves sparse specialist routing with project-aware external skill discovery and reliable explicit skill-name matching while preserving the maximum 0-2 specialist architecture.

GitHub release body: [docs/releases/v0.2.0.md](docs/releases/v0.2.0.md).

### Added

- Project-evidence-aware external Agent Skill retrieval.
- Bounded inspection of common project manifests (`package.json`, `composer.json`, `pyproject.toml`, `requirements*.txt`, `pom.xml`, Gradle, `go.mod`, `Cargo.toml`, `pubspec.yaml`, `Gemfile`).
- External skill identity matching derived from the installed skill itself, with no technology hardcoding and no dependency-to-framework mapping tables.
- Retrieval diagnostics for task intent, project evidence, and external matches.
- Symmetric explicit skill-name delimiter normalization for `-`, `_`, `:`, and spaces.
- Executable routing calibration benchmark (`npm run benchmark:routing`).
- Fresh heldout evaluation infrastructure with group metrics and retrieval diagnostics.
- Focused normalization regression tests (`npm run test:normalization`).

### Changed

- External specialists can now be discovered even when the user task does not explicitly name the framework/technology, when relevant project evidence exists.
- Explicit names using `-`, `_`, `:`, or spaces now compare consistently through one shared normalizer.
- Sparse specialist cap remains maximum 2 per task.
- Internal core capabilities remain framework/language agnostic.
- Persistent memory infrastructure remains separate from specialist slots.
- Mandatory post-development security review remains unchanged.

### Benchmark Summary

Calibration V4 (Candidate J):

```text
PRIMARY_ACCURACY=83.33%
EXTERNAL_REQUIRED_ACCURACY=100%
FALSE_EXTERNAL_ACTIVATION_COUNT=0
MAX_SPECIALISTS=2
```

Fresh Heldout V5:

```text
MODE_ACCURACY=100%
PRIMARY_ACCURACY=100%
SUPPORT_ACCURACY=95%
EXACT_ROUTE_ACCURACY=95%

EXPLICIT_NORMALIZED_EXTERNAL_ACCURACY=100%
PROJECT_EVIDENCE_REGRESSION_ACCURACY=100%
PARTIAL_NAME_NEGATIVE_PASS_RATE=100%
ROBUSTNESS_PASS_RATE=100%

FALSE_EXTERNAL_ACTIVATION_COUNT=0
RESOLVER_CRASH_COUNT=0
MAX_SPECIALISTS_INVARIANT=PASS
```

Heldout-v4 and heldout-v5 are burned evaluation datasets and are not reusable as fresh final evidence.

These numbers do not claim that routing is universally perfect. They show that project-aware retrieval and exact-name normalization generalize while sparse activation and false-activation protection hold.

### Known Limitations

- Morphology and singular/plural lexical mismatches can still zero out otherwise relevant matches.
- Skill body text is not currently part of ordinary relevance scoring.
- Broad headings may sometimes over-capture relevance, especially for `security`.
- Support-specialist selection can still vary on ambiguous cross-cutting tasks.

These are planned research areas for a future version. They were documented deliberately and were not silently changed in v0.2.0.

### Validation

```bash
npm run validate
npm run test:normalization
npm run benchmark:routing
```

Burned heldout datasets were not rerun as fresh evidence during release preparation.

</details>

<a id="bahasa-indonesia"></a>

<details>
<summary><strong>Bahasa Indonesia</strong></summary>

## v0.2.0 (2026-08-24)

Engineer Flow v0.2.0 meningkatkan sparse specialist routing dengan project-aware external skill discovery dan explicit skill-name matching yang andal, sambil tetap mempertahankan arsitektur maksimum 0-2 specialist.

Body release GitHub: [docs/releases/v0.2.0.md](docs/releases/v0.2.0.md).

### Ditambahkan

- Project-evidence-aware external Agent Skill retrieval.
- Inspeksi bounded untuk manifest project umum (`package.json`, `composer.json`, `pyproject.toml`, `requirements*.txt`, `pom.xml`, Gradle, `go.mod`, `Cargo.toml`, `pubspec.yaml`, `Gemfile`).
- Pencocokan identitas external skill yang diturunkan dari skill terinstall itu sendiri, tanpa technology hardcoding dan tanpa tabel mapping dependency-ke-framework.
- Diagnostik retrieval untuk task intent, project evidence, dan external matches.
- Normalisasi simetris untuk pemisah nama skill eksplisit: `-`, `_`, `:`, dan spasi.
- Benchmark kalibrasi routing yang executable (`npm run benchmark:routing`).
- Infrastruktur evaluasi heldout fresh dengan metrik per-grup dan diagnostik retrieval.
- Tes regresi normalisasi yang fokus (`npm run test:normalization`).

### Diubah

- Specialist eksternal sekarang bisa ditemukan meskipun task tidak menyebut nama framework/technology secara eksplisit, selama project evidence yang relevan tersedia.
- Nama eksplisit dengan `-`, `_`, `:`, atau spasi sekarang dibandingkan secara konsisten lewat satu normalizer bersama.
- Batas sparse specialist tetap maksimum 2 per task.
- Capability inti internal tetap framework/language agnostic.
- Infrastructure persistent memory tetap terpisah dari slot specialist.
- Mandatory post-development security review tidak berubah.

### Ringkasan Benchmark

Calibration V4 (Candidate J):

```text
PRIMARY_ACCURACY=83.33%
EXTERNAL_REQUIRED_ACCURACY=100%
FALSE_EXTERNAL_ACTIVATION_COUNT=0
MAX_SPECIALISTS=2
```

Fresh Heldout V5:

```text
MODE_ACCURACY=100%
PRIMARY_ACCURACY=100%
SUPPORT_ACCURACY=95%
EXACT_ROUTE_ACCURACY=95%

EXPLICIT_NORMALIZED_EXTERNAL_ACCURACY=100%
PROJECT_EVIDENCE_REGRESSION_ACCURACY=100%
PARTIAL_NAME_NEGATIVE_PASS_RATE=100%
ROBUSTNESS_PASS_RATE=100%

FALSE_EXTERNAL_ACTIVATION_COUNT=0
RESOLVER_CRASH_COUNT=0
MAX_SPECIALISTS_INVARIANT=PASS
```

Heldout-v4 dan heldout-v5 adalah dataset evaluasi yang sudah burned dan tidak boleh dipakai ulang sebagai fresh final evidence.

Angka-angka ini tidak mengklaim bahwa routing sempurna universal. Yang ditunjukkan adalah mekanisme project-aware retrieval dan exact-name normalization terbukti generalisasi, sambil sparse activation dan perlindungan false activation tetap terjaga.

### Keterbatasan yang Diketahui

- Ketidakcocokan morfologi serta bentuk tunggal/jamak masih bisa membuat pencocokan leksikal relevan menjadi nol.
- Isi body skill saat ini belum menjadi bagian dari scoring relevansi biasa.
- Heading yang sangat luas kadang over-capture relevance, terutama untuk `security`.
- Pemilihan support specialist masih bisa bervariasi pada task lintas domain yang ambigu.

Ini adalah area riset yang direncanakan untuk versi berikutnya. Semuanya didokumentasikan secara sengaja dan tidak diubah diam-diam pada v0.2.0.

### Validasi

```bash
npm run validate
npm run test:normalization
npm run benchmark:routing
```

Dataset heldout yang burned tidak dijalankan ulang sebagai fresh evidence selama persiapan release ini.

</details>
