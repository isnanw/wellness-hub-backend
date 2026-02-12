export const generalInfo = pgTable("general_info", {
  id: text("id").primaryKey(),
  key: text("key").unique().notNull(),
  value: text("value").notNull(),
  label: text("label").notNull(),
  category: text("category").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
