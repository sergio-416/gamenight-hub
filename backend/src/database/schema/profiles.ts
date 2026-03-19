import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

export const profiles = pgTable(
  "profiles",
  {
    uid: text("uid").primaryKey(),
    firstName: text("first_name"),
    lastName: text("last_name"),
    username: text("username"),
    email: text("email"),
    backupEmail: text("backup_email"),
    mobilePhone: text("mobile_phone"),
    avatar: text("avatar"),
    bio: text("bio"),
    location: text("location"),
    postalZip: text("postal_zip"),
    birthday: text("birthday"),
    isProfilePublic: boolean("is_profile_public").notNull().default(false),
    useRealNameForContact: boolean("use_real_name_for_contact")
      .notNull()
      .default(false),
    showFirstName: boolean("show_first_name").notNull().default(true),
    showLastName: boolean("show_last_name").notNull().default(true),
    showLocation: boolean("show_location").notNull().default(false),
    showPostalZip: boolean("show_postal_zip").notNull().default(false),
    showBirthday: boolean("show_birthday").notNull().default(false),
    showMobilePhone: boolean("show_mobile_phone").notNull().default(false),
    showBackupEmail: boolean("show_backup_email").notNull().default(false),
    showEmail: boolean("show_email").notNull().default(false),
    showGameCollection: boolean("show_game_collection").notNull().default(true),
    nameChangedAt: timestamp("name_changed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [
    unique("profiles_username_unique").on(table.username),
    index("profiles_username_idx").on(table.username),
  ]
);

export type SelectProfile = typeof profiles.$inferSelect;
export type InsertProfile = typeof profiles.$inferInsert;
