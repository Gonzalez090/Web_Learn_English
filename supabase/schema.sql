-- =========================================================
-- ตารางเก็บความคืบหน้าของผู้เรียน (ขั้นที่ 31) — วางทั้งไฟล์ใน Supabase → SQL Editor → Run (รันซ้ำได้)
--   1 คน = 1 แถว: data = { v, epoch, progress, reviewQueue } (ไม่มีเสียงอัด ไม่มีการตั้งค่า)
--   RLS: ล็อกอินแล้วเห็น/แก้ได้เฉพาะแถวของตัวเอง — คนไม่ล็อกอินเข้าไม่ได้เลย
-- =========================================================

create table if not exists public.user_progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null,
  revision bigint not null default 1 check (revision > 0),
  updated_at timestamptz not null default now(),
  -- กันข้อมูลใหญ่ผิดปกติ (ปกติไม่เกิน ~100 KB)
  constraint user_progress_size check (octet_length(data::text) < 1000000)
);

alter table public.user_progress enable row level security;

revoke all on public.user_progress from anon, authenticated;
grant select, insert, update, delete on public.user_progress to authenticated;

drop policy if exists "own row: select" on public.user_progress;
create policy "own row: select" on public.user_progress
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "own row: insert" on public.user_progress;
create policy "own row: insert" on public.user_progress
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "own row: update" on public.user_progress;
create policy "own row: update" on public.user_progress
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "own row: delete" on public.user_progress;
create policy "own row: delete" on public.user_progress
  for delete to authenticated using ((select auth.uid()) = user_id);

-- เวลาแก้ล่าสุด
create or replace function public.touch_user_progress()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists touch_user_progress on public.user_progress;
create trigger touch_user_progress
  before update on public.user_progress
  for each row execute function public.touch_user_progress();

-- ปุ่ม "ลบบัญชี" ในหน้าตั้งค่า: ลบได้เฉพาะบัญชีของคนที่เรียก (แถวความคืบหน้าถูกลบตามเอง)
create or replace function public.delete_my_account()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from auth.users where id = (select auth.uid());
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
revoke all on function public.touch_user_progress() from public, anon, authenticated;
