'use strict';
//App dependencies
const express = require('express');

const app = express();
const cors = require('cors');
const superagent = require('superagent');
const pg = require('pg');
const methodOverride = require('method-override');
const { get } = require('superagent');


// App setup
require('dotenv').config();
const PORT = process.env.PORT;
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static('./public'));
app.set('view engine', 'ejs');
const client = new pg.Client(process.env.DATABASE_URL);


// Routes
app.get('/', homePage);
app.get('/allCountries', getAllCountries);
app.post('/getByCountry', getByCountry);
app.get('/myRecord', myRecordList);
app.post('/addRecord', addRecord);
app.get('/recordDetail/:id', recordDetails);
app.delete('/recordDetail/:id', deleteRecord);
app.put('/recordDetail/:id', updateRecord);

function homePage(request, response) {
    let url = `https://api.covid19api.com/world/total`;

    superagent.get(url)
    .then(results=>{
        response.render('./index', {data: results.body})
    })
}

function myRecordList (request, response) {
    let SQL = `SELECT * FROM favorite;`;

    client.query(SQL)
    .then(results=>{
        response.render('./my-records', {results: results.rows})
    })
}

function recordDetails (request, response) {
    let SQL = `SELECT * FROM favorite WHERE id=$1;`;
    let getID = [request.params.id];

    client.query(SQL, getID)
    .then(results=>{
        response.render(`./record-detail`, {results: results.rows[0]});
    })
}

function deleteRecord(request, response) {
    let SQL = `DELETE FROM favorite WHERE id=$1;`;
    let getID = [request.params.id];

    client.query(SQL, getID)
    .then(()=>{
        response.redirect('/myRecord');
    })
}

function updateRecord (request, response) {
    let SQL= 'UPDATE favorite SET country=$1, totalConfirmed=$2, totalRecovered=$3, totalDeaths=$4, currentDate=$5 WHERE id=$6;';
    let {country, totalConfirmed, totalRecovered, totalDeaths, date} = request.body;
    let getID = request.params.id;
    let safeValues = [country, totalConfirmed, totalRecovered, totalDeaths, date, getID];

    client.query(SQL, safeValues)
    .then(()=>{
        response.redirect(`/recordDetail/${getID}`);
    })
}

function addRecord(request, response) {
    let SQL = `INSERT INTO favorite (country, totalConfirmed,totalRecovered,totalDeaths, currentDate) VALUES ($1, $2, $3, $4, $5);`;
    let {country, totalConfirmed, totalRecovered, totalDeaths, date} = request.body;
    let safeValues = [country, totalConfirmed, totalRecovered, totalDeaths, date];

    client.query(SQL, safeValues)
    .then(()=>{
        response.redirect('/myRecord');
    })
}

function getByCountry(request, response) {
    let countryName = request.body.country;
    let startDate = request.body.start;
    let endDate = request.body.end;
    let url = `https://api.covid19api.com/country/${countryName}/status/confirmed?from=${startDate}T00:00:00Z&to=${endDate}T00:00:00Z`;

    superagent.get(url)
    .then(results=>{
        response.render('./result-country', {results: results.body})
    })
}



function getAllCountries(request, response) {
    let url = `https://api.covid19api.com/summary`;

    superagent.get(url)
    .then(results=>{
        let data = results.body.Countries.map(value=>{
            return new World(value);
        })
        response.render('./all-countries', {results: data});
    })
}

// constructor
function World (data) {
    this.country = data.Country;
    this.totalConfirmed = data.TotalConfirmed;
    this.totalDeaths = data.TotalDeaths;
    this.totalRecovered = data.TotalRecovered;
    this.date = data.Date;
}

// check listen
client.connect()
.then(()=>{
    app.listen(PORT, ()=>{
        console.log(`We are hearing the port ${PORT}`);
    })
})
