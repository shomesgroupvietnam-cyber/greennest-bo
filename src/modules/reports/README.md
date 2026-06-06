# Reports Module

Reporting Lite supports management snapshots generated from existing MVP data:

- Weekly project summary.
- Document readiness report.
- Legal status report.
- History & Archive Center service.

Reports are stored snapshots. Detail pages must read from the stored snapshot, not recompute live data. PDF/DOCX export, advanced analytics, AI summaries, portfolio reporting and risk dashboards remain future work.

History & Archive Center is a live aggregate timeline, not a stored report snapshot. It reads scoped proposal approval history, decision versions/assignments, meetings, document versions, audit logs and external search logs through existing services/repositories, then serializes only permission-safe event summaries for the UI.
