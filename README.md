PSNNodeJS
=========

Node.js library for polling the Playstation Network for user information.

**Featured Functions**
* getJID (Returns the user's JID and region from a PSN username)
* getProfile (Returns the user's profile information)
* getTrophyCount (Returns the amount of trophies a user has)
* getGames (Returns the recent games a player has played)
* getTrophies (Returns what trophies a user has scored for a particular game)

**Usage Example**
```javascript
var psn = require('psn-node');
var little_big_planet = 'NPWR00160_00';

psn.getJID('egsrit', function(err, user_obj) {
	console.log('JID: ' + user_obj['jid']);
	console.log('Region: ' + user_obj['region']);

	psn.getProfile(user_obj, function(err, profile) {
		console.log(profile['name'] + "'s PSN avatar is " + profile['avatar']);
		psn.getTrophyCount(user_obj, function(error, tcount) {
			console.log(profile['name'] + ' has ' + tcount['total'] + ' trophies');
		});
		psn.getGames(user_obj, function(err, games) {
			if(!games) return;
			games.forEach(function(val, index, arr) {
				console.log(profile['name'] + ' has played game #' + val['npcommid']);
			});
		});
		psn.getTrophies(user_obj, little_big_planet, function(err, trophies) {
			if(!trophies) return;
			trophies['trophies'].forEach(function(val, index, arr) {
				console.log(profile['name'] + ' achieved trophy #' + val['id'] + ', which was a ' + val['type'] + ' trophy');
			});
		});
	});
});
```
Please feel free to [contact](mailto:andrew at andrewmkane dot com) [me](http://andrewmkane.com) if you have any issues.
I also graciously used the [EGSRIT](http://www.egsrit.com) account for demonstration purposes.
