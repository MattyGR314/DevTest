"use strict"

const express = require("express");
const path = require("path");
const url = require("url");
const http = require('http');
const fs = require('fs');

const app = express();
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));


app.get("/",async function(req,res){
    const filePath = path.join(__dirname, "public", "inicio.html");
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.status(500).send('Error al leer el archivo');
            return;
        }
        res.render("layout", {body: data, name: "inicio"});
    });
})


app.get("/subircodigo",async function(req,res){
    const filePath = path.join(__dirname, "public", "subirProyecto.html");
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.status(500).send('Error al leer el archivo');
            return;
        }
        res.render("layout", {body: data, name: "subir codigo"});
    });
})

app.post("/subircodigo",async function(req,res){


})


const PORT = process.env.PORT || 3000;
app.listen(PORT, function (error) {
  if (error)
    console.log('error');
  else
    console.log(`Servidor en puerto ${PORT}`);
});