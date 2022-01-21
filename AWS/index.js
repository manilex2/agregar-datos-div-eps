require('dotenv').config()
const mysql = require('mysql2');
const fetch = require('node-fetch');
const { database } = require('./keys');
const {google} = require('googleapis');
const auth = new google.auth.GoogleAuth({
    keyFile: "credentials.json",
    scopes: "https://www.googleapis.com/auth/spreadsheets"
});

exports.handler = async function (event) {
    const promise = new Promise(async function() {
        const conexion = mysql.createConnection({
            host: database.host,
            user: database.user,
            password: database.password,
            port: database.port,
            database: database.database
        });
        const spreadsheetId = process.env.SPREADSHEET_ID;
        const client = await auth.getClient();
        const googleSheet = google.sheets({ version: 'v4', auth: client });
        var arreglo = [];
        var request = (await googleSheet.spreadsheets.values.get({
                    auth,
                    spreadsheetId,
                    range: `${process.env.ID_HOJA_RANGO}`
                })).data;
        var recogerDatos = request.values;
        let sql = `SELECT * FROM ${process.env.NOMBRE_TABLA}`;
        conexion.query(sql, function (err, resultado) {
            if (err) throw err;
            if (resultado.length > 0) {
                actualizarDatos(recogerDatos);
            }else {
                agregarDatos(recogerDatos);
            }
        });
    });

    function agregarDatos(recogerDatos) {
        for(i = 0; i < recogerDatos.length; i++){
            var ticker = recogerDatos[i][0].toString();
            var fecha = parseInt(recogerDatos[i][1]);
            var gan_ing = parseFloat(recogerDatos[i][2]);
            arreglo.push([ticker, fecha, gan_ing]);
        };
        let sql = `INSERT INTO ${process.env.NOMBRE_TABLA} (ticker, fecha, ${process.env.NOMBRE_CAMPO_DATOS}) VALUES ?`;
        conexion.query(sql, [arreglo], function (err, resultado) {
            if (err) throw err;
            console.log(resultado);
            conexion.end();
        });
    };

    function actualizarDatos(recogerDatos) {
        let sql = `DELETE FROM ${process.env.NOMBRE_TABLA}`;
        let sql2 = `ALTER TABLE ${process.env.NOMBRE_TABLA} AUTO_INCREMENT=1`;
        conexion.query(sql, function (err) {
            if (err) throw err;
        });
        conexion.query(sql2, function (err) {
            if (err) throw err;
        });
        for(i = 0; i < recogerDatos.length; i++){
            var ticker = recogerDatos[i][0].toString();
            var fecha = parseInt(recogerDatos[i][1]);
            var gan_ing = parseFloat(recogerDatos[i][2]);
            arreglo.push([ticker, fecha, gan_ing]);
        };
        let sql3 = `INSERT INTO ${process.env.NOMBRE_TABLA} (ticker, fecha, ${process.env.NOMBRE_CAMPO_DATOS}) VALUES ?`;
        conexion.query(sql3, [arreglo], function (err, resultado) {
            if (err) throw err;
            console.log(resultado);
            conexion.end();
        });
    };
    return promise
}