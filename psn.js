var request = require('request');
var parseXMLString = require('xml2js').parseString;

var jidCache = {};

var firmware = '3.70';
var basicLoginUser = 'c7y-basic01';
var basicLoginPass = 'A9QTbosh0W0D^{7467l-n_>2Y%JG^v>o';
var trophyLoginUser = 'c7y-trophy01';
var trophyLoginPass = 'jhlWmT0|:0!nC:b:#x/uihx\'Y74b5Ycx';

function submitPSNPOST(url, body, trophy, cb) {
	request.post(
		url,
		{
			headers: {
				'User-Agent' : 'PS3Community-agent/1.0.0 libhttp/1.0.0',
				'Content-Type' : 'text/xml; charset=UTF-8'
			},
			auth: {
				'user' : (trophy ? trophyLoginUser : basicLoginUser),
				'pass' : (trophy ? trophyLoginPass : basicLoginPass),
				'sendImmediately': false
			},
			body: body
		},
		function(error, response, data) {
			cb(error, response, data);
			return;
		}
	);
	
	return;
}

function getJID(username, cb) {
	if(username in jidCache) {
		if(cb) cb(undefined, jidCache[username]);
		return true;
	}

	var urls = {
		'us' : 'http://searchjid.usa.np.community.playstation.net/basic_view/func/search_jid',
		'gb' : 'http://searchjid.eu.np.community.playstation.net/basic_view/func/search_jid',
		'jp' : 'http://searchjid.jpn.np.community.playstation.net/basic_view/func/search_jid'
	};

	Object.keys(urls).forEach(function(key) {
		if(username in jidCache) return;
		submitPSNPOST(urls[key],
			"<?xml version='1.0' encoding='utf-8'?><searchjid platform='ps3' sv='" + firmware + "'><online-id>" + username + "</online-id></searchjid>",
			false, 
			function(error, response, data) {
				if(error) {
					if(cb) cb(error, data);
				} else if(response.statusCode == 200) {
					parseXMLString(data, function(err, result) {
						if(err) {
							if(cb) cb(err, result);
							return;
						}
						if(username in jidCache) return;
						if(result['searchjid']['jid']) {
							if(key == 'us' && result['searchjid']['jid'] && result['searchjid']['jid'][0].indexOf('us') === -1) {
								return;
							}
							if(key == 'jp' && result['searchjid']['jid'] && result['searchjid']['jid'][0].indexOf('jp') === -1) {
								return;
							}
							if(key == 'gb' && result['searchjid']['jid'] && (result['searchjid']['jid'][0].indexOf('us') !== -1 || result['searchjid']['jid'][0].indexOf('jp') !== -1)) {
								return;
							}
							jidCache[username] = {
								'region' : key,
								'jid' : result['searchjid']['jid'][0]
							};
							if(cb) cb(err, jidCache[username]);
						}
						return;
					});
				}
				return;
			}
		);
		return;
	});

	return true;
}

function getProfile(user_obj_jid, cb) {
	submitPSNPOST('http://getprof.' + user_obj_jid['region'] + '.np.community.playstation.net/basic_view/func/get_profile',
	"<profile platform='ps3' sv='" + firmware + "'><jid>" + user_obj_jid['jid'] + "</jid></profile>",
	false,
	function(error, response, data) {
		if(error) {
			if(cb) cb(error, data);
		} else if(response.statusCode == 200) {
			parseXMLString(data, function(err, result) {
				var profile = result['profile'];
				var obj = {
					'name' : ('onlinename' in profile) ? profile['onlinename'][0] : false,
					'country' : ('country' in profile) ? profile['country'][0] : false,
					'aboutme' : ('aboutme' in profile) ? profile['aboutme'][0] : false,
					'avatar' : ('avatarurl' in profile) ? profile['avatarurl'][0]['_'] : 'http://static-resource.np.community.playstation.net/avatar/default/DefaultAvatar.png',
					'color' : ('ucbgp' in profile) ? profile.ucbgp.slice(0, -8) : '989898ff',
					'psnplus' : ('plusicon' in profile) ? true : false
				};
				if(cb) cb(error, obj);
				return;
			});
		}
		return;
	});
	return;
}

function getTrophyCount(jid, cb) {
	if(jid instanceof Object) jid = jid['jid'];
	submitPSNPOST('http://trophy.ww.np.community.playstation.net/trophy/func/get_user_info',
	"<nptrophy platform='ps3' sv='" + firmware + "'><jid>" + jid + "</jid></nptrophy>",
	true,
	function(error, response, data) {
		if(error) {
			cb(error, data);
		} else if(response.statusCode == 200) {
			parseXMLString(data, function(err, result) {
				var trophy_count = result['nptrophy'];
				var platinum = 0;
				var gold = 0;
				var silver = 0;
				var bronze = 0;
				if('types' in trophy_count && '$' in trophy_count['types'][0]) {
					platinum = parseInt(('platinum' in trophy_count['types'][0]['$']) ? trophy_count['types'][0]['$']['platinum'] : 0);
					gold = parseInt(('gold' in trophy_count['types'][0]['$']) ? trophy_count['types'][0]['$']['gold'] : 0);
					silver = parseInt(('silver' in trophy_count['types'][0]['$']) ? trophy_count['types'][0]['$']['silver'] : 0);
					bronze = parseInt(('bronze' in trophy_count['types'][0]['$']) ? trophy_count['types'][0]['$']['bronze'] : 0);
				}
				var obj = {
					'points' : ('point' in trophy_count) ? trophy_count['point'][0] : false,
					'level' : ('level' in trophy_count) ? trophy_count['level'][0]['_'] : false,
					'base' : ('level' in trophy_count && '$' in trophy_count['level'][0] && 'base' in trophy_count['level'][0]['$']) ? trophy_count['level'][0]['$']['base'] : false,
					'next' : ('level' in trophy_count && '$' in trophy_count['level'][0] && 'next' in trophy_count['level'][0]['$']) ? trophy_count['level'][0]['$']['next'] : false,
					'progress' : ('level' in trophy_count && '$' in trophy_count['level'][0] && 'progress' in trophy_count['level'][0]['$']) ? trophy_count['level'][0]['$']['progress'] : false,
					'platinum' : platinum,
					'gold' : gold,
					'silver' : silver,
					'bronze' : bronze,
					'total' : (platinum + gold + silver + bronze)
				};
				if(cb) cb(error, obj);
				return;
			});
		}
		return;
	});
	return;
}

function getGames(jid, cb) {
	if(jid instanceof Object) jid = ['jid'];
	submitPSNPOST('http://trophy.ww.np.community.playstation.net/trophy/func/get_title_list',
	"<nptrophy platform='ps3' sv='" + firmware + "'><jid>" + jid + "</jid><start>1</start><max>1</max></nptrophy>",
	true,
	function(error, response, data) {
		if(error) {
			cb(error, data);
		} else if(response.statusCode == 200) {
			parseXMLString(data, function(err, result) {
				var arr = [];
				if('nptrophy' in result && 'list' in result['nptrophy'] && 'info' in result['nptrophy']['list'][0]) {
					var info = result['nptrophy']['list'][0]['info'][0];
					for(var prop in info) {
						var game = info[prop];
						var npcommid = ('npcommid' in game) ? game['npcommid'] : false;
						var platinum = 0;
						var gold = 0;
						var silver = 0;
						var bronze = 0;
						if('types' in game) {
							var types = game['types'][0]['$'];
							var platinum = parseInt(('platinum' in types) ? types['platinum'] : 0);
							var gold = parseInt(('gold' in types) ? types['gold'] : 0);
							var silver = parseInt(('silver' in types) ? types['silver'] : 0);
							var bronze = parseInt(('bronze' in types) ? types['bronze'] : 0);
						}
						var obj = {
							'npcommid' : npcommid,
							'game_id' : npcommid,
							'platinum' : platinum,
							'gold' : gold,
							'silver' : silver,
							'bronze' : bronze,
							'total' : (platinum + gold + silver + bronze),
							'lastupdated' : ('lastupdated' in game) ? game['lastupdated'] : false
						};
						arr.push(obj);
					}
				}
				if(cb) cb(error, arr);
				return;
			});
		}
		return;
	});
	return;
}

function getTrophies(jid, game_id, cb) {
	if(jid instanceof Object) jid = jid['jid'];
	var trophy_types = {
		'0' : 'bronze',
		'1' : 'silver',
		'2' : 'Gold',
		'3' : 'Platinum'
	};
	submitPSNPOST('http://trophy.ww.np.community.playstation.net/trophy/func/get_trophies',
	"<nptrophy platform='ps3' sv='" + firmware + "'><jid>" + jid + "</jid><list><info npcommid='" + game_id + "'><target>FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF</target></info></list></nptrophy>",
	true,
	function(error, response, data) {
		if(error) {
			cb(error, data);
		} else if(response.statusCode == 200) {
			parseXMLString(data, function(err, result) {
				if('nptrophy' in result && 'list' in result['nptrophy'] && 'info' in result['nptrophy']['list'][0]) {
					var info = result['nptrophy']['list'][0]['info'][0];
					var platinum = 0;
					var gold = 0;
					var silver = 0;
					var bronze = 0;
					if('types' in info) {
						var types = info['types'][0]['$'];
						platinum = parseInt(('platinum' in types) ? types['platinum'] : 0);
						gold = parseInt(('gold' in types) ? types['gold'] : 0);
						silver = parseInt(('silver' in types) ? types['silver'] : 0);
						bronze = parseInt(('bronze' in types) ? types['bronze'] : 0);
					}
					var obj = {
						'system' : ('$' in info && 'pf' in info['$']) ? info['$']['pf'] : false,
						'platinum' : platinum,
						'gold' : gold,
						'silver' : silver,
						'bronze' : bronze,
						'total' : (platinum + gold + silver + bronze),
						'lastupdate' : ('last-updated' in info) ? info['last-updated'][0] : false
					};
					var trophies = info['trophies'][0]['trophy'];
					var trophy;
					trophy_array = [];
					for(key in trophies) {
						trophy = trophies[key];
						var tr = {
							'lastupdate' : ('_' in trophy) ? trophy['_'] : false,
							'id' : ('$' in trophy && 'id' in trophy['$']) ? parseInt(trophy['$']['id']) : false,
							'type' : ('$' in trophy && 'type' in trophy['$']) ? ((trophy['$']['type'] in trophy_types) ? trophy_types[trophy['$']['type']] : trophy['$']['type']) : false,
						};
						trophy_array.push(tr);
					}
					obj['trophies'] = trophy_array;
					cb(error, obj);
				}
				return;
			});
		}
		return;
	});
	return;
}

exports.getJID = getJID;
exports.getJid = getJID;
exports.getProfile = getProfile;
exports.getTrophyCount = getTrophyCount;
exports.getGames = getGames;
exports.getTrophies = getTrophies;
