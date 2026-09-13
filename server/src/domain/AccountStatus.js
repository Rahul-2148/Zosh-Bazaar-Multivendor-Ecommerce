// freeze: makes the object immutable (no add/update/delete allowed)
const AccountStatus = Object.freeze({
  PENDING_VERIFICATION: "PENDING_VERIFICATION", // Account is created but not yet verified
  ACTIVE: "ACTIVE", // Account is active and in good standing
  SUSPENDED: "SUSPENDED", // Account is temporarily suspended
  DEACTIVATED: "DEACTIVATED", // Account is deactivated by the user
  BANNED: "BANNED", // Account is permanently banned
  CLOSED: "CLOSED", // Account is permanently closed
  DELETION_REQUESTED: "DELETION_REQUESTED", // User has requested permanent deletion (grace period active)
  DELETION_SCHEDULED: "DELETION_SCHEDULED", // Grace period expired, deletion is queued for processing
  DELETING: "DELETING", // Deletion worker is actively processing data removal
  DELETED: "DELETED", // Account has been permanently deleted/anonymized
});

// States that allow normal shopping/account actions
export const ACTIVE_STATES = [AccountStatus.ACTIVE];

// States where user can still log in (to cancel deletion or reactivate)
export const LOGIN_ALLOWED_STATES = [
  AccountStatus.ACTIVE,
  AccountStatus.DELETION_REQUESTED,
  AccountStatus.DELETION_SCHEDULED,
];

// States where account is effectively terminated
export const TERMINATED_STATES = [
  AccountStatus.DELETING,
  AccountStatus.DELETED,
  AccountStatus.BANNED,
];

export default AccountStatus;
