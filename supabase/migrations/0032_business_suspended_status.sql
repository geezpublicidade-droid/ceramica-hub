alter table businesses drop constraint businesses_status_check;
alter table businesses add constraint businesses_status_check
  check (status in ('pending', 'approved', 'rejected', 'suspended'));
