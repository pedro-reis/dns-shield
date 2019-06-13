'use strict';

let dns = require('native-dns');
let server = dns.createServer();
let async = require('async');

process.on('exit', function(code) {  
	return console.log(`DNS Shield Exit!`);
});


const mariadb = require('mariadb');

const pool = mariadb.createPool({socketPath: '/var/run/mysqld/mysqld.sock', user: 'dns-shield', password: 'dns55=', database: 'dns-shield', connectionLimit: 5});

async function asyncSqlQueryLogInsert(request_address, request_port, request_name, request_type) {
	let conn, log_id;
	try {
		conn = await pool.getConnection();
		const resquerylog = await conn.query("insert into `query-log` values ('', unix_timestamp(), ?, ?, '', '', '', '')", 
										[request_address, request_port]);
		log_id = resquerylog.insertId;

		const resqueryrequest = await conn.query("insert into `query-request` (`log_id`, `id`, `name`, `type`) VALUES (?, NULL, ?, ?)", 
										[log_id, request_name, request_type]);
										
	} catch (err) {
		throw err;
	} finally {
		if (conn) return conn.end();
	}
}


//process.exit();



server.on('listening', () => console.log('server listening on', server.address()));
server.on('close', () => console.log('server closed', server.address()));
server.on('error', (err, buff, req, res) => console.error(err.stack));
server.on('socketError', (err, socket) => console.error(err));

server.serve(53);

let authority = { address: '8.8.8.8', port: 53, type: 'udp' };

function proxy(question, response, cb) {
	//console.log('proxying', JSON.stringify(question));
//	console.time('proxy');

	var request = dns.Request({
		question: question, // forwarding the question
		server: authority,  // this is the DNS server we are asking
		timeout: 1000
	});


	request.on('timeout', function () {
		console.log('Timeout in making request no forwarding', question.name);
	});

	// when we get answers, append them to the response
	request.on('message', (err, msg) => {
		msg.answer.forEach(a => {
				response.answer.push(a);
				console.log(a)
		});
	});
	request.on('end', cb);

//	console.timeEnd('proxy');

	request.send();
}


function handleRequest(request, response) {

	console.log (request.question[0].name);

/*
	console.log (request.address.address);
	console.log (request.address.port);
	console.log (request.question[0].name);
	console.log (request.question[0].type);
*/

	asyncSqlQueryLogInsert(request.address.address,request.address.port, request.question[0].name, request.question[0].type);


	//var question = request.question[0].name;
	
	//console.log('request from', request.address.address, 'for', question.name);
	//console.log('questions', request.question);

	let f = [];

	request.question.forEach(question => {
		if (request.question[0].name == 'teste.dns')
		{
/*
				record.name = question.name;
				record.ttl = record.ttl || 1800;
				record.type = 
				response.answer.push(dns[record.type](record));
*/
			response.answer.push(dns.A({
				name: request.question[0].name,
				address: '127.0.0.2',
				ttl: 600,
			}));

				
		// a local resolved host
/*		if (entry.length) {
			entry[0].records.forEach(record => {
				record.name = question.name;
				record.ttl = record.ttl || 1800;
				response.answer.push(dns[record.type](record));
			});
*/
			} else {

			f.push(cb => proxy(question, response, cb));
		}
	});

	async.parallel(f, function() { response.send(); });
}

server.on('request', handleRequest);
