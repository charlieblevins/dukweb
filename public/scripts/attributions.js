(function () {

    function bind () {
        var lis = document.querySelectorAll('.attribution');

        lis.forEach(function (li) {
            li.addEventListener('click', get_attrib_json);
        });
    }

    function get_attrib_json (e) {
        var li = e.currentTarget;
        var noun = li.id;
        console.log('get ' + noun);

        var url = '/icon-attributions/' + noun;
        load(url, jsonHandler.bind(null, noun));
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

    function jsonHandler (noun, json) {
        console.log(noun, json);

        if (!noun || !json) return false;

        var li = document.getElementById(noun);

        var container = document.createElement('div');
        container.classList.add('attribution-content');
        li.append(container);

        try {
            var data = JSON.parse(json);
        } catch (e) {
            console.log('could not parse json: ' + json);
        }

        var img = document.createElement('img');
        img.src = '/icons/' + noun + '@3x.png';
        container.append(img);

        var attrib = document.createElement('caption');
        attrib.innerText = data.attribution;
        container.append(attrib);
    }

    bind();
})();
