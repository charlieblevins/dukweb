var NounProject = require('the-noun-project'),
    nounProject = new NounProject({
        key: '64b51b270edc449994250cee62d95ad9',
        secret: '61021a64c5b748d6ba02e6e22a143098'
    });

nounProject.getIconsByTerm('dog', {limit: 1}, function (err, data) {

    if (err) {
        throw new Error('Error communicating with noun project: ' + err); 
    }

    console.log(data);

});
