import { db } from "./index";
import { users, services, news, programs, registrations, schedules, districtHealthData, healthProgramCoverage, healthDiseaseData, puskesmas, healthStatistics, generalInfo, roles } from "./schema";
import "dotenv/config";

function generateId(): string {
  return crypto.randomUUID();
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .trim();
}

async function seed() {
  console.log("🌱 Starting seed...");

  // Clear existing data
  console.log("Clearing existing data...");
  await db.delete(healthStatistics);
  await db.delete(districtHealthData);
  await db.delete(healthProgramCoverage);
  await db.delete(healthDiseaseData);
  await db.delete(schedules);
  await db.delete(registrations);
  await db.delete(programs);
  await db.delete(news);
  await db.delete(services);
  await db.delete(users);
  await db.delete(puskesmas);
  await db.delete(generalInfo);
  await db.delete(roles);

  // Seed Roles
  console.log("Seeding roles...");
  const rolesData = [
    {
      id: generateId(),
      name: "Administrator",
      slug: "admin",
      description: "Akses penuh ke semua fitur sistem.",
    },
    {
      id: generateId(),
      name: "Operator Dinkes",
      slug: "operator",
      description: "Akses kelola data kecuali master dan pengaturan pengguna.",
    },
    {
      id: generateId(),
      name: "Puskesmas",
      slug: "puskesmas",
      description: "Akses kelola data spesifik puskesmas.",
    },
  ];
  await db.insert(roles).values(rolesData);

  // Get role IDs for reference
  const adminRole = rolesData.find(r => r.slug === "admin");
  const operatorRole = rolesData.find(r => r.slug === "operator");
  const puskesmasRole = rolesData.find(r => r.slug === "puskesmas");

  // Seed Master Puskesmas
  console.log("Seeding puskesmas...");
  const puskesmasData = [
    { id: generateId(), districtName: "Agandugume", name: "Puskesmas Agandugume", code: "PKM-AGD", sortOrder: 0, status: "active" as const },
    { id: generateId(), districtName: "Amungkalpia", name: "Puskesmas Amungkalpia", code: "PKM-AMK", sortOrder: 1, status: "active" as const },
    { id: generateId(), districtName: "Beoga", name: "Puskesmas Beoga", code: "PKM-BGO", sortOrder: 2, status: "active" as const },
    { id: generateId(), districtName: "Beoga Barat", name: "Puskesmas Beoga Barat", code: "PKM-BGB", sortOrder: 3, status: "active" as const },
    { id: generateId(), districtName: "Beoga Timur", name: "Puskesmas Beoga Timur", code: "PKM-BGT", sortOrder: 4, status: "active" as const },
    { id: generateId(), districtName: "Bina", name: "Puskesmas Bina", code: "PKM-BNA", sortOrder: 5, status: "active" as const },
    { id: generateId(), districtName: "Dervos", name: "Puskesmas Dervos", code: "PKM-DVS", sortOrder: 6, status: "active" as const },
    { id: generateId(), districtName: "Doufo", name: "Puskesmas Doufo", code: "PKM-DFO", sortOrder: 7, status: "active" as const },
    { id: generateId(), districtName: "Erelmakawia", name: "Puskesmas Erelmakawia", code: "PKM-ERM", sortOrder: 8, status: "active" as const },
    { id: generateId(), districtName: "Gome", name: "Puskesmas Gome", code: "PKM-GME", sortOrder: 9, status: "active" as const },
    { id: generateId(), districtName: "Gome Utara", name: "Puskesmas Gome Utara", code: "PKM-GMU", sortOrder: 10, status: "active" as const },
    { id: generateId(), districtName: "Ilaga", name: "Puskesmas Ilaga", code: "PKM-ILG", sortOrder: 11, status: "active" as const },
    { id: generateId(), districtName: "Ilaga", name: "Puskesmas Ilaga Utama", code: "PKM-ILG2", sortOrder: 12, status: "active" as const },
    { id: generateId(), districtName: "Ilaga Utara", name: "Puskesmas Ilaga Utara", code: "PKM-ILU", sortOrder: 13, status: "active" as const },
    { id: generateId(), districtName: "Kembru", name: "Puskesmas Kembru", code: "PKM-KBR", sortOrder: 14, status: "active" as const },
    { id: generateId(), districtName: "Lambewi", name: "Puskesmas Lambewi", code: "PKM-LBW", sortOrder: 15, status: "active" as const },
    { id: generateId(), districtName: "Mabugi", name: "Puskesmas Mabugi", code: "PKM-MBG", sortOrder: 16, status: "active" as const },
    { id: generateId(), districtName: "Mage'abume", name: "Puskesmas Mage'abume", code: "PKM-MGB", sortOrder: 17, status: "active" as const },
    { id: generateId(), districtName: "Ogamanim", name: "Puskesmas Ogamanim", code: "PKM-OGM", sortOrder: 18, status: "active" as const },
    { id: generateId(), districtName: "Omukia", name: "Puskesmas Omukia", code: "PKM-OMK", sortOrder: 19, status: "active" as const },
    { id: generateId(), districtName: "Oneri", name: "Puskesmas Oneri", code: "PKM-ONR", sortOrder: 20, status: "active" as const },
    { id: generateId(), districtName: "Pogoma", name: "Puskesmas Pogoma", code: "PKM-PGM", sortOrder: 21, status: "active" as const },
    { id: generateId(), districtName: "Sinak", name: "Puskesmas Sinak", code: "PKM-SNK", sortOrder: 22, status: "active" as const },
    { id: generateId(), districtName: "Sinak Barat", name: "Puskesmas Sinak Barat", code: "PKM-SNB", sortOrder: 23, status: "active" as const },
    { id: generateId(), districtName: "Wangbe", name: "Puskesmas Wangbe", code: "PKM-WGB", sortOrder: 24, status: "active" as const },
    { id: generateId(), districtName: "Yugumuak", name: "Puskesmas Yugumuak", code: "PKM-YGM", sortOrder: 25, status: "active" as const },
  ];
  await db.insert(puskesmas).values(puskesmasData);

  const ilagaPuskesmas = puskesmasData.find(p => p.name === "Puskesmas Ilaga");

  // Seed Users
  console.log("Seeding users...");
  if (!adminRole || !operatorRole || !puskesmasRole) throw new Error("Roles not initialized properly");

  const usersData = [
    {
      id: generateId(),
      name: "Administrator Dinkes",
      email: "admin@dinkes.go.id",
      password: "password123",
      roleId: adminRole.id,
      status: "active" as const,
      avatar: null,
      lastLogin: new Date(),
    },
    {
      id: generateId(),
      name: "Operator Dinkes",
      email: "operator@dinkes.go.id",
      password: "password123",
      roleId: operatorRole.id,
      status: "active" as const,
      avatar: null,
      lastLogin: new Date(),
    },
    {
      id: generateId(),
      name: "Admin Puskesmas Ilaga",
      email: "ilaga@puskesmas.go.id",
      password: "password123",
      roleId: puskesmasRole.id,
      puskesmasId: ilagaPuskesmas?.id,
      status: "active" as const,
      avatar: null,
      lastLogin: new Date("2024-01-14"),
    },
  ];
  await db.insert(users).values(usersData);

  // Seed Services
  console.log("Seeding services...");
  const servicesData = [
    {
      id: generateId(),
      name: "Pemeriksaan Ibu Hamil",
      slug: "pemeriksaan-ibu-hamil",
      description: "Layanan pemeriksaan kehamilan rutin meliputi USG, pengecekan tekanan darah, dan konsultasi dengan bidan. Kami menyediakan pelayanan ANC (Antenatal Care) yang komprehensif untuk memastikan kesehatan ibu dan janin selama masa kehamilan.",
      category: "Kesehatan Ibu & Anak",
      image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800",
      location: "Poli KIA",
      schedule: "Senin - Jumat, 08:00 - 12:00",
      puskesmasId: ilagaPuskesmas?.id,
      status: "active" as const,
    },
    {
      id: generateId(),
      name: "Imunisasi Anak",
      slug: "imunisasi-anak",
      description: "Program imunisasi lengkap untuk anak usia 0-5 tahun sesuai jadwal imunisasi nasional. Meliputi vaksin BCG, Polio, DPT, Hepatitis B, Campak, dan vaksin lainnya dengan kualitas terjamin.",
      category: "Kesehatan Ibu & Anak",
      image: "https://images.unsplash.com/photo-1632053002928-1919605ee6f7?w=800",
      location: "Poli Anak",
      schedule: "Selasa & Kamis, 08:00 - 11:00",
      puskesmasId: ilagaPuskesmas?.id,
      status: "active" as const,
    },
    {
      id: generateId(),
      name: "Konsultasi Gizi",
      slug: "konsultasi-gizi",
      description: "Konsultasi dengan ahli gizi untuk penanganan masalah gizi pada balita, ibu hamil, dan masyarakat umum. Layanan meliputi penilaian status gizi, penyusunan menu diet, dan edukasi gizi seimbang.",
      category: "Gizi",
      image: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800",
      location: "Poli Gizi",
      schedule: "Senin, Rabu, Jumat, 09:00 - 12:00",
      puskesmasId: ilagaPuskesmas?.id,
      status: "active" as const,
    },
    {
      id: generateId(),
      name: "Posyandu Lansia",
      slug: "posyandu-lansia",
      description: "Pemeriksaan kesehatan rutin untuk lansia meliputi pengecekan tekanan darah, gula darah, kolesterol, dan senam lansia. Program ini bertujuan meningkatkan kualitas hidup lansia.",
      category: "Lansia",
      image: "https://images.unsplash.com/photo-1447452001602-7090c7ab2db3?w=800",
      location: "Balai Desa / Puskesmas",
      schedule: "Rabu, 08:00 - 11:00",
      puskesmasId: ilagaPuskesmas?.id,
      status: "active" as const,
    },
  ];
  await db.insert(services).values(servicesData);

  // Seed News
  console.log("Seeding news...");
  const newsData = [
    {
      id: generateId(),
      title: "Jadwal Posyandu Bulan Januari 2024",
      slug: "jadwal-posyandu-bulan-januari-2024",
      excerpt: "Berikut jadwal lengkap kegiatan Posyandu di wilayah kerja Puskesmas untuk bulan Januari 2024.",
      content: `<h2>Jadwal Posyandu Januari 2024</h2>
<p>Puskesmas menyampaikan jadwal kegiatan Posyandu untuk bulan Januari 2024. Kegiatan akan dilaksanakan di seluruh pos yang tersebar di wilayah kerja Puskesmas.</p>
<h3>Jadwal per Wilayah:</h3>
<ul>
<li><strong>Kelurahan A:</strong> Setiap Senin minggu pertama dan ketiga</li>
<li><strong>Kelurahan B:</strong> Setiap Selasa minggu kedua dan keempat</li>
<li><strong>Kelurahan C:</strong> Setiap Rabu minggu pertama dan ketiga</li>
</ul>
<p>Masyarakat diharapkan membawa KMS (Kartu Menuju Sehat) dan buku KIA saat mengunjungi Posyandu.</p>`,
      category: "Pengumuman",
      image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800",
      author: "Admin Puskesmas",
      status: "published" as const,
      puskesmasId: ilagaPuskesmas?.id,
      publishedAt: new Date("2024-01-10"),
    },
    {
      id: generateId(),
      title: "Tips Menjaga Kesehatan di Musim Hujan",
      slug: "tips-menjaga-kesehatan-di-musim-hujan",
      excerpt: "Musim hujan tiba, saatnya meningkatkan kewaspadaan terhadap penyakit. Simak tips menjaga kesehatan berikut.",
      content: `<h2>Menjaga Kesehatan di Musim Hujan</h2>
<p>Musim hujan seringkali membawa berbagai penyakit seperti flu, demam berdarah, dan diare. Berikut tips untuk tetap sehat:</p>
<h3>1. Jaga Kebersihan</h3>
<p>Cuci tangan dengan sabun setelah beraktivitas. Pastikan makanan dan minuman yang dikonsumsi bersih dan higienis.</p>
<h3>2. Tingkatkan Daya Tahan Tubuh</h3>
<p>Konsumsi makanan bergizi seimbang, vitamin C, dan istirahat yang cukup.</p>
<h3>3. Cegah Genangan Air</h3>
<p>Lakukan 3M Plus untuk mencegah demam berdarah: Menguras, Menutup, dan Mendaur ulang barang bekas.</p>`,
      category: "Kesehatan",
      image: "https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=800",
      author: "Dr. Siti Rahayu",
      status: "published" as const,
      puskesmasId: ilagaPuskesmas?.id,
      publishedAt: new Date("2024-01-08"),
    },
    {
      id: generateId(),
      title: "Program Imunisasi Gratis untuk Balita",
      slug: "program-imunisasi-gratis-untuk-balita",
      excerpt: "Puskesmas menyelenggarakan program imunisasi gratis untuk balita. Pastikan anak Anda mendapat perlindungan lengkap.",
      content: `<h2>Imunisasi Gratis untuk Balita</h2>
<p>Dalam rangka meningkatkan cakupan imunisasi, Puskesmas menyelenggarakan program imunisasi gratis untuk seluruh balita di wilayah kerja.</p>
<h3>Jenis Imunisasi yang Tersedia:</h3>
<ul>
<li>BCG (Bacillus Calmette-Guerin)</li>
<li>Polio</li>
<li>DPT-HB-Hib</li>
<li>Campak Rubella</li>
<li>IPV (Inactivated Polio Vaccine)</li>
</ul>
<h3>Persyaratan:</h3>
<ol>
<li>Membawa KMS atau buku KIA</li>
<li>Membawa kartu identitas orang tua</li>
<li>Anak dalam kondisi sehat</li>
</ol>`,
      category: "Program",
      image: "https://images.unsplash.com/photo-1632053002928-1919605ee6f7?w=800",
      author: "Tim Promkes",
      status: "published" as const,
      puskesmasId: ilagaPuskesmas?.id,
      publishedAt: new Date("2024-01-05"),
    },
    {
      id: generateId(),
      title: "Sosialisasi Pencegahan Stunting",
      slug: "sosialisasi-pencegahan-stunting",
      excerpt: "Puskesmas mengadakan sosialisasi tentang pencegahan stunting untuk para kader dan ibu hamil di wilayah kerja.",
      content: `<h2>Cegah Stunting Sejak Dini</h2>
<p>Stunting merupakan masalah gizi kronis yang perlu ditangani bersama. Puskesmas aktif melakukan sosialisasi kepada masyarakat.</p>
<h3>Apa itu Stunting?</h3>
<p>Stunting adalah kondisi gagal tumbuh pada anak balita akibat kekurangan gizi kronis terutama pada 1000 Hari Pertama Kehidupan (HPK).</p>
<h3>Cara Pencegahan:</h3>
<ul>
<li>Pemenuhan gizi seimbang sejak hamil</li>
<li>ASI eksklusif 6 bulan pertama</li>
<li>MPASI berkualitas mulai usia 6 bulan</li>
<li>Pemantauan tumbuh kembang rutin</li>
</ul>`,
      category: "Edukasi",
      image: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800",
      author: "Ahli Gizi",
      status: "published" as const,
      puskesmasId: ilagaPuskesmas?.id,
      publishedAt: new Date("2024-01-03"),
    },
  ];
  await db.insert(news).values(newsData);

  // Seed Programs
  console.log("Seeding programs...");
  const programsData = [
    {
      id: generateId(),
      name: "Posyandu Balita",
      slug: "posyandu-balita",
      description: "Program pemantauan tumbuh kembang balita secara rutin setiap bulan. Kegiatan meliputi penimbangan, pengukuran tinggi badan, pemberian vitamin A, dan konsultasi gizi.",
      category: "Kesehatan Ibu & Anak",
      icon: "Baby",
      image: "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=800",
      participants: 1250,
      target: 1500,
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-12-31"),
      puskesmasId: ilagaPuskesmas?.id,
      status: "active" as const,
    },
    {
      id: generateId(),
      name: "Pencegahan Stunting",
      slug: "pencegahan-stunting",
      description: "Program intervensi gizi untuk mencegah stunting pada balita. Meliputi pemberian makanan tambahan, edukasi gizi seimbang, dan pemantauan status gizi.",
      category: "Gizi",
      icon: "TrendingUp",
      image: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800",
      participants: 320,
      target: 400,
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-12-31"),
      puskesmasId: ilagaPuskesmas?.id,
      status: "active" as const,
    },
    {
      id: generateId(),
      name: "Imunisasi Lengkap",
      slug: "imunisasi-lengkap",
      description: "Program imunisasi dasar lengkap untuk bayi dan balita sesuai jadwal imunisasi nasional. Bertujuan memberikan kekebalan terhadap penyakit yang dapat dicegah dengan imunisasi.",
      category: "Imunisasi",
      icon: "Shield",
      image: "https://images.unsplash.com/photo-1632053002928-1919605ee6f7?w=800",
      participants: 890,
      target: 1000,
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-12-31"),
      puskesmasId: ilagaPuskesmas?.id,
      status: "active" as const,
    },
    {
      id: generateId(),
      name: "Prolanis (Diabetes & Hipertensi)",
      slug: "prolanis-diabetes-hipertensi",
      description: "Program pengelolaan penyakit kronis untuk penderita diabetes dan hipertensi. Kegiatan meliputi senam, edukasi kesehatan, dan pemeriksaan rutin.",
      category: "Penyakit Kronis",
      icon: "Heart",
      image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800",
      participants: 450,
      target: 500,
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-12-31"),
      puskesmasId: ilagaPuskesmas?.id,
      status: "active" as const,
    },
    {
      id: generateId(),
      name: "Kesehatan Jiwa Masyarakat",
      slug: "kesehatan-jiwa-masyarakat",
      description: "Program deteksi dini dan penanganan gangguan kesehatan jiwa di masyarakat. Meliputi konseling, penyuluhan, dan pendampingan ODGJ.",
      category: "Kesehatan Jiwa",
      icon: "Brain",
      image: "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=800",
      participants: 85,
      target: 150,
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-12-31"),
      puskesmasId: ilagaPuskesmas?.id,
      status: "active" as const,
    },
    {
      id: generateId(),
      name: "Gerakan Masyarakat Sehat (GERMAS)",
      slug: "gerakan-masyarakat-sehat",
      description: "Program promosi kesehatan untuk meningkatkan kesadaran masyarakat akan pola hidup sehat. Meliputi aktivitas fisik, konsumsi sayur buah, dan cek kesehatan berkala.",
      category: "Promosi Kesehatan",
      icon: "Users",
      image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800",
      participants: 2100,
      target: 3000,
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-12-31"),
      puskesmasId: ilagaPuskesmas?.id,
      status: "active" as const,
    },
  ];
  await db.insert(programs).values(programsData);

  // Seed Registrations
  console.log("Seeding registrations...");
  const registrationsData = [
    {
      id: generateId(),
      queueNumber: "SSJ/PEM/20240120/001",
      name: "Ahmad Rizki Pratama",
      nik: "3201234567890001",
      phone: "081234567890",
      email: "ahmad.rizki@email.com",
      address: "Jl. Merdeka No. 45, RT 01/RW 02, Kelurahan A",
      service: "Pemeriksaan Umum",
      puskesmasId: ilagaPuskesmas?.id,
      appointmentDate: new Date("2024-01-20"),
      appointmentTime: "08:00",
      complaint: "Demam dan batuk selama 3 hari",
      status: "confirmed" as const,
    },
    {
      id: generateId(),
      queueNumber: "SSJ/PEM/20240121/001",
      name: "Siti Fatimah",
      nik: "3201234567890002",
      phone: "081234567891",
      email: "siti.fatimah@email.com",
      address: "Jl. Sudirman No. 12, RT 03/RW 01, Kelurahan B",
      service: "Pemeriksaan Ibu Hamil",
      puskesmasId: ilagaPuskesmas?.id,
      appointmentDate: new Date("2024-01-21"),
      appointmentTime: "09:00",
      complaint: "Kontrol kehamilan bulan ke-7",
      status: "pending" as const,
    },
    {
      id: generateId(),
      queueNumber: "SSJ/PEM/20240119/001",
      name: "Budi Hartono",
      nik: "3201234567890003",
      phone: "081234567892",
      email: null,
      address: "Jl. Pahlawan No. 8, RT 02/RW 03, Kelurahan C",
      service: "Pemeriksaan Gigi",
      puskesmasId: ilagaPuskesmas?.id,
      appointmentDate: new Date("2024-01-19"),
      appointmentTime: "10:00",
      complaint: "Gigi berlubang dan nyeri",
      status: "completed" as const,
    },
    {
      id: generateId(),
      queueNumber: "SSJ/IMU/20240122/001",
      name: "Dewi Lestari",
      nik: "3201234567890004",
      phone: "081234567893",
      email: "dewi.lestari@email.com",
      address: "Jl. Diponegoro No. 23, RT 04/RW 02, Kelurahan A",
      service: "Imunisasi Anak",
      puskesmasId: ilagaPuskesmas?.id,
      appointmentDate: new Date("2024-01-22"),
      appointmentTime: "08:30",
      complaint: "Imunisasi DPT untuk anak usia 2 bulan",
      status: "pending" as const,
    },
    {
      id: generateId(),
      queueNumber: "SSJ/KON/20240118/001",
      name: "Agus Setiawan",
      nik: "3201234567890005",
      phone: "081234567894",
      email: null,
      address: "Jl. Ahmad Yani No. 56, RT 01/RW 04, Kelurahan D",
      service: "Konsultasi Gizi",
      puskesmasId: ilagaPuskesmas?.id,
      appointmentDate: new Date("2024-01-18"),
      appointmentTime: "11:00",
      complaint: "Konsultasi diet untuk diabetes",
      status: "cancelled" as const,
    },
    {
      id: generateId(),
      queueNumber: "SSJ/PEM/20240123/001",
      name: "Rina Wulandari",
      nik: "3201234567890006",
      phone: "081234567895",
      email: "rina.wulandari@email.com",
      address: "Jl. Gatot Subroto No. 34, RT 05/RW 01, Kelurahan B",
      service: "Pemeriksaan Umum",
      puskesmasId: ilagaPuskesmas?.id,
      appointmentDate: new Date("2024-01-23"),
      appointmentTime: "09:30",
      complaint: "Pusing dan mual",
      status: "confirmed" as const,
    },
  ];
  await db.insert(registrations).values(registrationsData);

  // District Names (25 Distrik Kabupaten Puncak)
  const districtNames = [
    "Agandugume", "Amungkalpia", "Beoga", "Beoga Barat", "Beoga Timur",
    "Bina", "Dervos", "Doufo", "Erelmakawia", "Gome", "Gome Utara",
    "Ilaga", "Ilaga Utara", "Kembru", "Lambewi", "Mabugi", "Mage'abume",
    "Ogamanim", "Omukia", "Oneri", "Pogoma", "Sinak", "Sinak Barat",
    "Wangbe", "Yugumuak",
  ];

  // Seed Schedules
  console.log("Seeding schedules...");
  const schedulesData = [
    {
      id: generateId(),
      title: "Posyandu Balita Kampung Kago",
      type: "posyandu" as const,
      district: "Ilaga",
      location: "Balai Kampung Kago",
      address: "Jl. Poros Ilaga",
      date: new Date("2024-01-25"),
      startTime: "08:00",
      endTime: "11:00",
      capacity: 50,
      registered: 35,
      officer: "Bidan Dewi Kartika",
      description: "Kegiatan Posyandu rutin untuk balita di wilayah Kampung Kago, Distrik Ilaga",
      status: "upcoming" as const,
      puskesmasId: ilagaPuskesmas?.id,
    },
    {
      id: generateId(),
      title: "Imunisasi Campak Rubella",
      type: "imunisasi" as const,
      district: "Ilaga",
      location: "Puskesmas Ilaga",
      address: "Jl. Kesehatan No. 1, Ilaga",
      date: new Date("2024-01-26"),
      startTime: "08:00",
      endTime: "12:00",
      capacity: 100,
      registered: 78,
      officer: "Dr. Siti Rahayu",
      description: "Program imunisasi campak rubella untuk anak usia 9 bulan - 5 tahun",
      status: "upcoming" as const,
      puskesmasId: ilagaPuskesmas?.id,
    },
    {
      id: generateId(),
      title: "Penyuluhan Pencegahan Malaria",
      type: "penyuluhan" as const,
      district: "Beoga",
      location: "Aula Distrik Beoga",
      address: "Jl. Distrik Beoga",
      date: new Date("2024-01-24"),
      startTime: "09:00",
      endTime: "11:00",
      capacity: 75,
      registered: 60,
      officer: "Sanitarian Ahmad Fauzi",
      description: "Sosialisasi pencegahan malaria dan pembagian kelambu",
      status: "upcoming" as const,
      puskesmasId: ilagaPuskesmas?.id,
    },
    {
      id: generateId(),
      title: "Pemeriksaan Kesehatan Lansia",
      type: "pemeriksaan" as const,
      district: "Sinak",
      location: "Puskesmas Sinak",
      address: "Jl. Poros Sinak",
      date: new Date("2024-01-23"),
      startTime: "08:00",
      endTime: "10:00",
      capacity: 40,
      registered: 40,
      officer: "Perawat Rina Susanti",
      description: "Pemeriksaan tekanan darah, gula darah, dan kolesterol untuk lansia",
      status: "ongoing" as const,
      puskesmasId: ilagaPuskesmas?.id,
    },
    {
      id: generateId(),
      title: "Vaksinasi COVID-19 Booster",
      type: "vaksinasi" as const,
      district: "Ilaga Utara",
      location: "Pustu Ilaga Utara",
      address: "Kampung Mayuberi",
      date: new Date("2024-01-20"),
      startTime: "08:00",
      endTime: "14:00",
      capacity: 200,
      registered: 185,
      officer: "Tim Vaksinasi Puskesmas",
      description: "Vaksinasi COVID-19 booster kedua untuk masyarakat umum",
      status: "completed" as const,
      puskesmasId: ilagaPuskesmas?.id,
    },
    {
      id: generateId(),
      title: "Senam Prolanis",
      type: "lainnya" as const,
      district: "Gome",
      location: "Halaman Puskesmas Gome",
      address: "Distrik Gome",
      date: new Date("2024-01-27"),
      startTime: "06:30",
      endTime: "08:00",
      capacity: 60,
      registered: 45,
      officer: "Instruktur Senam Yuli",
      description: "Senam rutin untuk peserta program Prolanis (Diabetes & Hipertensi)",
      status: "upcoming" as const,
      puskesmasId: ilagaPuskesmas?.id,
    },
  ];
  await db.insert(schedules).values(schedulesData);

  // Seed District Health Data (25 Distrik Kabupaten Puncak)
  console.log("Seeding district health data...");
  const currentYear = new Date().getFullYear();

  const districtsData = districtNames.map((name, index) => ({
    id: generateId(),
    districtName: name,
    population: String(Math.floor(Math.random() * 10000) + 2000), // Random population 2000-12000
    puskesmas: name === "Ilaga" ? 2 : 1, // Ilaga as capital has 2 puskesmas
    hospitals: name === "Ilaga" ? 1 : 0, // Only capital has hospital
    doctors: name === "Ilaga" ? 5 : Math.floor(Math.random() * 3) + 1,
    nurses: Math.floor(Math.random() * 8) + 3,
    midwives: Math.floor(Math.random() * 5) + 2,
    year: currentYear,
    sortOrder: index,
    status: "active" as const,
    puskesmasId: ilagaPuskesmas?.id,
  }));
  await db.insert(districtHealthData).values(districtsData);

  // Seed Health Program Coverage
  console.log("Seeding health program coverage...");
  const coverageData = [
    { id: generateId(), programName: "Imunisasi Dasar Lengkap", coveragePercent: 78.5, year: currentYear, sortOrder: 0, status: "active" as const, puskesmasId: ilagaPuskesmas?.id },
    { id: generateId(), programName: "Persalinan di Faskes", coveragePercent: 65.2, year: currentYear, sortOrder: 1, status: "active" as const, puskesmasId: ilagaPuskesmas?.id },
    { id: generateId(), programName: "Kunjungan Neonatal", coveragePercent: 72.8, year: currentYear, sortOrder: 2, status: "active" as const, puskesmasId: ilagaPuskesmas?.id },
    { id: generateId(), programName: "Pelayanan Kesehatan Balita", coveragePercent: 68.4, year: currentYear, sortOrder: 3, status: "active" as const, puskesmasId: ilagaPuskesmas?.id },
    { id: generateId(), programName: "Pelayanan Kesehatan Lansia", coveragePercent: 54.3, year: currentYear, sortOrder: 4, status: "active" as const, puskesmasId: ilagaPuskesmas?.id },
    { id: generateId(), programName: "KB Aktif", coveragePercent: 61.7, year: currentYear, sortOrder: 5, status: "active" as const, puskesmasId: ilagaPuskesmas?.id },
    { id: generateId(), programName: "Pemeriksaan Ibu Hamil (K4)", coveragePercent: 70.1, year: currentYear, sortOrder: 6, status: "active" as const, puskesmasId: ilagaPuskesmas?.id },
  ];
  await db.insert(healthProgramCoverage).values(coverageData);

  // Seed Health Disease Data
  console.log("Seeding health disease data...");
  const diseaseData = [
    { id: generateId(), diseaseName: "ISPA", cases: 4567, year: currentYear, sortOrder: 0, status: "active" as const, puskesmasId: ilagaPuskesmas?.id },
    { id: generateId(), diseaseName: "Malaria", cases: 2345, year: currentYear, sortOrder: 1, status: "active" as const, puskesmasId: ilagaPuskesmas?.id },
    { id: generateId(), diseaseName: "Diare", cases: 1892, year: currentYear, sortOrder: 2, status: "active" as const, puskesmasId: ilagaPuskesmas?.id },
    { id: generateId(), diseaseName: "TB Paru", cases: 876, year: currentYear, sortOrder: 3, status: "active" as const, puskesmasId: ilagaPuskesmas?.id },
    { id: generateId(), diseaseName: "Hipertensi", cases: 1234, year: currentYear, sortOrder: 4, status: "active" as const, puskesmasId: ilagaPuskesmas?.id },
    { id: generateId(), diseaseName: "Diabetes Mellitus", cases: 543, year: currentYear, sortOrder: 5, status: "active" as const, puskesmasId: ilagaPuskesmas?.id },
    { id: generateId(), diseaseName: "Pneumonia", cases: 321, year: currentYear, sortOrder: 6, status: "active" as const, puskesmasId: ilagaPuskesmas?.id },
  ];
  await db.insert(healthDiseaseData).values(diseaseData);

  // Seed Health Statistics
  console.log("Seeding health statistics...");
  const healthStatisticsData = [
    { id: generateId(), label: "Total Populasi", value: "194.570", icon: "Users", change: "+1.2%", year: currentYear, sortOrder: 0, status: "active" as const, puskesmasId: ilagaPuskesmas?.id },
    { id: generateId(), label: "Jumlah Faskes", value: "30", icon: "Hospital", change: " ", year: currentYear, sortOrder: 1, status: "active" as const, puskesmasId: ilagaPuskesmas?.id },
    { id: generateId(), label: "Tenaga Kesehatan", value: "450", icon: "Stethoscope", change: "+5", year: currentYear, sortOrder: 2, status: "active" as const, puskesmasId: ilagaPuskesmas?.id },
    { id: generateId(), label: "Angka Harapan Hidup", value: "65.2 thn", icon: "HeartPulse", change: "+0.3 thn", year: currentYear, sortOrder: 3, status: "active" as const, puskesmasId: ilagaPuskesmas?.id },
    { id: generateId(), label: "Kunjungan Rawat Jalan", value: "12.345", icon: "Activity", change: "+3.5%", year: currentYear, sortOrder: 4, status: "active" as const, puskesmasId: ilagaPuskesmas?.id },
    { id: generateId(), label: "Kelahiran Hidup", value: "3.456", icon: "Baby", change: "-0.5%", year: currentYear, sortOrder: 5, status: "active" as const, puskesmasId: ilagaPuskesmas?.id },
    { id: generateId(), label: "Cakupan Imunisasi (DPT)", value: "85.7%", icon: "ShieldCheck", change: "+1.2%", year: currentYear, sortOrder: 6, status: "active" as const, puskesmasId: ilagaPuskesmas?.id },
    { id: generateId(), label: "Kasus Gizi Buruk (Balita)", value: "128", icon: "TriangleAlert", change: "-10", year: currentYear, sortOrder: 7, status: "active" as const, puskesmasId: ilagaPuskesmas?.id },
  ];

  console.log("Seeding general info...");
  const generalInfoData = [
    { id: generateId(), key: "hotline", value: "(0967) 123-456", label: "Nomor Hotline", category: "contact" },
    { id: generateId(), key: "address", value: "Jl. Kesehatan No. 1, Jayapura, Kabupaten Puncak, Indonesia", label: "Alamat Kantor", category: "contact" },
    { id: generateId(), key: "email", value: "dinkes@papua.go.id", label: "Email Resmi", category: "contact" },
    { id: generateId(), key: "working_hours_weekday", value: "08:00 - 16:00", label: "Jam Kerja (Senin-Jumat)", category: "general" },
    { id: generateId(), key: "emergency_call", value: "119", label: "Nomor Darurat", category: "contact" },
    { id: generateId(), key: "facebook_url", value: "#", label: "Facebook URL", category: "social" },
    { id: generateId(), key: "instagram_url", value: "#", label: "Instagram URL", category: "social" },
    { id: generateId(), key: "twitter_url", value: "#", label: "Twitter URL", category: "social" },
    { id: generateId(), key: "youtube_url", value: "#", label: "YouTube URL", category: "social" },
  ];
  await db.insert(generalInfo).values(generalInfoData);

  await db.insert(healthStatistics).values(healthStatisticsData);

  console.log("✅ Seed completed successfully!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed!", err);
  process.exit(1);
});