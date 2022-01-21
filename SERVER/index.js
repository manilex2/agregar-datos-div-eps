require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const app = express();
const mysql = require('mysql2');
const { database } = require('./keys');
const {google} = require('googleapis');
const auth = new google.auth.GoogleAuth({
    keyFile: "credentials.json",
    scopes: "https://www.googleapis.com/auth/spreadsheets"
});
const PUERTO = 4300;

app.use(morgan('dev'));

app.get('/', async function (solicitud, respuesta) {
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

    function agregarDatos(recogerDatos) {
        for(i = 0; i < recogerDatos.length; i++){
            var ticker = recogerDatos[i][0].toString();
            var fecha = parseInt(recogerDatos[i][1]);
            var real = parseFloat(recogerDatos[i][2]);
            var proyectado = parseFloat(recogerDatos[i][3]);
            arreglo.push([ticker, fecha, real, proyectado]);
        };
        let sql = `INSERT INTO ${process.env.NOMBRE_TABLA} (ticker, fecha, ${process.env.PARAMETRO1}, ${process.env.PARAMETRO2}) VALUES ?`;
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
            var real = parseFloat(recogerDatos[i][2]);
            var proyectado = parseFloat(recogerDatos[i][3]);
            arreglo.push([ticker, fecha, real, proyectado]);
        };
        let sql3 = `INSERT INTO ${process.env.NOMBRE_TABLA} (ticker, fecha, ${process.env.PARAMETRO1}, ${process.env.PARAMETRO2}) VALUES ?`;
        conexion.query(sql3, [arreglo], function (err, resultado) {
            if (err) throw err;
            console.log(resultado);
            conexion.end();
        });
    };
});

app.listen(PUERTO || process.env.PORT, () => {
    console.log(`Escuchando en el puerto ${PUERTO || process.env.PORT}`);
});
