
const cluster 		= require('cluster');
const http 			= require('http');
const fs 			= require('fs')
const rc 			= require('rc')
const dgram 		= require('dgram')
const packet 		= require('native-dns-packet')

const numCPUs 		= require('os').cpus().length;

process.title 		= 'dns-shield';





if (cluster.isMaster)
{
	console.log ('[dns-shield] v0.01');
	console.log (`CPUs: ` + numCPUs + ` / PID: ${process.pid}`);

  // Fork workers.
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
  });
} else {
  // Workers can share any TCP connection
  // In this case it is an HTTP server
  http.createServer((req, res) => {
    res.writeHead(200);
    res.end('hello world\n');
  }).listen(8000);

  console.log(`Worker ${process.pid} started`);
}