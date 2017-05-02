//Cargamos la libreria TCP
net = require('net');
/*Alcacenamos clientes*/
var clients = {};
var clientsTemp = {};
var pedidos=[];
var bot=[];
/*============================================================*/

	/**
	 * Se crea el sevicio TCP
	 * @author Yan Carlos Marin Osorio <yancarlosmarinosorio@gmail.com>
	 * @param  {[type]} socket) {     
	 * @return {[type]}         [description]
	 */
	net.createServer(function (socket) {
		// // indentificacion del cliente
	 //    socket.name = socket.remoteAddress + ":" + socket.remotePort 
	 //    console.log(socket);
		// if(!existeSocket(socket)){
		// 	console.log(socket);
		// 	  /*Añadimos el cliente al arreglo*/
		// 	  clients.push(socket);
		// 	  console.log("=========clientes==========");
		// 	  clients.forEach(function (client) {
		// 	  	console.log(client.name + ",");
		// 	  });
		// 	  console.log("===========================");
		// 	  /*Mensaje de bienvenida*/
		// 	  socket.write('{"mensaje":"conectado"}');
		// }	
		console.log("Cliente conectado...");
		if(bot.length ==0){
			socket.name= socket.remoteAddress + ":" + socket.remotePort;
			bot.push(socket);
			//console.log(bot);
		}

	 	socket.write('{"mensaje":"conectado"}');
	 
	  /**
	   * Cuando el cliente envia un mensaje
	   * @param  
	   * @return {[type]}       [description]
	   */
	  socket.on('data', function (data) {
	  	//masivo(data,socket);
	   tomarDecisiones(data,socket);
	  });
	  /**
	   * Cuando un cliente se desconecta
	   * @param  {[type]} ) {         
	   * @return {[type]}   [description]
	   */
	  socket.on('end', function () {
	    eliminarCliente(socket);
	  });
	}).listen(6000);

/*============================================================*/

	/**
	 * Funcion que toma una decision dependiendo del
	 * mensaje que llegue
	 * @param  {[type]} data    [description]
	 * @param  {[type]} cliente [description]
	 * @return {[type]}         [description]
	 */
	function tomarDecisiones(data,cliente){
		console.log("Mensajes desde el cliente: " + data );
		 dataToRobot=data;
		 data = JSON.parse(data);
		switch(data["accion"]) {
		    case "aceptarpedido":
		        id_user= data["fb_id"];
		        if (pedidos[id_user]!=null) {
		        	pedidos[id_user]=null;
		        	enviarMensajeRobot(dataToRobot);

		        }else{
		        	enviarMensaje("El servicio ya fue aceptado", cliente);
		        }
		        break;
		    case "pedido":
		    console.log("pedido");
		    	id_user= data["fb_id"];
		        pedidos[id_user]=data;
		        data=data["accion"] + "|...|" + data["longitud"] + "|...|" +
		        	 data["latitud"] + "|...|" + data["fb_id"] + "|...|" + data["url_pic"] + "|...|" + data["nombre"]
		        seleccionarTaxistas(data);
		        break;
		    case "registrarCliente":
		       cliente.name= cliente.remoteAddress + ":" + cliente.remotePort;
		       clients[data["id_taxista"]]= cliente;
		       clientsTemp[cliente] = data["id_taxista"];
		       cliente.write('{"mensaje":"conectado"}');
		       //console.log(clients);
		       break;

		}
	}



	function enviarMensajeRobot(mensaje){
		//mensaje=JSON.stringify(mensaje, null, 2);
		console.log("/*=======robot=========*/");
		console.log(mensaje);
		console.log(bot);
		console.log("/*================*/");
		bot[0].write(mensaje);
	}


	function seleccionarTaxistas(mensaje){
	    for(var indice in clients){
	    	//console.log("Mostrando cliente");
	    	//console.log(clients[indice]);
	    	//console.log("/*=============*/");
	    	clients[indice].write(mensaje);
	    }
	    // Log it to the server output too
	    process.stdout.write(mensaje)
	}

/*============================================================*/	

	/**
	 * Metodo que elimina un cliente de la conexion
	 * @author Yan Carlos Marin Osorio <yancarlosmarinosorio@gmail.com>
	 * @param  {[type]} cliente [description]
	 * @return {[type]}         [description]
	 */
	function eliminarCliente(cliente){
		//clients.splice(clients.indexOf(cliente), 1);
		cliente.name= cliente.remoteAddress + ":" + cliente.remotePort;
		var id = clientsTemp[cliente];
		delete clientsTemp[cliente];
		delete clients[id];
	}


/*============================================================*/
	/**
	 * Metodo que envia un mensaj
	 * @author Yan Carlos Marin Osorio <yancarlosmarinosorio@gmail.com>
	 * @param  {[type]} mensaje [description]
	 * @param  {[type]} cliente [description]
	 * @return {[type]}         [description]
	 */
	function enviarMensaje(mensaje,cliente){
		cliente.write(mensaje);
	}

/*============================================================*/
  /**
   * Con esta funcion le enviamos un mensaje a todos los clientes
   * @author Yan Carlos Marin Osorio <yancarlosmarinosorio@gmail.com>
   * @param  {[type]} message [description]
   * @param  {[type]} sender  [description]
   * @return {[type]}         [description]
   */
  function masivo(message, sender) {
    clients.forEach(function (client) {
     if(client!=sender){
      client.write(message);	
     }
   
    });
    // Log it to the server output too
    process.stdout.write(message)
  }
/*============================================================*/
	

	/**
	 * Este metodo valida que el socket no este ya registrado
	 * @author Yan Carlos Marin Osorio <yancarlosmarinosorio@gmail.com>
	 * @param  {[type]} socket [description]
	 * @return {[type]}        [description]
	 */
	function existeSocket(socket){
		clients.forEach(function (client) {
	     if(client.name==socket.name){
	     	console.log("Ya esta conectado");
	      return true
	     }
	   
	    });
	    console.log("no aun esta conectado");
	    return false;
	}

/*Mensaje que nos avisa que todo esta correcto*/
console.log("El servidor esta escuchando en el puerto 6000\n");