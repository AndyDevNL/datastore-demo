// all dependencies, install with NPM Install
const express = require("express");
const path = require("path");
const logger = require("./middleware/logger");
const cors = require('cors');
const app = express();

// Init Middleware
// app.use(logger);

// Body Parser Middleware
app.use(express.json()); 
app.use(express.urlencoded({extended: false }));
app.use(cors({origin: true})); // Allowing Cross-Origin Requests
// app.use(cors());
// app.use(cors({
//   origin: '*'
// }));


app.use(cors({
  origin: 'http://127.0.0.1:5500/advil_demo.html'
}));

// Get index file
// app.get('/', (req,res) =>{
//     res.sendFile(path.join(__dirname, 'public', 'index.html'));
// });

// Set Static Folder
app.use(express.static(path.join(__dirname, "public")));

// CDC api routes
app.use('/api/cdc', require('./routes/api/cdc'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started: ${PORT}`));
