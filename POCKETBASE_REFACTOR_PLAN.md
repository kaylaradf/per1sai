# PocketBase Refactor Plan

Tujuan:
- Preserve semua record existing di `materials` sebagai arsip semester 1.
- Extend schema agar cocok dengan frontend React saat ini.
- Tidak menghapus collection lama yang masih mengandung data penting.

## Prinsip

- Non-destruktif.
- Tidak menghapus `materials`.
- Tidak menghapus record existing.
- Menambah field baru secara nullable terlebih dahulu.
- Menambah collection baru hanya jika benar-benar belum ada padanannya.

## Perubahan yang Akan Dilakukan

### Frontend / favicon
- Salin aset dari folder `favicon/` ke `public/favicon/`
- Update `index.html` agar memakai favicon baru

### `semesters`
Tambah field:
- `name` (`text`)
- `code` (`text`)
- `order` (`number`)

Backfill:
- `name = "Semester {semester}"`
- `code = "s{semester}"`
- `order = semester`

### `courses`
Tambah field:
- `code` (`text`)
- `slug` (`text`)
- `is_active` (`bool`)

Backfill:
- `slug` dari `name`
- `is_active = true` jika belum ada

### `materials`
Tambah field:
- `semester` (`relation -> semesters`)
- `description` (`text`)
- `week_number` (`number`)
- `sort_order` (`number`)
- `published` (`bool`)
- `file_type` (`text`)

Backfill:
- `semester` diisi dari relation `course -> semester`
- `published = true`
- `sort_order` = urutan default per record
- `file_type` = ekstensi file atau fallback dari file name

### `tasks`
Tambah field:
- `semester` (`relation -> semesters`)
- `course` (`relation -> courses`)
- `description` (`text`)
- `type` (`text`)
- `due_date` (`date`)
- `attachment` (`file`)

Catatan:
- `status` lama tetap dipertahankan
- `user_id` lama dibiarkan untuk kompatibilitas legacy

### `schedule`
Tambah field:
- `semester` (`relation -> semesters`)
- `course` (`relation -> courses`)
- `start_time` (`text`)
- `end_time` (`text`)
- `lecturer` (`text`)
- `class_type` (`select: Kuliah, Praktikum`)
- `is_active` (`bool`)

Catatan:
- `time` dan `subject` lama dipertahankan dulu

### Collection baru: `announcements`
Field:
- `title`
- `slug`
- `category`
- `body`
- `semester` (`relation`, optional)
- `course` (`relation`, optional)
- `is_pinned`
- `published`
- `published_at`

### Collection baru: `site_settings`
Field:
- `site_title`
- `about_name`
- `about_role`
- `about_summary`
- `github_url`
- `blog_url`

Seed awal:
- `site_title = University Archive`
- `about_name = emaa`
- `about_role = Creator & Maintainer.`

## Yang Tidak Akan Diubah Sekarang

- `conversations`
- `img`
- `motd`
- `users`

## Post-Refactor Checks

- Snapshot schema baru disimpan lokal
- Build frontend tetap lolos
- Tidak ada record `materials` yang hilang
