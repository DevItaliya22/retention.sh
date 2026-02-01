insta auto dm

online menu

Cashier email is unique per business only (Cashier.email + @@unique(businessId, email)); User.email is null for cashiers; two businesses can have cashiers with the same email.

colour sky

enter doesnot work in multi step form , password fields are shittyand need eye button , dont worry you can chnage it later in cahsier password

IMP :

older sessions should be removed frm the broswer , means if the token is invalid in cookies then it should be deleetd so it can send the user to login page

means having no cookie or having fals cookie should act same

8. One source of truth for shared contracts
   Types, API shapes, and validation live in shared packages (e.g. @reelo/db, schemas) so frontend and backend (and other apps) don’t drift. You’re already doing this with packages.
   Why: Prevents “API returns X but frontend expects Y.” The repo structure (and discipline to “change the contract in one place”) is the concept.

1. Impossible states unrepresentable
   Most bugs come from invalid state that the type system allows: e.g. loading: true and error: 'Something went wrong' at once, or data: null while status: 'success'.
   Peak move: Model state so invalid combinations can’t be expressed in types.
   // Weak: invalid combos possibletype State = { loading: boolean; error?: string; data?: T };// Strong: only valid combos existtype State<T> = | { status: 'idle' } | { status: 'loading' } | { status: 'success'; data: T } | { status: 'error'; error: Error };
   Then you exhaust in switch/if: no “what if we’re loading and have error?”. Used heavily in Elm, Rust, and serious TS codebases. Apply this to every major piece of UI state (forms, tables, wizards) and you remove whole classes of bugs.

1. Dependency inversion at the edges
   App code shouldn’t depend on Prisma, Better Auth, or Stripe. It should depend on your own small interfaces; the concrete libs live behind those.
   Example: lib/ports/db.ts defines getBill(id), listBills(...). packages/prisma (or a thin adapter) implements it. Your pages/hooks only see the port. If you swap Prisma for Drizzle or a different DB, you change one adapter, not 50 files.
   Peak move: Core/domain and app code import only from @/lib/ports (or a core package). No import { db } from '@reelo/db' in feature code—only in the adapter. Same idea for auth, payments, email. That’s dependency inversion at the edges; it’s what makes big rewrites and A/B backends feasible.
