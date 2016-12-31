(function () {

    function get_marker_json (e) {
        var url = '/api/admin/marker-unapproved';
        load(url, jsonHandler.bind(null));
    }

    function load (url, callback) {
        var xhr = new XMLHttpRequest(),
            json;

        xhr.onreadystatechange = xhrHandler.bind(xhr, callback);

        xhr.open('GET', url, true);
        xhr.send('');
    }

    function xhrHandler (callback) {
        if (this.readyState < 4) {
            return;
        }

        if (this.status !== 200) {
            return;
        }

        if (this.readyState === 4) {
            callback(this.response);
        }
    }

    /**
     * Receive json data and inject in view
     */
    function jsonHandler (json) {
        var data;

        if (!json) return false;

        try {
            data = JSON.parse(json).data;
        } catch (e) {
            return console.log('Failed to parse JSON: ' + e);
        }

        // Photo
        if (data.photo_hash) {
            load_img(data.photo_hash);
        } else {
            console.log('No photo hash received with this marker');
        }

        // Tags & Icons
        if (data.tags) {
            load_icons(data.tags);
            show_tags(data.tags);
        } else {
            console.log('No icons since there are no tags');
        }

        // Map
        if (data.geometry && data.geometry.coordinates) {
            load_map(data.geometry.coordinates);
        } else {
            console.log('No coordinates received');
        }

        // User
        if (data.user_info) {
            show_user(data.user_info);
        } else {
            console.log('No coordinates received');
        }

        // Approval Status 
        if (data.approved !== undefined) {
            show_status(data.approved);
        } else {
            console.log('No approval status received');
        }

        // Set marker id to display AND approval form
        if (data._id !== undefined) {
            set_marker_id(data._id);
        } else {
            console.log('no marker id received');
        }
    }

    function load_img (photo_hash) {
        var img_node = document.getElementById('img');
        img_node.src = '/photos/' + photo_hash + '_md.jpg';
    }

    function load_icons (tags) {
        var icons_container = document.getElementById('icons');
        
        if (!tags || !tags.length) return false;

        tags.forEach(function (tag) {
            var img = document.createElement('img');
            img.src = 'icons/' + tag + '@2x.png';
            icons_container.append(img);
        });
    }

    function show_tags(tags) {
        var tags_container = document.getElementById('tags'),
            tag_str;

        if (!tags || !tags.length) return false;
        tag_str = tags.join(', ');

        tags_container.append(document.createTextNode(tag_str));
    }

    function load_map (coords) {
        var map_container = document.getElementById('map'),
            gm,
            map,
            latLng,
            marker;

        if (!google || !google.maps || !google.maps.Map) return false;
        gm = google.maps;

        if (!coords || coords.length !== 2) return false;
        latLng = new gm.LatLng(coords[1], coords[0]);

        map = new gm.Map(map_container, {
            center: latLng,
            zoom: 14
        });

        marker = new gm.Marker({
            position: latLng,
            map: map
        });
    }

    function show_user (user_info) {
        var username_elem,
            signup_elem;

        if (!user_info) return false;

        username_elem = document.getElementById('username');
        username_elem.innerText = user_info.username;
        signup_elem = document.getElementById('user_signup');
        signup_elem.innerText = user_info.createdDate;
    }

    function show_status (stat) {
        var div = document.getElementById('approval');
        if (!div) return false;
        div.innerText = stat.toLocaleString();
    }

    function set_marker_id (id) {
        if (!id) return false;
        var input = document.getElementById('marker_id');
        input.value = id;
        var display = document.getElementById('id_display');
        display.innerText = id;
    }

    /**
     * Send approval update request to server
     * @param approved {bool} - true for approved, false for deny
     */
    function update_approval (approved, e) {
        e.preventDefault();

        // gather approval, marker_id, and reason
        var data = {
            'approved': approved,
            'marker_id': document.getElementById('marker_id').value
        };

        if (data.approved === undefined) {
            return alert('Cannot send. Missing approval data');
        }

        if (data.marker_id === undefined) {
            return alert('Cannot send. Missing marker id');
        }

        // ajax post
        var http = new XMLHttpRequest();
        var url = '/api/admin/set-approval';
        var params = 'approved=' + data.approved + '&marker_id=' + data.marker_id;

        http.open('POST', url, true);

        //Send the proper header information along with the request
        http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

        http.onreadystatechange = function() {//Call a function when the state changes.
            if(http.readyState == 4) {

                // Load next marker on success
                if (http.status === 200) {
                    get_marker_json();
                } else {
                    alert(http.responseText);
                }
            }
        }
        http.send(params);
    }

    get_marker_json();

    // Listen to clicks on approve/deny
    var approve = document.getElementById('approve');
    approve.addEventListener('click', update_approval.bind(null, true));

    var deny = document.getElementById('deny');
    deny.addEventListener('click', update_approval.bind(null, false));
})();
