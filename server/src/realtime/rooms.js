/**
 * ZOSH BAZAAR REALTIME ROOM GOVERNANCE & ACCESS CONTROL (Phase 14 - Section 3 & 5)
 *
 * Enforces room isolation:
 * - Customer A cannot join customer_B
 * - Seller A cannot join seller_B
 * - Delivery Agent A cannot join agent_B
 * - Guests cannot join any private room
 * - Non-admins cannot join admin_room or logistics_control_tower
 */

export const ROOMS = Object.freeze({
  ADMIN: "admin_room",
  LOGISTICS_TOWER: "logistics_control_tower",
});

export const getCustomerRoom = (userId) => {
  return userId ? `customer_${String(userId).trim()}` : null;
};

export const getSellerRoom = (sellerId) => {
  return sellerId ? `seller_${String(sellerId).trim()}` : null;
};

export const getAgentRoom = (agentId) => {
  return agentId ? `agent_${String(agentId).trim()}` : null;
};

export const getAdminRoom = () => ROOMS.ADMIN;
export const getLogisticsTowerRoom = () => ROOMS.LOGISTICS_TOWER;

/**
 * Authoritative Room Authorization Guard (Section 5)
 * Derives permissions strictly from cryptographically verified socket identity.
 */
export const canJoinRoom = (socketUser, requestedRoom) => {
  if (!requestedRoom || typeof requestedRoom !== "string") {
    return false;
  }

  // Section 4: Guests are strictly denied access to all private channels
  if (!socketUser || socketUser.isGuest || !socketUser.authenticated) {
    return false;
  }

  const role = String(socketUser.role || "").toUpperCase();
  const userId = socketUser._id ? String(socketUser._id) : null;
  const sellerId = socketUser.sellerId ? String(socketUser.sellerId) : userId;
  const agentId = socketUser.agentId ? String(socketUser.agentId) : userId;

  const isAdmin =
    role === "ROLE_ADMIN" ||
    role === "ROLE_SUPER_ADMIN" ||
    role === "ADMIN" ||
    role === "SUPER_ADMIN";

  const isLogisticsOperator =
    isAdmin || role === "ROLE_LOGISTICS_OPERATOR" || role === "LOGISTICS_OPERATOR";

  const isSeller = role === "ROLE_SELLER" || role === "SELLER";
  const isAgent = role === "ROLE_DELIVERY_AGENT" || role === "DELIVERY_AGENT";

  // 1. Platform Administration Console
  if (requestedRoom === ROOMS.ADMIN) {
    return isAdmin;
  }

  // 2. Logistics Control Tower (Only Admins, Operators, and assigned Delivery Agents)
  if (requestedRoom === ROOMS.LOGISTICS_TOWER) {
    return isLogisticsOperator || isAgent;
  }

  // 3. Multi-Vendor Isolation: Seller A cannot join Seller B
  if (requestedRoom.startsWith("seller_")) {
    const targetSellerId = requestedRoom.slice(7); // "seller_".length === 7
    if (isAdmin) return true;
    if (isSeller && (targetSellerId === sellerId || targetSellerId === userId)) {
      return true;
    }
    return false;
  }

  // 4. Customer Isolation: Customer A cannot join Customer B
  if (requestedRoom.startsWith("customer_")) {
    const targetCustomerId = requestedRoom.slice(9); // "customer_".length === 9
    if (isAdmin) return true;
    if (targetCustomerId === userId) {
      return true;
    }
    return false;
  }

  // 5. Last-Mile Agent Isolation: Agent A cannot join Agent B
  if (requestedRoom.startsWith("agent_")) {
    const targetAgentId = requestedRoom.slice(6); // "agent_".length === 6
    if (isAdmin || isLogisticsOperator) return true;
    if (isAgent && (targetAgentId === agentId || targetAgentId === userId)) {
      return true;
    }
    return false;
  }

  return false;
};

/**
 * Returns list of authorized rooms to automatically join on authenticated connection
 */
export const getAuthorizedUserRooms = (socketUser) => {
  if (!socketUser || socketUser.isGuest || !socketUser.authenticated) {
    return [];
  }

  const role = String(socketUser.role || "").toUpperCase();
  const userId = socketUser._id ? String(socketUser._id) : null;
  const sellerId = socketUser.sellerId ? String(socketUser.sellerId) : userId;
  const agentId = socketUser.agentId ? String(socketUser.agentId) : userId;

  const isAdmin =
    role === "ROLE_ADMIN" ||
    role === "ROLE_SUPER_ADMIN" ||
    role === "ADMIN" ||
    role === "SUPER_ADMIN";

  const isLogisticsOperator =
    isAdmin || role === "ROLE_LOGISTICS_OPERATOR" || role === "LOGISTICS_OPERATOR";

  const isSeller = role === "ROLE_SELLER" || role === "SELLER";
  const isAgent = role === "ROLE_DELIVERY_AGENT" || role === "DELIVERY_AGENT";

  const authorizedRooms = [];

  if (isAdmin) {
    authorizedRooms.push(ROOMS.ADMIN);
    authorizedRooms.push(ROOMS.LOGISTICS_TOWER);
  }

  if (isLogisticsOperator && !isAdmin) {
    authorizedRooms.push(ROOMS.LOGISTICS_TOWER);
  }

  if (isSeller && sellerId) {
    authorizedRooms.push(getSellerRoom(sellerId));
  }

  if (isAgent && agentId) {
    authorizedRooms.push(getAgentRoom(agentId));
    authorizedRooms.push(ROOMS.LOGISTICS_TOWER);
  }

  // Regular customer or admin previewing customer channel
  if (!isSeller && !isAgent && userId) {
    authorizedRooms.push(getCustomerRoom(userId));
  }

  return authorizedRooms.filter(Boolean);
};
