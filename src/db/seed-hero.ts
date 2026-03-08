/**
 * Script untuk menambahkan data hero section ke tabel general_info
 * tanpa menghapus data yang sudah ada.
 *
 * Jalankan: bun run src/db/seed-hero.ts
 */
import { db } from "./index";
import { generalInfo } from "./schema";
import { eq } from "drizzle-orm";
import "dotenv/config";

function generateId(): string {
    return crypto.randomUUID();
}

const heroData = [
    {
        key: "hero_image",
        value: "",
        label: "Gambar Latar Hero",
        category: "appearance",
    },
    {
        key: "hero_title",
        value: "Wujudkan\nKabupaten Puncak Sehat\nBersama Kami",
        label: "Judul Hero Section",
        category: "appearance",
    },
    {
        key: "hero_subtitle",
        value:
            "Dinas Kesehatan Kabupaten Puncak berkomitmen memberikan pelayanan kesehatan berkualitas, terjangkau, dan merata untuk seluruh masyarakat Kabupaten Puncak dari Pegunungan hingga Pesisir.",
        label: "Deskripsi Hero Section",
        category: "appearance",
    },
    {
        key: "hero_badge",
        value: "Kabupaten Puncak Sehat, Kabupaten Puncak Maju",
        label: "Teks Badge Hero",
        category: "appearance",
    },
];

async function seedHero() {
    console.log("🌱 Seeding hero section data...");

    for (const item of heroData) {
        const [existing] = await db
            .select()
            .from(generalInfo)
            .where(eq(generalInfo.key, item.key));

        if (existing) {
            // Only update label/category, don't overwrite existing value
            await db
                .update(generalInfo)
                .set({ label: item.label, category: item.category })
                .where(eq(generalInfo.key, item.key));
            console.log(`  ↻ Sudah ada: ${item.key} (tidak ditimpa)`);
        } else {
            await db.insert(generalInfo).values({
                id: generateId(),
                key: item.key,
                value: item.value,
                label: item.label,
                category: item.category,
            });
            console.log(`  ✓ Ditambahkan: ${item.key}`);
        }
    }

    console.log("✅ Hero section seed selesai!");
    process.exit(0);
}

seedHero().catch((err) => {
    console.error("❌ Seed gagal!", err);
    process.exit(1);
});
