(function () {

    if (!inIOS()) return false; 

	// When a user signs in - send a message to the ios app
	onSignIn(sendSignInMessage);


	function onSignIn (callback) {
		var si_btn = document.querySelector('button[type="submit"]');	
		si_btn.addEventListener('click', sendSignInMessage);
	}

	function sendSignInMessage () {

		if (!window.webkit.messageHandlers.signInClicked) return false

        var cred = getCredVals();

        if (!cred) return;

		var messageToPost = {
			'action': 'loginAttempt',
			'username': cred.username,
			'password': cred.password
		};
		window.webkit.messageHandlers.signInClicked.postMessage(messageToPost);
	}

    function getCredVals () {

		var username;
        
        // login
        if (document.querySelector('input[name="username"]')) {
            username = document.querySelector('input[name="username"]').value;

        // new account registration
        } else {
            username = document.querySelector('input[name="email"]').value;
        }

        var password = document.querySelector('input[name="password"]').value;

        if (!username || !password) return false;

        return {
            username: username,
            password: password
        };
    }

	/**
	 * Returns true if in ios, false if not
	 */
	function inIOS () {
		if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers) {
			return true;
		} else {
			return false;
		}
	}

})();
