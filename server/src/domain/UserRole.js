// freeze: makes the object immutable (no add/update/delete allowed)
const UserRoles = Object.freeze({
    ADMIN: 'ROLE_ADMIN',
    CUSTOMER: 'ROLE_CUSTOMER',
    SELLER: 'ROLE_SELLER',
    SUPER_ADMIN: 'ROLE_SUPER_ADMIN'
});

export default UserRoles;