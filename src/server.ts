import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
// import riotRoutes from './api/routes/riotRoutes';
import cors from 'cors'; 
import * as path from 'path';

dotenv.config();
console.log(process.env)
const app: Express = express();
const port = process.env.PORT || 3001;

const corsOptions = {
  origin: '*', 
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true, 
};

app.use(cors(corsOptions)); 

app.use(express.json());


//SERVIR ARCHIVOS ESTATICOS
app.use('/static', express.static(path.join(__dirname, '../static')));
// Servir archivos estáticos (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, '../public')));

//RUTA API RIOT
// app.use('/api', riotRoutes);

app.get('/', (req: Request, res: Response) => {
  res.send('Servidor Express con TypeScript está funcionando!');
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});