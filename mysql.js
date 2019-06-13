const mariadb = require('mariadb');
//const pool = mariadb.createPool({host: 'mydb.com', user: 'myUser', connectionLimit: 5});

const pool = mariadb.createPool({socketPath: '/var/run/mysqld/mysqld.sock', user: 'dns-shield', password: 'dns55=', database: 'dns-shield', connectionLimit: 5});

async function asyncFunction() {
  let conn;
  try {
	conn = await pool.getConnection();
	const rows = await conn.query("SELECT 1 as val");
	console.log(rows); //[ {val: 1}, meta: ... ]
	const res = await conn.query("INSERT INTO myTable value (?, ?)", [1, "mariadb"]);
	console.log(res); // { affectedRows: 1, insertId: 1, warningStatus: 0 }

  } catch (err) {
	throw err;
  } finally {
	if (conn) return conn.end();
  }
}

asyncFunction();
