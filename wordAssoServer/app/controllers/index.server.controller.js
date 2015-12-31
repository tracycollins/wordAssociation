exports.render = function(req, res) {
    res.render('index', {
    	title: 'blackLivesMatter',
    	tweet: req.tweet ? req.tweet.tweetId : ''
    });
};