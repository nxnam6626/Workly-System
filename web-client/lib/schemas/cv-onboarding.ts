import * as z from 'zod';

export const experienceSchema = z.object({
  company: z.string().min(1, 'Vui lòng nhập tên công ty'),
  role: z.string().min(1, 'Vui lòng nhập chức vụ'),
  duration: z.string().min(1, 'Vui lòng nhập thời gian làm việc'),
  description: z.string().optional(),
});

export const educationSchema = z.object({
  school: z.string().min(1, 'Vui lòng nhập tên trường'),
  degree: z.string().min(1, 'Vui lòng nhập bằng cấp'),
  major: z.string().min(1, 'Vui lòng nhập chuyên ngành'),
});

export const skillSchema = z.object({
  skillName: z.string().min(1, 'Vui lòng nhập tên kỹ năng'),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
});

export const projectSchema = z.object({
  projectName: z.string().min(1, 'Vui lòng nhập tên dự án'),
  description: z.string().min(1, 'Vui lòng nhập mô tả dự án'),
  role: z.string().optional(),
  technology: z.string().optional(),
});

export const desiredJobSchema = z.object({
  jobTitle: z.string().optional(),
  jobType: z.string().optional(),
  jobLevel: z.string().optional(),
  expectedSalary: z.string().optional(),
  location: z.string().optional(),
});

export const formSchema = z.object({
  fullName: z.string().min(2, 'Họ tên quá ngắn'),
  email: z.string().email('Email không hợp lệ'),
  phone: z.string().min(10, 'Số điện thoại không hợp lệ'),
  gpa: z.number().optional(),
  skills: z.array(skillSchema).min(1, 'Vui lòng nhập ít nhất 1 kỹ năng'),
  experience: z.array(experienceSchema),
  education: z.array(educationSchema),
  projects: z.array(projectSchema),
  desiredJob: desiredJobSchema.optional(),
  totalYearsExp: z.number().min(0),
  summary: z.string().optional(),
});

export type FormValues = z.infer<typeof formSchema>;
export type ExperienceValue = z.infer<typeof experienceSchema>;
export type EducationValue = z.infer<typeof educationSchema>;
export type SkillValue = z.infer<typeof skillSchema>;
export type ProjectValue = z.infer<typeof projectSchema>;
export type DesiredJobValue = z.infer<typeof desiredJobSchema>;
