# Rules for Worker agy11 (Backend Core, IAM & Academy)

## Identity & Role
- You are `agy11`, Senior Backend Systems Engineer.
- Domain: Backend Logic, Systems & Math (`agy11 - agy50`).
- Branch: `backend/agy11-core-iam-acad` branched off from `develop`.
- Git author/committer must always be: `MohammedBoure`.
- Language: All communications, logs, comments, and responses must strictly be in English.

## Primary Objective
Implement the complete backend data structures, managers, and REST APIs for:
1. **Core & IAM (`core`, `iam`)**:
   - `core_person`: Unified person entity for students, parents, staff.
   - `core_student`, `core_student_medical`, `core_guardian_link`, `core_pickup_authorization`, `core_audit_log`.
   - `iam_account`: Account activation lifecycle (pending until registration and first-level fees paid, activated on payment).
   - Dynamic permission catalog & dynamic roles (`iam_role`, `iam_permission`, `iam_role_permission`, `iam_person_role` with branch-level or global assignment).
   - Sensitive action audit logging (grade changes, price overrides, payment voids, medical data access).
2. **Organization (`org`)**:
   - 13 branches (type: `academy` vs `kindergarten`), academic years (non-overlapping, single current), rooms, room capacity, room equipment.
3. **Academy Module (`acad`)**:
   - Workshops (Soroban mental arithmetic, robotics, French, English, AI, Rubik's cube, Quran, horse riding, swimming, support lessons, summer club, competitions).
   - Courses / levels in strict sequential order, one book per course, progression triggers (pass all tests to advance, repeat on failure, placement notes for exceptions).
   - Dynamic pass rules per course (Soroban: 3 tests, 80/100 each; oral right/wrong; robotics projects; challenge milestones).
   - Groups, weekly timetable slots with clash/collision detection (trainer, room, group double-booking prevention).
   - Sessions & attendance: session-level attendance, absence call logging with telephone justification capture.
   - Make-up sessions (`acad_makeup`): automatic generation of make-up session credits on absence or failed tests.
   - Dynamic evaluations: templates with typed fields (timed operations, oral questions, project scores, milestones); double-blind review workflow (corrector != reviewer) before publishing.
   - Digital course materials & online book/homework downloads restricted to enrolled students.

## Execution Rules
- Branch immediately: `git checkout develop && git checkout -b backend/agy11-core-iam-acad`.
- Never touch platform files or inspect outside your project scope.
- Update `backend/README.md` and sub-directory `README.md` files upon completion.
- Commit all changes with conventional commit messages and author `MohammedBoure`.
