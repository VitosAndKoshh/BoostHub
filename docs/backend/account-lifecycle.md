# User, Account, Customer, and Booster Lifecycle

This document describes the intended domain responsibilities, status boundaries, and access rules for the person and marketplace profiles in BoostHub.

It distinguishes behavior that is already represented in the current backend from proposed lifecycle decisions that still require product or moderation approval.

## 1. Domain Responsibilities and Relationships

### User

A `User` represents the authentication identity of a person. It owns credentials and can have multiple role assignments through `UserRoleEntity`.

The current role model contains the `Consumer`, `Booster`, and `Admin` role categories. A role expresses eligibility or capability; it does not express whether that capability is currently available.

The intended relationship is:

```text
User 1 ─── 1 Account
User 1 ─── * UserRole
```

Current implementation note: the backend does not currently have a direct `UserEntity.AccountId` relationship. Registration creates an Account and an `AccountIdentityEntity` whose provider identity references the User ID. A direct one-to-one User-to-Account relationship remains an architectural decision.

### Account

An `Account` is the person's business account on BoostHub. It is the parent boundary for marketplace profiles and external platform accounts.

The intended relationships are:

```text
Account 1 ─── 1 Customer
Account 1 ─── 0..1 Booster
Account 1 ─── * GamePlatformAccount
Booster 1 ─── * BoosterApplication
```

The current persistence model enforces the Customer and Booster cardinalities with unique `AccountId` indexes. `GamePlatformAccount` records are owned by Account and are selected for verification by booster applications. A `BoosterApplication` references its `Booster` through `BoosterId`; the selected platform account must belong to that Booster's Account and this ownership is validated by the application workflow.

### Customer

A `Customer` is the Account's customer profile. It represents access to customer-specific marketplace operations, such as creating or managing customer requests.

Customer creation is part of Account creation. Customer status is independent of User, Account, and Booster status.

### Booster

A `Booster` is the approved booster profile for an Account. It is separate from `BoosterApplication`:

- `BoosterApplication` represents the review request and its result.
- `Booster` represents the active business profile created after approval.

An Account can have no Booster. Approval of an application is a prerequisite for creating one.

`BoosterEntity` currently uses the shared `EntityStatus` lifecycle (`Active`, `Suspended`, `Banned`, and `Deactivated`). `Pending` belongs to `BoosterApplicationStatus`, not to the approved Booster profile.

## 2. Roles and Statuses

Roles and statuses answer different questions:

| Concept | Question answered | Example |
|---|---|---|
| User role | What may this User be eligible to do? | The User has the `Booster` role. |
| User status | May the identity access BoostHub at all? | The User is suspended. |
| Account status | May functionality under this Account be used? | The Account is banned. |
| Profile status | May this specific profile perform its operations? | The Customer is banned while the Booster remains active. |

Suspending or banning a Customer or Booster must not remove the corresponding UserRole. The role remains an eligibility assignment; the profile status controls current availability.

The `Booster` role should be assigned after successful BoosterApplication approval. `BoosterApplicationStatus` is independent of the Booster profile's `EntityStatus`; a rejected application does not represent a banned Booster, and an approved application does not by itself define the ongoing Booster profile status.

## 3. Proposed Status Types

The following status meanings are recommended. They are not currently implemented for all four entities.

### UserStatus

| Status | Meaning | Access and transitions |
|---|---|---|
| `Active` | The authentication identity may sign in and use otherwise-available Accounts. | Normal identity access. May transition to `Suspended`, `Banned`, or `Deleted` through an authorized administrative or account-lifecycle operation. |
| `Suspended` | Temporary restriction on identity access. | Sign-in and authenticated operations are blocked or limited according to the suspension policy. Restoration to `Active` should be possible. |
| `Banned` | A moderation or administrative prohibition on the identity. | Identity access is blocked. Restoration requires an explicit reinstatement decision; whether it is possible must be confirmed. |
| `Deleted` | The identity has been closed. | Identity access is permanently blocked. Whether this is soft deletion or irreversible deletion is unresolved. |

Recommended valid transitions:

```text
Active ──> Suspended ──> Active
Active ──> Banned
Active ──> Deleted
Suspended ──> Banned
Suspended ──> Deleted
Banned ──> Active       (only if reinstatement is explicitly allowed)
Banned ──> Deleted
```

`Deleted` should be terminal unless a separate restoration policy is approved.

### AccountStatus

| Status | Meaning | Access and transitions |
|---|---|---|
| `Active` | Account functionality is available, subject to User and profile statuses. | Customer, Booster, and Account operations may proceed when their other prerequisites are satisfied. |
| `Suspended` | Temporary restriction on the entire Account. | All Account functionality is blocked while the restriction is active. Restoration to `Active` should be possible. |
| `Banned` | The entire Account is prohibited from operating. | Customer and Booster operations are blocked even if their profile statuses are active. Reinstatement policy is unresolved. |
| `Deleted` | Account closure or deletion. | All Account functionality is blocked. The meaning of deletion and whether profiles are retained or physically removed are unresolved. |

An Account-level restriction is stronger than a profile-level restriction because it protects the whole business boundary.

### CustomerStatus

| Status | Meaning | Access and transitions |
|---|---|---|
| `Active` | Customer profile may perform customer operations. | Customer operations are available when User, Account, and Customer role requirements are satisfied. |
| `Suspended` | Temporary restriction on customer activity. | Customer operations are blocked; Booster operations are unaffected. Restoration to `Active` should be possible. |
| `Banned` | Customer profile is prohibited from customer activity. | Customer operations are blocked; Booster operations are unaffected. Reinstatement policy is unresolved. |
| `Deleted` | Customer profile is closed. | Customer operations are permanently unavailable unless restoration is explicitly supported. Booster activity may continue independently. |

### Booster profile status

| Status | Meaning | Access and transitions |
|---|---|---|
| `Active` | Approved Booster profile may perform booster operations. | Booster operations are available when User, Account, and Booster role requirements are satisfied. |
| `Suspended` | Temporary restriction on booster activity. | Booster operations are blocked; Customer operations are unaffected. Restoration to `Active` should be possible. |
| `Banned` | Booster profile is prohibited from booster activity. | Booster operations are blocked; Customer operations are unaffected. Reinstatement policy is unresolved. |
| `Deactivated` | Booster profile is closed. | Booster operations are unavailable. Customer activity may continue independently. |

`Pending` belongs to the application lifecycle, not the approved Booster profile.

## 4. Access Evaluation Rules

Access should be evaluated at the narrowest relevant boundary while respecting all higher-level restrictions:

### Identity-level access

1. The User must be `Active`.
2. A suspended, banned, or deleted User cannot use the platform through that identity.

### Account-level access

1. The User must be `Active`.
2. The Account must be `Active`.
3. The requested operation must be supported by an assigned UserRole and an active profile where applicable.

### Customer operation access

1. User is `Active`.
2. Account is `Active`.
3. User has the customer role.
4. Customer exists and is `Active`.

### Booster operation access

1. User is `Active`.
2. Account is `Active`.
3. User has the booster role.
4. Booster exists and is `Active`.

A profile restriction must not automatically change another profile's status. Higher-level restrictions still apply to every child operation.

## 5. Behavior Matrix

The following matrix assumes the required role is assigned and focuses on the independent status effects.

| User | Account | Customer | Booster | Customer operations | Booster operations |
|---|---|---|---|---|---|
| Active | Active | Active | Active | Allowed | Allowed |
| Active | Active | Banned | Active | Blocked | Allowed |
| Active | Active | Active | Suspended | Allowed | Blocked |
| Active | Banned | Active | Active | Blocked | Blocked |
| Banned | Active | Active | Active | Blocked | Blocked |
| Active | Active | Deleted | Active | Blocked | Allowed |
| Active | Active | Active | Deleted | Allowed | Blocked |
| Suspended | Active | Active | Active | Blocked | Blocked |
| Active | Suspended | Active | Active | Blocked | Blocked |

The same rules apply if a profile does not exist: an Account without a Booster cannot perform Booster operations, regardless of whether the User has the Booster role.

## 6. Lifecycle Ownership and Auditing

The domain should expose explicit transition methods rather than public status setters. Each transition method should:

- Verify that the current status permits the transition.
- Set related timestamps consistently.
- Require a reason where the moderation policy requires one.
- Preserve the independent status of sibling profiles.
- Produce or persist an audit record when the operation is important for moderation, security, or compliance.

The following ownership is intended but not yet finalized:

- User status transitions: account-security or administrative workflows.
- Account status transitions: administrative or account-lifecycle workflows.
- Customer status transitions: customer moderation or administrative workflows.
- Booster status transitions: booster moderation or administrative workflows.
- BoosterApplication transitions: reviewer workflow; the application entity already owns the review transition invariants.

Exact roles, permissions, review authority, audit schema, and reason requirements remain application decisions and should not be inferred from entity names.

## 7. Deletion and Restoration

`Deleted` should be treated as a lifecycle state until the deletion policy is defined. The current persistence model contains cascade relationships from Account to several child records, so physical Account deletion could remove related data. That behavior must not be assumed to represent the intended business meaning of `Deleted`.

The following decisions are unresolved:

- Whether User, Account, Customer, and Booster deletion is soft deletion, hard deletion, or a two-stage process.
- Whether a deleted User retains an Account for audit or legal purposes.
- Whether deleting an Account deletes, closes, or preserves Customer, Booster, GamePlatformAccount, and BoosterApplication records.
- Whether deleted Customer or Booster profiles can be restored.
- Whether a banned User or Account can be reinstated and who may authorize it.

Until these decisions are made, status transitions should not be implemented as destructive database operations.

## 8. Persistence and Domain Design Recommendations

### Recommended initial model

- Give each of User, Account, Customer, and Booster its own status enum because each status governs a different boundary.
- Keep status properties private and expose explicit transition methods.
- Keep `BoosterApplicationStatus` separate from the Booster profile's `EntityStatus`.
- Keep role assignments separate from profile statuses.
- Use application-level access evaluation to combine User, Account, role, and profile status.

### Defer unless required

The following fields may eventually be useful, but are not required for the initial model without approved requirements:

- `SuspendedUntil`
- `BanReason`
- `DeletionReason`
- `StatusChangedAt`
- `StatusChangedBy`
- Status history or audit entities

Status history will likely be needed for moderation and compliance, but introducing it should follow a defined audit policy rather than being inferred from the status enum alone.

## 9. Confirmed Decisions, Recommendations, and Open Questions

### Confirmed by the current implementation or established flow

- Registration creates a User, Account, AccountIdentity, and Customer.
- Users can hold multiple roles through `UserRoleEntity`.
- Customer and Booster are separate Account-owned profiles.
- An Account can own multiple GamePlatformAccounts.
- Booster applications are separate from Booster profiles.
- Customer and Booster profile restrictions are conceptually independent.

### Recommended decisions

- Use `Active`, `Suspended`, `Banned`, and `Deleted` for User, Account, Customer, and Booster, with semantics defined separately above.
- Treat `Deleted` as a terminal soft-deletion state until retention and deletion requirements are approved.
- Remove `Pending` from the eventual Booster status model; keep it on BoosterApplication.
- Require the applicable UserRole in addition to an active profile status.
- Preserve sibling profiles when one profile is suspended, banned, or deleted.

### Decisions requiring confirmation

1. Should User have a direct one-to-one Account foreign key, or should AccountIdentity remain the association?
2. Should `Deleted` be soft deletion, irreversible deletion, or a reversible closure state for each entity?
3. Can deleted User, Account, Customer, or Booster records be restored?
4. Who may suspend, ban, reinstate, or delete each entity, and which transitions require reasons?
5. Should a banned User or Account ever be restorable?
6. Should account deletion preserve BoosterApplication history and platform-account verification data, or may it physically cascade-delete them?
7. Should any additional Booster-profile lifecycle state be introduced beyond the current shared `EntityStatus` values?
8. Should status transitions create an audit history, and what information must that history retain?
