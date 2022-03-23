const optionsMaria = require('./options/mariaDB');
const knex = require('knex')(optionsMaria);
const optionsSQLITE = require('./options/SQLite3')
const knex2 = require('knex')(optionsSQLITE)
const express = require('express');
const { Server: IOServer } = require('socket.io');
const { Server: HttpServer} = require('http');
const exphbs = require("express-handlebars");
const { faker } = require('@faker-js/faker');
const messages = require('./models/mensajes')
const config = require("./config.js");
const mongoose = require("mongoose");
const {normalize, schema } = require("normalizr");
const util = require('util');
const app = express();
const httpServer = new HttpServer(app)
const io = new IOServer(httpServer);
let mensajes = {}
let id = 0;
const PORT = 8080 || process.env.PORT;


let productos = {}
const uri = config.mongoRemote.cnxStr;

app.engine(
    "hbs",
    exphbs.engine(
        {
            extname: "hbs",
            defaultLayout: 'index.hbs',
        }
    )
)
mongoose.connect(uri, config.mongoRemote.client)


app.set('views','./views');
app.use(express.static('public'))
app.use(express.urlencoded({
    extended: true
    }))
app.get('/', (req, res) => {
    res.render('datos.hbs');
})

function print(objeto) {
    console.log(util.inspect(objeto, false, 12, true))
}

function generarCombinacion (id) {
    return {
        id,
        name: faker.commerce.product(),
        price: faker.commerce.price(100),
        stock: faker.datatype.number({ min: 1000000 }),
        url: faker.image.image(),
    }
}
app.get('/api/productos-test', async(req, res) => {
    try {
        let allOfMyProducts;
        for(let i = 0; i < 5; i++)
        {   
            allOfMyProducts = generarCombinacion(i);
        }
        res.json(allOfMyProducts);
    } catch (error) {
        throw new Error(error)
    }
})



async function addMessages(message) {
    const newMessage = message.mensaje;
    mensaje = {
        ... mensajes,
        text: {
            id: String(id),
            message: newMessage
        }
    }
    const newMessageToAddModel = new messages(mensaje);
    const newMessageAdded = await newMessageToAddModel.save()
        .then(async () => {
            console.log("message inserted")
            async function allMessages () {
                const allOfMyMessagesMongo = await messages.find()
                .then((rows) => {
                    const MessagesTotal = rows.reduce((rowacc, row) => 
                    {
                        return rowacc = [...rowacc, row]
                    }
                    , [])
                    return MessagesTotal;
                })
                .catch((err) => console.log(err))       
                
                return allOfMyMessagesMongo;
            }
            const totalMessages = await allMessages();
            return totalMessages;
        }).catch((err) => console.log(err))
        
    return newMessageAdded;
}

io.on('connection', (socket) => {
    console.log("Usuario conectado");
    socket.emit('Bienvenido','Hola usuario.')
    socket.on('producto', async(data) => {
        let allOfProducts = [];
        productos = {
            name: data.name,
            price: data.price,
            url: data.url,
        }
        allOfProducts = [...allOfProducts, productos]
        allOfProducts.map((product) =>
        {
            io.sockets.emit('productos', product);
        }
        )
    })
    socket.on('usuario', data => {
        id+=1
        mensajes = {
            ... mensajes,
            author:{
                id: String(id),
                nombre: data,
                apellido: faker.name.lastName(),
                edad: faker.datatype.number({ max: 100 }),
                alias: faker.name.title(),
                avatar: faker.image.image()
            }
        } 
        io.sockets.emit('usuarios', data);
    })
    socket.on('mensaje', async(data) => {
        const newMessage = {
            mensaje: data
        }
        let toNormalice = {
            autores: [],
            mensajes: []
        }
        let AllofMyMessages = await addMessages(newMessage);
        let normalizedComments;
        const authorSchema = new schema.Entity('author');
        const messagesSchema = new schema.Entity('text');

        const messSchema = new schema.Entity('mensajes', {
            author: [ authorSchema ],
            text: [ messagesSchema ]
        })
        AllofMyMessages.map((message) =>
        {
            const filter = toNormalice.autores.find(autor => autor.id === message.author.id);
            if(!filter){
                toNormalice.autores.push(message.author)
            }
            toNormalice.mensajes.push(message.text)
        })
        normalizedComments = normalize(toNormalice, messSchema)
        io.sockets.emit('mensajes', normalizedComments.entities.mensajes.undefined);
        print(normalizedComments)
    })
})

const connectedServer = httpServer.listen(PORT, function () {
    console.log(`Servidor Http con Websockets escuchando en el puerto ${connectedServer.address().port}`);
})
connectedServer.on('error', error => console.log(`Error en servidor ${error}`))