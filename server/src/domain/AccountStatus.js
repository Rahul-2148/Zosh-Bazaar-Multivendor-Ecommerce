// freeze: makes the object immutable (no add/update/delete allowed)
const AccountStatus = Object.freeze({
  PENDING_VERIFICATION: "PENDING_VERIFICATION", // Account is created but not yet verified
  ACTIVE: "ACTIVE", // Account is active and in good standing
  SUSPENDED: "SUSPENDED", // Account is temporarily suspended
  DEACTIVATED: "DEACTIVATED", // Account is deactivated by the user
  BANNED: "BANNED", // Account is permanently banned
  CLOSED: "CLOSED", // Account is permanently closed
});

export default AccountStatus;
