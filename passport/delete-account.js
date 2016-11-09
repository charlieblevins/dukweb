var user_models = require('../models/user');
var User = user_models.User;
var UserDeleted = user_models.UserDeleted;

module.exports = function (req, res, next) {

    if (!req.user) {
        console.log('no user logged in');
        return res.status(200).render('index', {message: 'Apologies. Your session has expired. Please login again.'});
    }
    
    // Verify typed delete is correct
    if (req.body['type-delete'] !== 'Delete') {
        var msg = 'This field must contain "Delete".';
        
        if (req.body['type-delete'] !== '') {
            msg += ' You entered: "' + req.body['type-delete'] + '".';
        }

        console.log(msg);
        return res.status(200).render('delete-account', {'type_delete': msg});
    }

    // Check box must confirm delete
    if (req.body['confirm-check'] !== 'confirmed') {
        console.log(req.body);
        var msg = 'Confirm deletion by checking the box above.';
        console.log(msg);
        return res.status(200).render('delete-account', {'confirm_check': msg});
    }

    // Form is valid. Delete account 
    User.findOne({'username': req.user.username}, function (err, user) {

        if (err) {
            console.log('Error finding user to delete: ', err);
            return res.status(500).render('delete-account', {message: 'A system error occurred. Please try again'});
        }

        // Make an entry in deleted users with properties of this existing one
        var user_del = Object.assign(new UserDeleted(), user);
        
        user_del.save((err) => {
            if (err) {
                console.log('Could not save deleted user: ', err);
                return res.render('/code-entry', {message: 'An internal error occurred. Code 1'});
            }

            // Finally, delete user
            user.remove();

            console.log('User deletion successful.');
            req.flash('message', 'Your account was successfully deleted');
            return res.redirect('/');
        });
    });
}

// Code 1
// Failed to save user's verification flag as true
