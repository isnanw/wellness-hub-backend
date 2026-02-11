import { Hono } from "hono";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const uploadRouter = new Hono();

// Upload directory path
const UPLOAD_DIR = path.join(process.cwd(), "uploads");

// Ensure upload directory exists
async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
}

// Generate unique filename
function generateFilename(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const ext = path.extname(originalName).toLowerCase();
  const safeName = originalName
    .replace(/\.[^/.]+$/, "") // Remove extension
    .replace(/[^a-zA-Z0-9]/g, "-") // Replace special chars with dash
    .toLowerCase()
    .substring(0, 30); // Limit length
  return `${safeName}-${timestamp}-${random}${ext}`;
}

// POST /api/upload - Upload a single file
uploadRouter.post("/", async (c) => {
  try {
    await ensureUploadDir();

    const formData = await c.req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return c.json({ error: "No file provided" }, 400);
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return c.json(
        { error: "Invalid file type. Allowed: JPG, PNG, WebP, GIF" },
        400
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return c.json({ error: "File too large. Maximum size is 5MB" }, 400);
    }

    // Generate unique filename
    const filename = generateFilename(file.name);
    const filepath = path.join(UPLOAD_DIR, filename);

    // Write file to disk
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await writeFile(filepath, buffer);

    // Return the URL path
    const url = `/uploads/${filename}`;

    return c.json({
      success: true,
      filename,
      url,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return c.json({ error: "Failed to upload file" }, 500);
  }
});

// POST /api/upload/document - Upload a document file (PDF, DOC, DOCX, XLSX)
uploadRouter.post("/document", async (c) => {
  try {
    await ensureUploadDir();

    const formData = await c.req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return c.json({ error: "No file provided" }, 400);
    }

    // Validate file type for documents
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    // Also check by extension as some browsers may not set correct MIME type
    const ext = path.extname(file.name).toLowerCase();
    const allowedExtensions = [".pdf", ".doc", ".docx", ".xls", ".xlsx"];

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(ext)) {
      return c.json(
        { error: "Invalid file type. Allowed: PDF, DOC, DOCX, XLS, XLSX" },
        400
      );
    }

    // Validate file size (max 10MB for documents)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return c.json({ error: "File too large. Maximum size is 10MB" }, 400);
    }

    // Generate unique filename
    const filename = generateFilename(file.name);
    const filepath = path.join(UPLOAD_DIR, filename);

    // Write file to disk
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await writeFile(filepath, buffer);

    // Return the URL path
    const url = `/uploads/${filename}`;

    return c.json({
      success: true,
      filename,
      url,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error("Document upload error:", error);
    return c.json({ error: "Failed to upload document" }, 500);
  }
});

// POST /api/upload/multiple - Upload multiple files
uploadRouter.post("/multiple", async (c) => {
  try {
    await ensureUploadDir();

    const formData = await c.req.formData();
    const files = formData.getAll("files") as File[];

    if (!files.length) {
      return c.json({ error: "No files provided" }, 400);
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const maxSize = 5 * 1024 * 1024;
    const uploadedFiles: Array<{
      filename: string;
      url: string;
      size: number;
      type: string;
    }> = [];

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        continue; // Skip invalid files
      }
      if (file.size > maxSize) {
        continue; // Skip large files
      }

      const filename = generateFilename(file.name);
      const filepath = path.join(UPLOAD_DIR, filename);

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      await writeFile(filepath, buffer);

      uploadedFiles.push({
        filename,
        url: `/uploads/${filename}`,
        size: file.size,
        type: file.type,
      });
    }

    return c.json({
      success: true,
      files: uploadedFiles,
      count: uploadedFiles.length,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return c.json({ error: "Failed to upload files" }, 500);
  }
});

export { uploadRouter };
