import { Hono } from "hono";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const uploadRouter = new Hono();

// Upload directory
const UPLOAD_DIR = path.join(process.cwd(), "uploads");

async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
}

// ─── Security Constants ────────────────────────────────────────────────────────

const ALLOWED_DOC_MIMES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

const ALLOWED_IMAGE_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const ALLOWED_DOC_EXTS = new Set([".pdf", ".doc", ".docx", ".xls", ".xlsx"]);
const ALLOWED_IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

/**
 * Absolutely blocked extensions (executables, scripts, web files, archives).
 * Block these FIRST regardless of MIME type.
 */
const BLOCKED_EXTS = new Set([
  ".exe", ".bat", ".cmd", ".com", ".sh", ".bash", ".zsh", ".fish",
  ".ps1", ".psm1", ".psd1", ".vbs", ".vbe", ".js", ".jse",
  ".wsf", ".wsh", ".msi", ".msp", ".dll", ".so", ".dylib",
  ".scr", ".pif", ".reg", ".hta", ".jar", ".class",
  ".py", ".pyc", ".pyo", ".rb", ".pl", ".perl",
  ".php", ".php3", ".php4", ".php5", ".php7", ".phtml",
  ".asp", ".aspx", ".ashx", ".asmx", ".jsp", ".jspx", ".cgi",
  ".svg",   // SVG can embed arbitrary JS
  ".html", ".htm", ".xhtml", ".xml",
  ".lnk", ".url", ".inf", ".iso", ".img", ".dmg",
  ".zip", ".rar", ".7z", ".tar", ".gz", ".bz2", ".xz",
]);

/**
 * Magic byte signatures for file type detection.
 * These are the first bytes of a file that identify its true format.
 */
const MAGIC_SIGNATURES: Array<{ hex: string; type: string }> = [
  { hex: "25504446", type: "pdf" },           // %PDF
  { hex: "D0CF11E0", type: "office-legacy" }, // DOC, XLS (OLE2 format)
  { hex: "504B0304", type: "office-modern" }, // DOCX, XLSX (ZIP/OOXML format)
  { hex: "FFD8FF", type: "jpeg" },
  { hex: "89504E47", type: "png" },           // PNG
  { hex: "47494638", type: "gif" },           // GIF87a / GIF89a
  { hex: "52494646", type: "webp" },          // RIFF (WebP uses RIFF container)
];

function detectMagicType(bytes: Uint8Array): string | null {
  const hex = Array.from(bytes.slice(0, 8))
    .map((b) => b.toString(16).padStart(2, "0").toUpperCase())
    .join("");
  for (const sig of MAGIC_SIGNATURES) {
    if (hex.startsWith(sig.hex.toUpperCase())) return sig.type;
  }
  return null;
}

/** Sanitize filename to prevent path traversal and special character injection */
function sanitizeFilename(name: string): string {
  return name
    .replace(/[^\w\s.\-()[\]]/g, "-") // only safe chars
    .replace(/\.{2,}/g, ".")           // collapse ".." → "."
    .replace(/^[./\\]+/, "")           // no leading dots/slashes
    .trim()
    .substring(0, 100);
}

function generateFilename(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const ext = path.extname(originalName).toLowerCase();
  const base = sanitizeFilename(path.basename(originalName, path.extname(originalName)))
    .replace(/\s+/g, "-")
    .toLowerCase()
    .substring(0, 40);
  return `${base}-${timestamp}-${random}${ext}`;
}

/**
 * Multi-layer validation for document uploads.
 * Returns error message string, or null if valid.
 */
async function validateDocumentFile(file: File): Promise<string | null> {
  // Layer 1: Size check (max 20MB)
  if (file.size > 20 * 1024 * 1024) {
    return "Ukuran file melebihi batas maksimal 20 MB";
  }
  if (file.size === 0) {
    return "File tidak boleh kosong";
  }

  // Layer 2: Extension checks
  const ext = path.extname(file.name).toLowerCase();
  if (!ext) return "File harus memiliki ekstensi";

  // Block dangerous extensions first (before any MIME check)
  if (BLOCKED_EXTS.has(ext)) {
    return `Ekstensi file "${ext}" tidak diizinkan karena alasan keamanan`;
  }

  // Check against document whitelist
  if (!ALLOWED_DOC_EXTS.has(ext)) {
    return `Tipe file "${ext}" tidak didukung. File yang diizinkan: PDF, DOC, DOCX, XLS, XLSX`;
  }

  // Detect double extensions like "report.pdf.exe" → ext would be ".exe" which is already caught above.
  // But also catch patterns like "image.jpg.pdf" — check if basename also has a suspicious ext.
  const innerExt = path.extname(path.basename(file.name, ext)).toLowerCase();
  if (innerExt && BLOCKED_EXTS.has(innerExt)) {
    return `Nama file mencurigakan (ekstensi ganda terdeteksi)`;
  }

  // Layer 3: MIME type (browser-supplied, unreliable — but add as check)
  if (file.type && file.type !== "application/octet-stream" && file.type !== "") {
    if (!ALLOWED_DOC_MIMES.has(file.type)) {
      return `Tipe MIME "${file.type}" tidak sesuai untuk dokumen`;
    }
  }

  // Layer 4: Magic bytes — read actual file header to confirm real type
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer.slice(0, 8));
  const magic = detectMagicType(bytes);

  if (magic === null) {
    return "Format file tidak dapat dikenali. Pastikan file asli dan tidak rusak";
  }

  // Map extensions to expected magic types
  const extToMagic: Record<string, string[]> = {
    ".pdf": ["pdf"],
    ".doc": ["office-legacy", "office-modern"], // some Word docs use newer format
    ".xls": ["office-legacy", "office-modern"],
    ".docx": ["office-modern"],
    ".xlsx": ["office-modern"],
  };

  const expectedMagics = extToMagic[ext] ?? [];
  if (!expectedMagics.includes(magic)) {
    return "Isi file tidak sesuai dengan ekstensinya. File mungkin telah dimanipulasi";
  }

  return null; // ✅ valid
}

// ─── POST /api/upload ─ Upload image ──────────────────────────────────────────
uploadRouter.post("/", async (c) => {
  try {
    await ensureUploadDir();
    const formData = await c.req.formData();
    const file = formData.get("file") as File;

    if (!file) return c.json({ error: "File tidak ditemukan" }, 400);
    if (file.size === 0) return c.json({ error: "File tidak boleh kosong" }, 400);
    if (file.size > 5 * 1024 * 1024) return c.json({ error: "Ukuran file melebihi batas maksimal 5 MB" }, 400);

    const ext = path.extname(file.name).toLowerCase();
    if (BLOCKED_EXTS.has(ext)) return c.json({ error: `Ekstensi "${ext}" tidak diizinkan` }, 400);
    if (!ALLOWED_IMAGE_EXTS.has(ext) && !ALLOWED_IMAGE_MIMES.has(file.type)) {
      return c.json({ error: "Hanya gambar (JPG, PNG, WebP, GIF) yang diizinkan" }, 400);
    }

    const filename = generateFilename(file.name);
    const filepath = path.join(UPLOAD_DIR, filename);
    await writeFile(filepath, Buffer.from(await file.arrayBuffer()));

    return c.json({ success: true, filename, url: `/uploads/${filename}`, size: file.size, type: file.type });
  } catch (error) {
    console.error("Image upload error:", error);
    return c.json({ error: "Gagal mengunggah gambar" }, 500);
  }
});

// ─── POST /api/upload/document ─ Upload dokumen ───────────────────────────────
uploadRouter.post("/document", async (c) => {
  try {
    await ensureUploadDir();
    const formData = await c.req.formData();
    const file = formData.get("file") as File;

    if (!file) return c.json({ error: "File tidak ditemukan" }, 400);

    // Multi-layer validation
    const validationError = await validateDocumentFile(file);
    if (validationError) return c.json({ error: validationError }, 400);

    const filename = generateFilename(file.name);
    const filepath = path.join(UPLOAD_DIR, filename);
    await writeFile(filepath, Buffer.from(await file.arrayBuffer()));

    const rawExt = path.extname(file.name).replace(".", "").toUpperCase();
    const formatMap: Record<string, string> = { XLS: "XLSX", DOC: "DOC", DOCX: "DOCX", XLSX: "XLSX", PDF: "PDF" };

    return c.json({
      success: true,
      filename,
      url: `/uploads/${filename}`,
      size: file.size,
      type: file.type,
      format: formatMap[rawExt] || rawExt,
    });
  } catch (error) {
    console.error("Document upload error:", error);
    return c.json({ error: "Gagal mengunggah dokumen" }, 500);
  }
});

// ─── POST /api/upload/multiple ─ Upload multiple images ───────────────────────
uploadRouter.post("/multiple", async (c) => {
  try {
    await ensureUploadDir();
    const formData = await c.req.formData();
    const files = formData.getAll("files") as File[];

    if (!files.length) return c.json({ error: "Tidak ada file yang dikirim" }, 400);

    const maxSize = 5 * 1024 * 1024;
    const uploadedFiles: { filename: string; url: string; size: number; type: string }[] = [];

    for (const file of files) {
      const ext = path.extname(file.name).toLowerCase();
      if (BLOCKED_EXTS.has(ext)) continue;
      if (!ALLOWED_IMAGE_MIMES.has(file.type) && !ALLOWED_IMAGE_EXTS.has(ext)) continue;
      if (file.size > maxSize || file.size === 0) continue;

      const filename = generateFilename(file.name);
      const filepath = path.join(UPLOAD_DIR, filename);
      await writeFile(filepath, Buffer.from(await file.arrayBuffer()));
      uploadedFiles.push({ filename, url: `/uploads/${filename}`, size: file.size, type: file.type });
    }

    return c.json({ success: true, files: uploadedFiles, count: uploadedFiles.length });
  } catch (error) {
    console.error("Multiple upload error:", error);
    return c.json({ error: "Gagal mengunggah file" }, 500);
  }
});

export { uploadRouter };
