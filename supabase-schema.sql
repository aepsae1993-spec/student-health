-- ตารางชั้นเรียน
create table if not exists classes (
  id serial primary key,
  name text not null,
  order_num integer not null
);

insert into classes (name, order_num) values
  ('อ.2', 1),
  ('อ.3', 2),
  ('ป.1', 3),
  ('ป.2', 4),
  ('ป.3', 5),
  ('ป.4', 6),
  ('ป.5', 7),
  ('ป.6', 8)
on conflict do nothing;

-- ตารางนักเรียน
create table if not exists students (
  id uuid default gen_random_uuid() primary key,
  class_id integer references classes(id) on delete cascade,
  student_number integer not null,
  first_name text not null,
  last_name text not null,
  gender text not null check (gender in ('ชาย', 'หญิง')),
  created_at timestamptz default now(),
  unique(class_id, student_number)
);

-- ตารางบันทึกน้ำหนัก-ส่วนสูง
create table if not exists measurements (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references students(id) on delete cascade,
  month integer not null check (month between 1 and 12),
  year integer not null,
  weight numeric(5,2),
  height numeric(5,2),
  recorded_at timestamptz default now(),
  unique(student_id, month, year)
);

-- Indexes
create index if not exists idx_students_class_id on students(class_id);
create index if not exists idx_measurements_student_id on measurements(student_id);
create index if not exists idx_measurements_month_year on measurements(month, year);

-- Enable RLS (Row Level Security) - ปิดไว้ก่อนเพื่อง่ายต่อการพัฒนา
alter table classes enable row level security;
alter table students enable row level security;
alter table measurements enable row level security;

-- Policy: allow all for now (ปรับแต่งหลัง deploy จริง)
create policy "Allow all on classes" on classes for all using (true);
create policy "Allow all on students" on students for all using (true);
create policy "Allow all on measurements" on measurements for all using (true);
