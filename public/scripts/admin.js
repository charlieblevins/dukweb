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

    get_marker_json();
})();
