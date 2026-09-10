-- sync_commitment_gate is an internal trigger helper, not a client-facing RPC.
-- Trigger invocation does not require EXECUTE grants, so this is safe to lock down fully.
revoke execute on function public.sync_commitment_gate(uuid) from public, anon, authenticated;
revoke execute on function public.trg_sync_commitment_gate() from public, anon, authenticated;
