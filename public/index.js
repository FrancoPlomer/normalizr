
const Socket = io.connect();

const form = document.getElementById("formProduct");


form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const products = await fetch('http://localhost:8080/api/productos-test', {
        method: 'GET',
    }).then((response) => {
        return(response.json())
    }).catch((err) => console.log(err))
    Socket.emit('producto', products);
})

Socket.on('productos', data => {
        console.log(data)
        const containerRow = document.createElement("tr");

        const title = document.createElement("td");
        
        title.textContent = `${data.name}`

        containerRow.appendChild(title);
        
        const price = document.createElement("td");

        price.textContent = `$ ${data.price}`

        containerRow.appendChild(price);

        const imageContainer = document.createElement("td");
        const image = document.createElement("img");

        image.src = `${data.url}`

        imageContainer.appendChild(image);

        containerRow.appendChild(imageContainer);

        document.getElementById("contentTable").appendChild(containerRow);
})

//productosEnd

//Mensajes

const usuario = document.getElementById("nombreUsuario");
usuario.addEventListener("input", () => {
    user = usuario.value;
})

const formUser = document.getElementById("formUser");
formUser.addEventListener("submit", (e) => {
    e.preventDefault();
    Socket.emit('usuario', user);
})

Socket.on('usuarios', data => {
    document.getElementById("formUser").style.display = "none";
    document.getElementById("contentMessages").style.display = "block";
});

const Mensaje = document.getElementById("mensajeUsuario");
Mensaje.addEventListener("input", () => {
    mensaje = Mensaje.value;
})

const formMessage = document.getElementById("formMessage");
formMessage.addEventListener("submit", (e) => {
    e.preventDefault();
    Socket.emit('mensaje', mensaje);
})

Socket.on('mensajes', data => {
    console.log(data)
    const hoy = new Date();
    const fecha = hoy.getDate() + '-' + ( hoy.getMonth() + 1 ) + '-' + hoy.getFullYear();
    const hora = hoy.getHours() + ':' + hoy.getMinutes() + ':' + hoy.getSeconds();
    const fechaYHora = fecha + ' ' + hora;

    const allMessages = document.getElementById("contentMessages_body");
    const usuario = document.createElement("strong");
    const mensaje = document.createElement("p");
    const filter = data.autores.filter((msg) =>  msg.id === data.mensajes.reduce((acc, value) =>  value.id) )
    
    data.mensajes.map((mensajeData) => {
        if(mensajeData.id === filter[0].id){
            usuario.textContent = `${fechaYHora} - ${filter[0].nombre}:`
            mensaje.textContent = `${mensajeData.message}`;
            allMessages.appendChild(usuario);
            allMessages.appendChild(mensaje);
        }
    }) 



})