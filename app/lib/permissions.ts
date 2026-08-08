import type { Admin } from "@/stores/auth.store";

export type AdminRole = Admin["role"];

/**
 * Which roles the backend actually lets through, per UI capability.
 *
 * These mirror the `@AdminRoles(...)` guards in backend-basti-service. The
 * point is to never render a link or button whose request the API will reject:
 * a hidden control is a better answer than a red "not allowed to access this
 * resource" banner on a page the user was invited to open.
 *
 * Keep an entry here in sync with its controller decorator — if the backend
 * widens a guard, widening it here is what surfaces the feature.
 */
const CAPABILITY_ROLES = {
  /**
   * The whole admins module is super_admin-only, list included
   * (admin-auth.controller: create / :id/block / :id/update / :id DELETE / GET).
   * Because even the read is gated, the nav entry and route must both go.
   */
  manageAdmins: ["super_admin"],
  /**
   * Driver *writes* only (driver.controller: POST / :id/block / :id/update /
   * :id/due-amount / :id DELETE). Reads stay open to admin, so driver lists and
   * detail pages remain visible — just without the mutating controls.
   */
  writeDrivers: ["super_admin"],
  /**
   * The cross-bakery management area (regions, bakeries, chefs, products,
   * finance). The sidebar already hides these from a manager via
   * `canViewAllContent`, but the routes stayed reachable by URL — and
   * `GET /bakeries` is unguarded server-side, so a manager who landed there
   * really did get the full list back. Mirrors `canViewAllContent`.
   */
  viewAllContent: ["super_admin", "admin"],
} as const satisfies Record<string, readonly AdminRole[]>;

export type Capability = keyof typeof CAPABILITY_ROLES;

/** Whether `role` may use `capability`. A signed-out user (null) may not. */
export function roleCan(
  role: AdminRole | null | undefined,
  capability: Capability,
): boolean {
  if (!role) return false;
  return (CAPABILITY_ROLES[capability] as readonly AdminRole[]).includes(role);
}

/** The roles allowed through a capability, for `ProtectedRoute requiredRole`. */
export function rolesFor(capability: Capability): readonly AdminRole[] {
  return CAPABILITY_ROLES[capability];
}
