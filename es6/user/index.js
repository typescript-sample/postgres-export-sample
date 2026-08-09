export function toString(v) {
    return v.toISOString();
}
export const userModel = {
    id: {
        key: true,
        length: 11,
    },
    username: {
        length: 10,
        required: true,
    },
    email: {
        length: 31,
    },
    phone: {
        length: 20,
    },
    status: {
        length: 5,
        type: "boolean",
    },
    createdDate: {
        length: 10,
        type: "date",
        column: "createddate",
        getString: toString
    },
};
