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

    // password. 30000 is arbitrary number
    console.log('password guesses estimate: ' + strength.guesses);
    if (strength.guesses > 30000) return false;

    // Add warning if exists
    msg += (strength.feedback.warning) ? strength.feedback.warning + '. ' : '';

    // Add suggestions
    strength.feedback.suggestions.forEach((part) => {
        msg += part + ' ';
    });

    return msg;
};
