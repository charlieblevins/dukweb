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

		var username = document.querySelector('input[name="username"]').value;
		var password = document.querySelector('input[name="password"]').value;

		var messageToPost = {
			'username': username,
			'password': password
		};
		window.webkit.messageHandlers.signInClicked.postMessage(messageToPost);
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
