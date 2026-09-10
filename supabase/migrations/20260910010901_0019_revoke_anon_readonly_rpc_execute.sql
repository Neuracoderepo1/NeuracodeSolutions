-- Close the remaining anon EXECUTE gap (confirmed via live grant inventory).
-- Not exploitable today (anon has zero underlying table grants), but violates
-- least-privilege: anon should never have execute on any of these.
revoke execute on function public.all_gates_passed(uuid) from anon;
revoke execute on function public.compute_pbv(uuid) from anon;
revoke execute on function public.count_qualified_commitments(uuid) from anon;
revoke execute on function public.gate_state_json(uuid) from anon;
revoke execute on function public.enforce_pbv_weight_total() from anon;
revoke execute on function public.reject_ledger_mutation() from anon;
revoke execute on function public.set_updated_at() from anon;
