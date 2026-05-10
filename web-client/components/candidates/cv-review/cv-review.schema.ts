import * as z from "zod";

export const cvSchema = z.object({
  fullName: z.string().min(2, "Họ tên quá ngắn"),
  email: z.string().email("Email không hợp lệ").or(z.literal("")),
  phone: z.string().min(9, "Số điện thoại không hợp lệ").or(z.literal("")),
  skills: z.array(z.any()).min(1, "Vui lòng nhập ít nhất 1 kỹ năng"),
  experience: z.array(z.any()),
  projects: z.array(z.any()),
  education: z.array(z.any()),
  totalYearsExp: z.number().min(0).or(z.string()),
  summary: z.string().optional(),
  desiredJob: z.any().optional(),
  certifications: z.array(z.string()).optional(),
  gpa: z.number().min(0).max(4).optional().or(z.string()),
  languages: z.array(z.any()).optional(),
  interests: z.array(z.string()).optional(),
  otherInfo: z.array(z.any()).optional(),
});

export type CVFormData = z.infer<typeof cvSchema>;
