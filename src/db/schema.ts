import { pgTable, text, timestamp, integer, pgEnum, real } from "drizzle-orm/pg-core";

// Enums
export const statusEnum = pgEnum("status", ["active", "inactive"]);
export const newsStatusEnum = pgEnum("news_status", ["published", "draft"]);
export const programStatusEnum = pgEnum("program_status", ["active", "inactive", "completed"]);
export const registrationStatusEnum = pgEnum("registration_status", ["pending", "confirmed", "completed", "cancelled"]);
export const scheduleTypeEnum = pgEnum("schedule_type", ["posyandu", "imunisasi", "penyuluhan", "pemeriksaan", "vaksinasi", "lainnya"]);
export const scheduleStatusEnum = pgEnum("schedule_status", ["upcoming", "ongoing", "completed", "cancelled"]);
export const documentCategoryEnum = pgEnum("document_category", ["pendaftaran", "rujukan", "administrasi", "laporan"]);
export const documentFormatEnum = pgEnum("document_format", ["PDF", "XLSX", "DOC", "DOCX"]);
export const healthReportCategoryEnum = pgEnum("health_report_category", ["profil", "imunisasi", "penyakit", "spm", "gizi", "lainnya"]);

// Roles table
export const roles = pgTable("roles", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(), // e.g. "Administrator", "Unit Kerja", "Operator Dinkes"
  slug: text("slug").notNull().unique(), // e.g. "admin", "unit_kerja", "operator"
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Master Districts table
export const districts = pgTable("districts", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  code: text("code"),
  coordinator: text("coordinator"),
  contact: text("contact"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Master Unit Kerja table (formerly Puskesmas)
export const unitKerja = pgTable("unit_kerja", {
  id: text("id").primaryKey(),
  districtName: text("district_name").notNull(), // Keep for backward compatibility or display
  districtId: text("district_id").references(() => districts.id), // New FK
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  address: text("address"),
  phone: text("phone"),
  sortOrder: integer("sort_order").default(0).notNull(),
  status: statusEnum("status").default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});


// Users table
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password"),
  roleId: text("role_id").references(() => roles.id).notNull(),
  unitKerjaId: text("unit_kerja_id").references(() => unitKerja.id), // Nullable, only for 'unit_kerja' role
  status: statusEnum("status").default("active").notNull(),
  avatar: text("avatar"),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Service Categories table (Master Data)
export const serviceCategories = pgTable("service_categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  icon: text("icon"),
  sortOrder: integer("sort_order").default(0).notNull(),
  status: statusEnum("status").default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Services table
export const services = pgTable("services", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  category: text("category").notNull(), // Keep for backward compatibility
  categoryId: text("category_id").references(() => serviceCategories.id), // New FK
  image: text("image"),
  location: text("location").notNull(),
  schedule: text("schedule").notNull(),
  unitKerjaId: text("unit_kerja_id").references(() => unitKerja.id),
  status: statusEnum("status").default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// News Categories table (Master Data)
export const newsCategories = pgTable("news_categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  sortOrder: integer("sort_order").default(0).notNull(),
  status: statusEnum("status").default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// News table
export const news = pgTable("news", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(), // Keep for backward compatibility
  categoryId: text("category_id").references(() => newsCategories.id), // New FK
  image: text("image"),
  author: text("author").notNull(),
  unitKerjaId: text("unit_kerja_id").references(() => unitKerja.id),
  status: newsStatusEnum("status").default("draft").notNull(),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Program Categories table (Master Data)
export const programCategories = pgTable("program_categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  icon: text("icon"),
  sortOrder: integer("sort_order").default(0).notNull(),
  status: statusEnum("status").default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Programs table
export const programs = pgTable("programs", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  category: text("category").notNull(), // Keep for backward compatibility
  categoryId: text("category_id").references(() => programCategories.id), // New FK
  icon: text("icon").notNull(),
  image: text("image"),
  participants: integer("participants").default(0).notNull(),
  target: integer("target").default(0).notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  unitKerjaId: text("unit_kerja_id").references(() => unitKerja.id),
  status: programStatusEnum("status").default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Registrations table
export const registrations = pgTable("registrations", {
  id: text("id").primaryKey(),
  queueNumber: text("queue_number").notNull(),
  name: text("name").notNull(),
  nik: text("nik").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  address: text("address"),
  service: text("service").notNull(),
  unitKerjaId: text("unit_kerja_id").references(() => unitKerja.id),
  appointmentDate: timestamp("appointment_date").notNull(),
  appointmentTime: text("appointment_time").notNull(),
  complaint: text("complaint"),
  status: registrationStatusEnum("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Schedules table
export const schedules = pgTable("schedules", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  type: scheduleTypeEnum("type").notNull(),
  district: text("district"),
  location: text("location").notNull(),
  address: text("address"),
  unitKerjaId: text("unit_kerja_id").references(() => unitKerja.id),
  date: timestamp("date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  capacity: integer("capacity").default(50).notNull(),
  registered: integer("registered").default(0).notNull(),
  officer: text("officer").notNull(),
  description: text("description"),
  status: scheduleStatusEnum("status").default("upcoming").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Documents table (for downloadable forms)
export const documents = pgTable("documents", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  description: text("description"),
  category: documentCategoryEnum("category").notNull(),
  format: documentFormatEnum("format").notNull(),
  fileUrl: text("file_url").notNull(),
  fileSize: text("file_size").notNull(),
  downloadCount: integer("download_count").default(0).notNull(),
  unitKerjaId: text("unit_kerja_id").references(() => unitKerja.id),
  status: statusEnum("status").default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Health Statistics table (for overview cards like Total Penduduk, Faskes, etc.)
// Note: Statistics might be global, but some could be per unit kerja. I'll add it just in case.
export const healthStatistics = pgTable("health_statistics", {
  id: text("id").primaryKey(),
  label: text("label").notNull(),
  value: text("value").notNull(),
  icon: text("icon").notNull(), // icon name like "Users", "Activity", etc.
  change: text("change"), // e.g. "+2.1%"
  year: integer("year").notNull(),
  unitKerjaId: text("unit_kerja_id").references(() => unitKerja.id),
  sortOrder: integer("sort_order").default(0).notNull(),
  status: statusEnum("status").default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// District Health Data table (for per-district data in Kabupaten Puncak)
// This strictly related to district, maybe unitKerjaId is not needed if it's aggregate?
// But user asked to add to ALL tables. I'll add to be safe for filtering.
export const districtHealthData = pgTable("district_health_data", {
  id: text("id").primaryKey(),
  districtName: text("district_name").notNull(),
  population: text("population").notNull(),
  unitKerja: integer("unit_kerja").default(0).notNull(),
  hospitals: integer("hospitals").default(0).notNull(),
  doctors: integer("doctors").default(0).notNull(),
  nurses: integer("nurses").default(0).notNull(),
  midwives: integer("midwives").default(0).notNull(),
  unitKerjaId: text("unit_kerja_id").references(() => unitKerja.id),
  year: integer("year").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  status: statusEnum("status").default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Health Reports table (for downloadable health reports)
export const healthReports = pgTable("health_reports", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  category: healthReportCategoryEnum("category").notNull(),
  year: integer("year").notNull(),
  fileUrl: text("file_url").notNull(),
  fileSize: text("file_size").notNull(),
  fileType: text("file_type").default("PDF").notNull(),
  downloadCount: integer("download_count").default(0).notNull(),
  unitKerjaId: text("unit_kerja_id").references(() => unitKerja.id),
  publishedAt: timestamp("published_at"),
  status: statusEnum("status").default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Health Program Coverage table (for coverage percentages like Imunisasi, Persalinan, etc.)
export const healthProgramCoverage = pgTable("health_program_coverage", {
  id: text("id").primaryKey(),
  programName: text("program_name").notNull(),
  coveragePercent: real("coverage_percent").notNull(), // 0-100
  year: integer("year").notNull(),
  unitKerjaId: text("unit_kerja_id").references(() => unitKerja.id),
  sortOrder: integer("sort_order").default(0).notNull(),
  status: statusEnum("status").default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Health Disease Data table (for disease case statistics)
export const healthDiseaseData = pgTable("health_disease_data", {
  id: text("id").primaryKey(),
  diseaseName: text("disease_name").notNull(),
  cases: integer("cases").notNull(),
  year: integer("year").notNull(),
  unitKerjaId: text("unit_kerja_id").references(() => unitKerja.id),
  sortOrder: integer("sort_order").default(0).notNull(),
  status: statusEnum("status").default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// General Info table (for dynamic site settings like hotline, address, etc.)
export const generalInfo = pgTable("general_info", {
  id: text("id").primaryKey(),
  key: text("key").unique().notNull(), // e.g., 'hotline', 'address', 'email'
  value: text("value").notNull(),
  label: text("label").notNull(), // e.g. "Nomor Hotline"
  category: text("category").notNull().default("contact"), // e.g. "contact", "social", "general"
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Types export
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Service = typeof services.$inferSelect;
export type NewService = typeof services.$inferInsert;
export type News = typeof news.$inferSelect;
export type NewNews = typeof news.$inferInsert;
export type Program = typeof programs.$inferSelect;
export type NewProgram = typeof programs.$inferInsert;
export type Registration = typeof registrations.$inferSelect;
export type NewRegistration = typeof registrations.$inferInsert;
export type Schedule = typeof schedules.$inferSelect;
export type NewSchedule = typeof schedules.$inferInsert;
export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
export type HealthStatistic = typeof healthStatistics.$inferSelect;
export type NewHealthStatistic = typeof healthStatistics.$inferInsert;
export type DistrictHealthData = typeof districtHealthData.$inferSelect;
export type NewDistrictHealthData = typeof districtHealthData.$inferInsert;
export type HealthReport = typeof healthReports.$inferSelect;
export type NewHealthReport = typeof healthReports.$inferInsert;
export type HealthProgramCoverage = typeof healthProgramCoverage.$inferSelect;
export type NewHealthProgramCoverage = typeof healthProgramCoverage.$inferInsert;
export type HealthDiseaseData = typeof healthDiseaseData.$inferSelect;
export type NewHealthDiseaseData = typeof healthDiseaseData.$inferInsert;
export type District = typeof districts.$inferSelect;
export type NewDistrict = typeof districts.$inferInsert;
export type UnitKerja = typeof unitKerja.$inferSelect;
export type NewUnitKerja = typeof unitKerja.$inferInsert;
export type GeneralInfo = typeof generalInfo.$inferSelect;
export type NewGeneralInfo = typeof generalInfo.$inferInsert;
export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;
export type ServiceCategory = typeof serviceCategories.$inferSelect;
export type NewServiceCategory = typeof serviceCategories.$inferInsert;
export type NewsCategory = typeof newsCategories.$inferSelect;
export type NewNewsCategory = typeof newsCategories.$inferInsert;
export type ProgramCategory = typeof programCategories.$inferSelect;
export type NewProgramCategory = typeof programCategories.$inferInsert;
