var mongoose = require('mongoose');

var user = {
    username: String,
    password: String,
    email_verification: {
        code: String,
        expiration: { type: Date },
        verified: Boolean
    },
    isAdmin: { type: Boolean, default: false },
    createdDate: { type: Date, default: Date.now } 
};

var user_deleted = Object.assign({ orig_id: { type: mongoose.Schema.Types.ObjectId }}, user);

module.exports = {
    'User': mongoose.model('User', mongoose.Schema(user)),
    'UserDeleted': mongoose.model('UserDeleted', mongoose.Schema(user_deleted)),
}
