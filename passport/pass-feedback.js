var zxcvbn = require('zxcvbn');

/**
 * Return feedback about a password ONLY if it
 * is not sufficient. False return value indicates
 * a sufficient password.
 */
module.exports = function passFeedback (password) {
    var msg = '',
        strength = zxcvbn(password);

    if (!strength) return 'Invalid password';

    if (!strength.feedback || strength.score === undefined) return 'Invalid password';

    // password secure
    console.log('password score: ' + strength.score);
    if (strength.score > 1) return false;

    // Add warning if exists
    msg += (strength.feedback.warning) ? strength.feedback.warning + '. ' : '';

    // Add suggestions
    strength.feedback.suggestions.forEach((part) => {
        msg += part + ' ';
    });

    return msg;
};
