import { z } from "zod";

export const CategoryTypeSchema = z.enum(["income", "expense", "both"]);

export const CreateCategorySchema = z.object({
  name: z.string().trim().min(1, "Category name is required").max(100),
  type: CategoryTypeSchema,
  icon: z.string().trim().optional(),
  color: z
    .string()
    .regex(
      /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/,
      "Color must be a valid hex color code (e.g. #3B82F6)",
    )
    .optional(),
});

export const UpdateCategorySchema = CreateCategorySchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field must be provided to update a category" },
);

export const CategorySchema = CreateCategorySchema.extend({
  id: z.string().min(1, "Category ID is required"),
  isPredefined: z.boolean().default(false),
});

export type CategoryType = z.infer<typeof CategoryTypeSchema>;
export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>;
export type CategoryDto = z.infer<typeof CategorySchema>;
