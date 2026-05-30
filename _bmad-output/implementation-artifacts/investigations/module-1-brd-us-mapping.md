# Module 1 BRD To User Story Mapping

## Case Info

| Field | Value |
| --- | --- |
| Date | 2026-05-24 |
| Scope | Module 1: Lanh dao / Executive |
| Sources | `_bmad-output/planning-artifacts/epics.md`, `_bmad-output/implementation-artifacts/sprint-status.yaml` |

## Conclusion

Current UI is not yet the accepted full BRD implementation for Module 1. Sprint status shows only Epic 1 foundation stories 1.1-1.4 are done; story 1.5 and Epics 2-8 are still backlog.

## Mapping

| BRD section | Primary stories | Current status |
| --- | --- | --- |
| 1.1 Dashboard Tong Quan | 2.1, 2.2, 2.3, 2.7 | Backlog |
| 1.2 Executive Morning Briefing | 2.4; AI foundation in 8.1, 8.2 | Backlog |
| 1.3 Executive Common Center | 2.5 | Backlog |
| 1.4 Executive Private Workspace | 2.1, 2.6, 2.7; delegation foundation in 1.4 | 1.4 done, UI backlog |
| 1.5 Approval Center | 3.1, 3.2, 3.3, 3.4, 3.5; policy foundation in 1.3 | 1.3 done, Approval Center backlog |
| 1.6 Decision & Assignment Center | 4.1, 4.2, 4.3, 4.4; meeting decision tracking in 6.6 | Backlog |
| 1.7 Risk & Alert Center | 5.1, 5.2, 5.3, 5.4, 5.5; risk policy foundation in 1.3 | 1.3 done, Risk Center backlog |
| 1.8 Meeting Center | 6.1, 6.2, 6.3, 6.4, 6.5, 6.6 | Backlog |
| 1.9 History & Archive Center | 7.1, 7.2, 7.3, 7.4 | Backlog |
| 1.10 Executive AI Center | 8.1, 8.2, 8.3, 8.4 | Backlog |
| 1.11 Quan Tri Chu Tich / BO Settings | 1.1, 1.2, 1.3, 1.4; acceptance seed data in 1.5 | 1.1-1.4 done, 1.5 backlog |

## Evidence

- `epics.md:235-258` maps Dashboard, Morning Briefing, Common Center and Private Workspace to Epic 2.
- `epics.md:259-277` maps Approval Center to Epic 3.
- `epics.md:278-285` maps Decision & Assignment Center to Epic 4.
- `epics.md:286-303` maps Risk & Alert Center to Epic 5.
- `epics.md:304-313` maps Meeting Center to Epic 6.
- `epics.md:314-318` maps History & Archive Center to Epic 7.
- `epics.md:319-324` maps Executive AI Center to Epic 8.
- `epics.md:325-334` maps BO Settings and delegation foundation to Epic 1.
- `sprint-status.yaml` shows 1.1-1.4 done, 1.5 backlog, and Epics 2-8 backlog.
