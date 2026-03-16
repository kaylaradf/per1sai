# PocketBase Discovery

Inspeksi ini dilakukan dalam mode `inspect-only` pada `2026-03-16 20:02:08 UTC`.

Target PocketBase:
- URL: `https://manage.projectpop.xyz/`

Catatan keamanan:
- Credential superuser dipakai hanya untuk inspeksi live.
- Credential tidak disimpan ulang di repo ini.
- Belum ada perubahan schema atau data yang dilakukan ke server PocketBase.

## Ringkasan

PocketBase yang aktif saat ini terlihat berasal dari aplikasi "archive" lama, tetapi sebagian collection inti sudah cukup dekat dengan kebutuhan aplikasi baru ini.

Collection yang paling relevan untuk dipakai ulang:
- `semesters`
- `courses`
- `materials`
- `tasks`
- `schedule`

Collection yang tampak legacy atau tidak relevan langsung dengan aplikasi baru:
- `conversations`
- `img`
- `motd`

Collection auth yang ada:
- `_superusers`
- `users`

## Snapshot Collection

### `semesters`
- Record count: `8`
- Fields:
  - `semester` (`number`)
  - `folder` (`text`)
  - `is_active` (`bool`)
- Sample:
  - `semester = 1`
  - `folder = semester1`
  - `is_active = true`

Assessment:
- Layak dipertahankan.
- Perlu ditambah field yang lebih cocok untuk app baru:
  - `name`
  - `code`
  - `order`

### `courses`
- Record count: `8`
- Fields:
  - `name` (`text`)
  - `url` (`text`)
  - `overview` (`text`)
  - `semester` (`relation`)
- Sample:
  - `name = ALPRO`
  - `url = course-algoritma-pemrograman.html`
  - `semester -> semesters`

Assessment:
- Layak dipertahankan.
- `semester` relation sudah benar.
- Perlu tambahan:
  - `code`
  - `slug`
  - `is_active`
- `url` kemungkinan legacy dari static site lama dan perlu diputuskan apakah masih dipakai.

### `materials`
- Record count: `55`
- Fields:
  - `title` (`text`)
  - `type` (`select`)
  - `driveId` (`text`)
  - `course` (`relation`)
  - `file` (`file`)
  - `uploadDate` (`autodate`)
- Nilai `type` yang terdeteksi:
  - `Praktikum`
  - `Teori`

Assessment:
- Ini collection terbaik untuk dijadikan basis materi baru.
- Kabar baik: `type` ternyata sudah sesuai kategori konten (`Teori` / `Praktikum`), jadi tidak perlu repurpose field lain untuk ini.
- Hal yang masih kurang:
  - relation langsung ke `semester`
  - `description`
  - `week_number`
  - `sort_order`
  - `published`
  - `file_type`
  - `external_url` opsional
- `driveId` terlihat sebagai jejak integrasi lama dan kemungkinan bisa dipensiunkan setelah migrasi final.

### `tasks`
- Record count: `1`
- Fields:
  - `user_id` (`number`)
  - `title` (`text`)
  - `priority` (`text`)
  - `status` (`text`)
- Nilai yang terdeteksi:
  - `status = pending`
  - `priority = medium`

Assessment:
- Collection bisa dipakai ulang, tetapi struktur sekarang belum cukup untuk UI baru.
- Kekurangan paling penting:
  - belum ada `due_date`
  - belum ada relation ke `course`
  - belum ada relation ke `semester`
  - belum ada `description`
  - belum ada `type`
  - belum ada `attachment`
- `user_id` terlihat legacy dan tidak cocok dengan flow admin dashboard yang sekarang direncanakan.

### `schedule`
- Record count: `11`
- Fields:
  - `day_of_week` (`number`)
  - `time` (`text`)
  - `subject` (`text`)
  - `room` (`text`)
- Sample:
  - `day_of_week = 0`
  - `subject = Libur`
  - `time = N/A`

Assessment:
- Bisa dipakai ulang, tetapi masih terlalu flat.
- Perlu ditambah:
  - `course` (`relation`)
  - `semester` (`relation`, opsional kalau bisa diturunkan dari course)
  - `start_time`
  - `end_time`
  - `lecturer`
  - `class_type` (`Kuliah` / `Praktikum`)
  - `is_active`

### `motd`
- Record count: `11`
- Fields:
  - `message` (`text`)

Assessment:
- Terlalu sempit untuk kebutuhan `announcements`.
- Bisa dipertahankan hanya jika masih ingin ada banner tunggal / message of the day.
- Untuk pengumuman aplikasi baru, lebih tepat buat collection baru `announcements`.

### `img`
- Record count: `5`
- Fields:
  - `field` (`file`)

Assessment:
- Tampak sebagai collection utilitas lama.
- Tidak perlu untuk desain aplikasi baru jika file utama sudah disimpan pada collection domain seperti `materials`.

### `conversations`
- Record count: `102`
- Fields:
  - `user_id`
  - `role`
  - `content`
  - `image_url`

Assessment:
- Tidak relevan dengan archive akademik ini.
- Bisa dianggap legacy dan dibiarkan terpisah dari fitur baru.

### `users`
- Record count: `0`
- Fields:
  - auth default PocketBase
  - `name`
  - `avatar`

Assessment:
- Belum dipakai.
- Bisa dipertahankan kalau nanti ada kebutuhan login user publik.
- Tidak mendesak untuk admin dashboard internal karena superuser PocketBase sudah cukup untuk tahap awal.

## Rekomendasi Arah

Rekomendasi paling aman adalah `reuse + extend`, bukan redesign total dari nol.

### Pertahankan dan rapikan
- `semesters`
- `courses`
- `materials`
- `tasks`
- `schedule`

### Tambah collection baru
- `announcements`
- `site_settings`

### Anggap legacy dulu
- `conversations`
- `img`
- `motd`

## Schema Final yang Paling Masuk Akal

### Tetap pakai
- `semesters`
- `courses`
- `materials`
- `tasks`
- `schedule`

### Tambahkan
- `announcements`
  - `title`
  - `slug`
  - `category`
  - `body`
  - `semester` (opsional relation)
  - `course` (opsional relation)
  - `is_pinned`
  - `published`
  - `published_at`

- `site_settings`
  - `site_title`
  - `about_name`
  - `about_role`
  - `about_summary`
  - `github_url`
  - `blog_url`

## Keputusan yang Masih Perlu Dikunci

Sebelum setup, kita perlu sepakati:

1. Apakah `courses.url` masih ingin dipakai?
   - Jika tidak, field ini sebaiknya dipensiunkan.

2. Apakah `materials.driveId` masih punya nilai operasional?
   - Jika hanya sisa sistem lama, kita biarkan sementara lalu hapus belakangan.

3. Apakah `motd` ingin tetap hidup sebagai satu banner global?
   - Jika tidak, seluruh fungsi announcement pindah ke collection baru `announcements`.

4. Apakah perlu login user publik?
   - Jika tidak, `users` bisa diabaikan dulu.

## Rencana Tahap Berikutnya

Jika Anda setuju dengan arah ini, tahap berikutnya:

1. Finalisasi schema target per collection.
2. Login lagi ke PocketBase dalam mode setup.
3. Tambah field yang kurang pada collection lama.
4. Buat collection baru:
   - `announcements`
   - `site_settings`
5. Baru setelah itu mulai mapping frontend React ini ke PocketBase.

## Status Saat Ini

- PocketBase live berhasil diinspeksi.
- Tidak ada perubahan yang diterapkan.
- Repo lokal ini sudah punya dokumen audit awal untuk referensi diskusi berikutnya.
