# RKSC - Materi Kuliah RKS C

Website sederhana untuk mengakses materi kuliah kelas RKS C.

[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/new/git/external?repository-url=https%3A%2F%2Fgithub.com%2Fkaylaradf%2Fper1sai)

## Struktur Proyek

```
.
├── .env (dikecualikan dari Git)
├── .vscode/ (dikecualikan dari Git)
├── index.html (Halaman utama)
├── css/
│   └── styles.css
├── js/
│   ├── data.json (Data utama untuk semester, mata kuliah, dan materi)
│   ├── motd.json (Pesan acak di footer)
│   └── scripts.js (Logika JavaScript utama)
├── favico/ (Ikon situs web)
│   └── favicon.ico
│   └── site.webmanifest
└── semesterX/ (Folder untuk setiap semester, berisi halaman `index.html` dan `course-*.html`)
    └── index.html
    └── course-algoritma-pemrograman.html
    └── ...
```

## Cara Menjalankan Proyek

Cukup buka file `index.html` di browser Anda.

## Dokumentasi Pengelolaan Data

### 1. Mengelola Data Semester, Mata Kuliah, dan Materi (`js/data.json`)

File `js/data.json` adalah sumber data utama untuk semua semester, mata kuliah, dan materi. Ini adalah array objek, di mana setiap objek merepresentasikan satu semester.

**Struktur Dasar `data.json`:**

```json
[
  {
    "semester": 1,
    "folder": "semester1",
    "courses": [
      {
        "name": "NAMA_MATA_KULIAH",
        "url": "nama-file-mata-kuliah.html",
        "overview": "Deskripsi singkat mata kuliah.",
        "materials": [
          {
            "title": "Judul Materi",
            "type": "Teori" | "Praktikum",
            "driveId": "ID_GOOGLE_DRIVE",
            "uploadDate": "Tanggal Upload"
          }
          // ... materi lainnya
        ]
      }
      // ... mata kuliah lainnya
    ]
  },
  // ... semester lainnya
]
```

#### Menambahkan Semester Baru

1.  **Buat Folder Semester Baru:** Buat folder baru di root proyek dengan nama `semesterX` (ganti `X` dengan nomor semester, misal `semester9`).
2.  **Buat File `index.html` di Folder Baru:** Salin file `semester1/index.html` ke `semesterX/index.html` yang baru Anda buat. Pastikan untuk memperbarui judul halaman jika diperlukan.
3.  **Tambahkan Entri di `data.json`:**
    *   Buka `js/data.json`.
    *   Tambahkan objek baru ke array di akhir, mengikuti format yang ada:
        ```json
        {
          "semester": X, // Ganti X dengan nomor semester
          "folder": "semesterX", // Ganti X dengan nomor semester
          "courses": [] // Awalnya kosong, akan diisi nanti
        }
        ```
    *   Pastikan ada koma `,` setelah objek semester sebelumnya jika ini bukan objek terakhir dalam array.

#### Menghapus Semester

1.  **Hapus Entri di `data.json`:**
    *   Buka `js/data.json`.
    *   Hapus objek semester yang ingin Anda hapus dari array.
2.  **Hapus Folder Semester:** Hapus folder `semesterX` yang sesuai dari root proyek Anda.

#### Menambahkan Mata Kuliah Baru

1.  **Buat File HTML Mata Kuliah:**
    *   Di dalam folder `semesterX` yang relevan (misal `semester1/`), buat file HTML baru untuk mata kuliah tersebut (misal `course-matakuliah-baru.html`).
    *   Anda bisa menyalin salah satu file `course-*.html` yang sudah ada sebagai template. Pastikan untuk memperbarui judul, tombol kembali, dan konten lainnya.
2.  **Tambahkan Entri di `data.json`:**
    *   Buka `js/data.json`.
    *   Temukan objek semester yang relevan.
    *   Di dalam array `courses` untuk semester tersebut, tambahkan objek mata kuliah baru:
        ```json
        {
          "name": "NAMA_MATA_KULIAH_BARU",
          "url": "nama-file-mata-kuliah-baru.html", // Harus sesuai dengan nama file HTML yang Anda buat
          "overview": "Deskripsi singkat tentang mata kuliah ini.",
          "materials": [] // Awalnya kosong
        }
        ```
    *   Pastikan ada koma `,` setelah objek mata kuliah sebelumnya jika ini bukan objek terakhir dalam array `courses`.

#### Menghapus Mata Kuliah

1.  **Hapus Entri di `data.json`:**
    *   Buka `js/data.json`.
    *   Temukan objek semester yang relevan.
    *   Hapus objek mata kuliah yang ingin Anda hapus dari array `courses`.
2.  **Hapus File HTML Mata Kuliah:** Hapus file `course-nama-mata-kuliah.html` yang sesuai dari folder `semesterX` yang relevan.

#### Menambahkan Materi Baru ke Mata Kuliah

1.  **Tambahkan Entri di `data.json`:**
    *   Buka `js/data.json`.
    *   Temukan objek semester dan mata kuliah yang relevan.
    *   Di dalam array `materials` untuk mata kuliah tersebut, tambahkan objek materi baru:
        ```json
        {
          "title": "Judul Materi Baru",
          "type": "Teori", // Atau "Praktikum"
          "driveId": "ID_GOOGLE_DRIVE_ANDA", // ID file dari Google Drive
          "uploadDate": "DD MMMM YYYY" // Contoh: "15 Oktober 2025"
        }
        ```
    *   Pastikan ada koma `,` setelah objek materi sebelumnya jika ini bukan objek terakhir dalam array `materials`.
    *   **Penting:** Ganti `ID_GOOGLE_DRIVE_ANDA` dengan ID sebenarnya dari file Google Drive Anda. Jika Anda tidak memiliki ID, Anda bisa menggunakan `YOUR_DRIVE_ID_HERE` sebagai placeholder, tetapi tombol download tidak akan berfungsi.

#### Menghapus Materi dari Mata Kuliah

1.  **Hapus Entri di `data.json`:**
    *   Buka `js/data.json`.
    *   Temukan objek semester dan mata kuliah yang relevan.
    *   Hapus objek materi yang ingin Anda hapus dari array `materials`.

### 2. Mengelola Tampilan Semester di Halaman Utama

Secara default, halaman utama (`index.html`) akan menampilkan semua semester yang ada di `js/data.json`. Namun, Anda dapat mengontrol semester mana yang ditampilkan dengan memodifikasi file `js/scripts.js`.

**File yang perlu diubah:** `js/scripts.js`

**Fungsi yang perlu diubah:** `loadSemesters()`

Cari bagian kode ini di dalam fungsi `loadSemesters()`:

```javascript
            data.forEach(semester => {
                // Kondisi untuk menampilkan semester tertentu
                // Contoh: if (semester.semester === 1) {
                // Contoh: if (semester.semester === 1 || semester.semester === 2) {
                // Untuk menampilkan semua, hapus atau komentari baris 'if' di bawah ini.
                if (semester.semester === 1) { // <--- Baris ini yang perlu diubah
                    console.log('Displaying Semester 1:', semester);
                    const card = document.createElement('article');
                    card.className = 'semester-card';
                    card.setAttribute('onclick', `window.location.href='${semester.folder}/'`);
                    card.innerHTML = `
                    <div class="card-content">
                        <h3 class="card-title">Semester ${semester.semester}</h3>
                        <p class="card-subtitle">${semester.courses.length} mata kuliah tersedia</p>
                        <div class="card-arrow"><i class="fas fa-arrow-right"></i></div>
                    </div>
                `;
                    semesterGrid.appendChild(card);
                }
            });
```

**Cara Mengelola Tampilan Semester:**

*   **Menampilkan Semua Semester:**
    Hapus atau komentari baris `if (semester.semester === 1) {` dan kurung kurawal penutupnya `}` yang sesuai.
    ```javascript
                data.forEach(semester => {
                    // Menampilkan semua semester
                    const card = document.createElement('article');
                    // ... kode untuk membuat kartu semester ...
                    semesterGrid.appendChild(card);
                });
    ```

*   **Menampilkan Semester 1 dan 2 Saja:**
    Ubah kondisi `if` menjadi:
    ```javascript
                if (semester.semester === 1 || semester.semester === 2) {
                    // ... kode untuk membuat kartu semester ...
                }
    ```

*   **Menampilkan Semester Tertentu (misal Semester 3 saja):**
    Ubah kondisi `if` menjadi:
    ```javascript
                if (semester.semester === 3) {
                    // ... kode untuk membuat kartu semester ...
                }
    ```

apakanlah itu biar ga apakali dia bro.
