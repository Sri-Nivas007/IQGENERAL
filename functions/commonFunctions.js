function isValidUsername(username) {
    return username && username.length >= 3;
}

function isValidPhoneNumber(phoneNumber) {
    console.log("phoneNumber", phoneNumber);

    return phoneNumber && /^\d{10}$/.test(phoneNumber);
}

function isValidPassword(password) {
    return password && password.length >= 6;
}

module.exports = { isValidUsername, isValidPhoneNumber, isValidPassword };
