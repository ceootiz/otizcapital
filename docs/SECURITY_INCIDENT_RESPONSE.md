# OTIZ security incident response

This runbook applies to suspected account compromise, unauthorized data access,
money-state manipulation, leaked credentials, malicious uploads, provider
outages, and loss or corruption of production data.

## Authority and contacts

- Incident commander: Founder or formally appointed deputy.
- Technical lead: engineer with GitHub, Vercel, and Neon incident access.
- Money owner: person authorized to freeze deposits, withdrawals, and payouts.
- Communications owner: person authorized to contact investors and providers.
- Legal/privacy owner: counsel responsible for jurisdiction-specific notices.
- Provider contacts and personal phone numbers must stay in the private company
  contact register, not in Git.

## Severity

- `SEV-1`: confirmed unauthorized access, secret exposure, money integrity loss,
  or unrecoverable production outage.
- `SEV-2`: probable compromise, failed money reconciliation, sensitive document
  exposure, or extended auth/database/storage outage.
- `SEV-3`: contained suspicious activity with no confirmed data or money impact.

## First 15 minutes

1. Open an incident in the private incident channel and record UTC start time.
2. Assign the incident commander, technical lead, money owner, and scribe.
3. Preserve logs and evidence before changing systems. Do not paste secrets into
   tickets, chat, or screenshots.
4. For suspected account compromise, revoke affected sessions immediately.
5. For suspected money manipulation, pause confirmations, withdrawals, payouts,
   report credits, and reconciliation imports until ledger integrity is proven.
6. For a leaked secret, revoke it at the provider before issuing a replacement.

## Containment

1. Identify affected identities, routes, records, providers, and time range.
2. Restrict access at the narrowest effective boundary. Do not delete evidence.
3. Rotate compromised credentials in this order: Git/Vercel, database, session
   signing, admin login/TOTP, email, payment/webhook, storage, monitoring.
4. Changing a session-signing secret intentionally invalidates all matching
   browser sessions. Record the exact rotation time in the incident timeline.
5. If database integrity is uncertain, switch money operations to read-only and
   compare `MoneyOperation`, ledger entries, deposits, withdrawals, reports, and
   AuditLog before resuming writes.

## Recovery

1. Recover into an isolated environment first. Never overwrite the only copy.
2. Validate schema version, row counts, foreign keys, audit continuity, document
   hashes, and money reconciliation totals.
3. Test admin login with MFA and investor login/session revocation.
4. Test one read-only investor journey before enabling mutations.
5. Re-enable operations in order: reads, support, documents, reports, deposits,
   allocations, withdrawals, payouts.
6. Record recovery point, recovery time, validation evidence, and approver.

## Notifications

1. Legal/privacy owner determines whether regulators, investors, insurers, law
   enforcement, or providers must be notified and by what deadline.
2. Communications must state confirmed facts, affected period, user action, and
   next update time. Do not speculate or conceal known material impact.
3. Preserve a copy of every external notification in the incident record.

## Closure

1. Confirm containment, credential rotation, data integrity, money integrity,
   monitoring, and owner approval before closing.
2. Produce a blameless postmortem within five business days.
3. Track every corrective action with an owner and deadline.
4. Run a tabletop exercise at least quarterly and a restore drill at least twice
   per year. A written plan without a completed exercise is not proof of readiness.
