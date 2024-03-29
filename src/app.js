import express from "express";
import session from 'express-session';
import mongoose from 'mongoose';
import MongoStore from 'connect-mongo';
import handlebars from "express-handlebars";
import { Server } from "socket.io";
import passport from 'passport';
import swaggerUi from "swagger-ui-express";

import productRouter from './router/products.routes.js';
import cartRouter from './router/carts.routes.js';
import logTestRouter from './router/logTest.routes.js';
import __dirname from "./utils.js";
import viewRouter from "./router/view.routes.js";
import sessionsRouter from './router/sessions.routes.js';
import { usersRouter } from "./router/users.routes.js";
import realTimeProducts from "./router/realTimeProducts.routes.js";
import MessageManager from "./Dao/manager/MessageManagerMDB.js";
import ProductsManagar from "./Dao/manager/productManager.js";
import initializePassport from './config/passport.config.js';
import { config } from "./config/config.js";
import { swaggerSpecs } from "./config/docConfig.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { EError } from "./infrastructure/dictionaries/errors/EError.js";
import { CustomError } from "./services/customError.service.js";
import { generateConexionErrorInfo } from "./services/conexionErrorInfo.js";
import * as logger from "./config/logger.js";

const PORT = config.server.port;
const MONGO = config.mongo.url;
const SECRET = config.server.secret;
const app = express();
app.use(logger.addLogger);
app.use(errorHandler);
try {
  await mongoose.connect(MONGO);
  logger.infoLogger.info('Conectado a la base de datos');
} catch (error) {
  const customerError = await CustomError.createError({
    name: "Conexion database error",
    cause: generateConexionErrorInfo(error),
    message: "Error al conectar",
    errorCode: EError.DATABASE_ERROR
    
  });
  throw error;
}
app.use(express.json());
app.use(express.urlencoded({ extended: true }))
app.use(express.static(__dirname + "/public"));
app.engine("handlebars", handlebars.engine());
app.set("views", __dirname + "/views");
app.set("view engine", "handlebars");
app.use(session({
  store: new MongoStore({
    mongoUrl: MONGO,
    ttl: 36000
  }),
  secret: SECRET,
  resave: false,
  saveUninitialized: false
}))
initializePassport();
app.use(passport.initialize());
app.use(passport.session());

app.use("/", viewRouter);
app.use("/api/", logTestRouter);
app.use('/api/carts', cartRouter);
app.use('/api/products', productRouter);
app.use("/realtimeproducts", realTimeProducts);
app.use('/api/session', sessionsRouter);
app.use("/api/users", usersRouter);
//Ruta de la documentacion
app.use("/api/docs", swaggerUi.serve,swaggerUi.setup(swaggerSpecs));

const server = app.listen(PORT, () => {
  logger.infoLogger.info("Servidor funcionando en el puerto: " + PORT);
});
export {app};

//Chat socket.io
const messageManager = new MessageManager();
const io = new Server(server);
const messages = [];
io.on('connection', Socket => {
  logger.infoLogger.info("Socket connected");

  Socket.on('message', data => {

    const result = messageManager.addMessage(data);
    messages.push(data);
    io.emit('messageLogs', messages)
  })
  Socket.on('authenticated', data => {

    Socket.broadcast.emit('newUserConnected', data)

  })

})