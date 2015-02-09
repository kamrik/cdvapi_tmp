var Q = require('q');

function main(){
	var p = Q().then(function(){
		console.log('then func');
	}).done();

	console.log('main func');
}

main();
