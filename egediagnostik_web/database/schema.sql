-- EGE Diagnostik PostgreSQL schema
create table if not exists roles (
  id bigserial primary key,
  name varchar(100) not null,
  slug varchar(80) unique not null
);
create table if not exists users (
  id bigserial primary key,
  role_id bigint not null references roles(id),
  first_name varchar(100) not null,
  last_name varchar(100) not null,
  email varchar(190) unique not null,
  phone varchar(40),
  institution varchar(190),
  password_hash varchar(255) not null,
  status varchar(20) not null default 'active',
  last_login_at timestamptz,
  last_login_ip varchar(64),
  created_at timestamptz not null default now()
);
create table if not exists site_settings (
  key varchar(120) primary key,
  value text,
  updated_at timestamptz not null default now()
);
create table if not exists menus (
  id bigserial primary key,
  label varchar(120) not null,
  url varchar(255) not null,
  parent_id bigint references menus(id),
  sort_order int not null default 0,
  is_active boolean not null default true
);
create table if not exists sliders (
  id bigserial primary key,
  eyebrow varchar(160),
  title varchar(220) not null,
  subtitle text,
  image_url text,
  button_text varchar(100),
  button_url varchar(255),
  sort_order int not null default 0,
  is_active boolean not null default true
);
create table if not exists product_categories (
  id bigserial primary key,
  name varchar(150) not null,
  slug varchar(160) unique not null
);
create table if not exists products (
  id bigserial primary key,
  category_id bigint references product_categories(id),
  brand varchar(140),
  name varchar(180) not null,
  slug varchar(190) unique not null,
  summary text,
  description text,
  image_url text,
  is_featured boolean not null default false,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create table if not exists media (
  id bigserial primary key,
  title varchar(180) not null,
  media_type varchar(30) not null,
  file_url text,
  youtube_id varchar(100),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists course_categories (
  id bigserial primary key,
  name varchar(160) not null,
  slug varchar(170) unique not null
);
create table if not exists courses (
  id bigserial primary key,
  category_id bigint references course_categories(id),
  title varchar(220) not null,
  slug varchar(230) unique not null,
  summary text,
  cover_url text,
  level varchar(50),
  duration_minutes int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists course_sections (
  id bigserial primary key,
  course_id bigint not null references courses(id) on delete cascade,
  title varchar(220) not null,
  sort_order int not null default 0
);
create table if not exists lessons (
  id bigserial primary key,
  section_id bigint not null references course_sections(id) on delete cascade,
  title varchar(220) not null,
  content text,
  video_type varchar(30) not null default 'none',
  video_url text,
  duration_seconds int not null default 0,
  sort_order int not null default 0,
  is_active boolean not null default true
);
create table if not exists enrollments (
  id bigserial primary key,
  user_id bigint not null references users(id) on delete cascade,
  course_id bigint not null references courses(id) on delete cascade,
  enrolled_at timestamptz not null default now(),
  completed_at timestamptz,
  unique(user_id,course_id)
);
create table if not exists lesson_progress (
  user_id bigint not null references users(id) on delete cascade,
  lesson_id bigint not null references lessons(id) on delete cascade,
  completed boolean not null default false,
  watched_seconds int not null default 0,
  updated_at timestamptz not null default now(),
  primary key(user_id,lesson_id)
);
create table if not exists exams (
  id bigserial primary key,
  course_id bigint not null references courses(id) on delete cascade,
  title varchar(220) not null,
  question_count int not null default 10,
  pass_score numeric(5,2) not null default 70,
  time_limit_minutes int not null default 20,
  max_attempts int not null default 3,
  is_active boolean not null default true
);
create table if not exists exam_questions (
  id bigserial primary key,
  exam_id bigint not null references exams(id) on delete cascade,
  question_text text not null,
  option_a text not null,
  option_b text not null,
  option_c text not null,
  option_d text not null,
  correct_option char(1) not null check (correct_option in ('A','B','C','D')),
  explanation text,
  is_active boolean not null default true
);
create table if not exists exam_attempts (
  id bigserial primary key,
  user_id bigint not null references users(id),
  exam_id bigint not null references exams(id),
  score numeric(5,2) not null,
  passed boolean not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);
create table if not exists certificate_templates (
  id bigserial primary key,
  name varchar(150) not null,
  title varchar(200) not null,
  body_template text not null,
  footer_text text,
  signature_name varchar(160),
  signature_title varchar(160),
  is_default boolean not null default false,
  updated_at timestamptz not null default now()
);
create table if not exists certificates (
  id bigserial primary key,
  user_id bigint not null references users(id),
  course_id bigint not null references courses(id),
  exam_attempt_id bigint references exam_attempts(id),
  template_id bigint references certificate_templates(id),
  certificate_code varchar(120) unique not null,
  score numeric(5,2) not null,
  issued_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique(user_id,course_id)
);
create table if not exists contact_messages (
  id bigserial primary key,
  name varchar(160) not null,
  email varchar(190) not null,
  phone varchar(50),
  subject varchar(180),
  message text not null,
  status varchar(30) not null default 'new',
  ip varchar(64),
  created_at timestamptz not null default now()
);
create table if not exists blocked_ips (
  id bigserial primary key,
  ip varchar(64) unique not null,
  reason varchar(255),
  expires_at timestamptz,
  created_at timestamptz not null default now()
);
create table if not exists login_attempts (
  id bigserial primary key,
  ip varchar(64) not null,
  email varchar(190) not null,
  failed_count int not null default 0,
  last_failed_at timestamptz,
  locked_until timestamptz,
  unique(ip,email)
);
create table if not exists security_events (
  id bigserial primary key,
  event_type varchar(100) not null,
  severity varchar(20) not null,
  ip varchar(64),
  user_agent varchar(255),
  request_uri varchar(500),
  details text,
  created_at timestamptz not null default now()
);

insert into roles(name,slug) values
('Sistem Yöneticisi','admin'),('Eğitim Kullanıcısı','student')
on conflict(slug) do nothing;

insert into certificate_templates(name,title,body_template,footer_text,signature_name,signature_title,is_default)
values('Kurumsal Mavi','BAŞARI SERTİFİKASI','{{full_name}} adlı kullanıcı {{course_title}} eğitimini ve sınavını %{{score}} başarı ile tamamlamıştır. Kurum: {{institution}}','Başarılarının devamını dileriz.','Ege Diagnostik Eğitim Kurulu','Eğitim Direktörlüğü',true)
on conflict do nothing;
