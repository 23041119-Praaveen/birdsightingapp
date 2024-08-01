const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
const moment = require('moment');
const app = express();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "public/images");
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

// Create MySQL connection
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'c237 birdsightingapp' // Ensure database name does not contain spaces
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

// Set up view engine
app.set('view engine', 'ejs');

// Enable static files
app.use(express.static('public'));

// Enable form processing
app.use(express.urlencoded({ extended: false }));

// Define routes
app.get("/", (req, res) => {
    connection.query("SELECT * FROM bird_sightings", (error, results) => {
        if (error) throw error;
        // Format the sighted_at date using moment.js
        results.forEach(bird => {
            bird.sighted_at_formatted = moment(bird.sighted_at).format('YYYY-MM-DD HH:mm:ss');
        });
        res.render("index", { bird_sightings: results });
    });
});

app.get("/birds_sighting/:id", (req, res) => {
    const id = req.params.id;
    connection.query("SELECT * FROM bird_sightings WHERE id = ?", [id], (error, results) => {
        if (error) throw error;
        if (results.length > 0) {
            results[0].sighted_at_formatted = moment(results[0].sighted_at).format('YYYY-MM-DD HH:mm:ss');
            res.render("post", { bird_sighting: results[0] });
        } else {
            res.status(404).send("Bird sighting not found");
        }
    });
});

app.get('/addPost', (req, res) => {
    res.render('addPost');
});

app.post('/addPost', upload.single("image"), (req, res) => {
    const { name, location, time } = req.body;
    let image;
    if (req.file) {
        image = req.file.filename;
    } else {
        image = null;
    }

    // Validate and format the date
    const formattedTime = moment(time, 'YYYY-MM-DDTHH:mm', true).isValid() ? moment(time).format('YYYY-MM-DD HH:mm:ss') : null;

    if (!formattedTime) {
        return res.status(400).send("Invalid date format. Please use 'YYYY-MM-DDTHH:mm'");
    }

    const sql = "INSERT INTO bird_sightings (bird_name, bird_image, location, sighted_at) VALUES (?, ?, ?, ?)";
    connection.query(sql, [name, image, location, formattedTime], (error, results) => {
        if (error) {
            console.error("Database adding error: ", error.message);
            return res.status(500).send("Error adding bird sighting");
        } else {
            res.redirect("/");
        }
    });
});

app.get('/editPost/:id', (req, res) => {
    const id = req.params.id;
    const sql = 'SELECT * FROM bird_sightings WHERE id = ?';
    connection.query(sql, [id], (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error retrieving bird sighting by ID');
        }
        if (results.length > 0) {
            results[0].sighted_at_formatted = moment(results[0].sighted_at).format('YYYY-MM-DDTHH:mm');
            res.render('editPost', { bird_sighting: results[0] });
        } else {
            res.status(404).send('Bird sighting not found');
        }
    });
});

app.post('/editPost/:id', upload.single("image"), (req, res) => {
    const id = req.params.id;
    const { name, location, time } = req.body;
    let image;
    if (req.file) {
        image = req.file.filename;
    } else {
        image = req.body.currentImage;
    }

    // Validate and format the date
    const formattedTime = moment(time, 'YYYY-MM-DDTHH:mm', true).isValid() ? moment(time).format('YYYY-MM-DD HH:mm:ss') : null;

    if (!formattedTime) {
        return res.status(400).send("Invalid date format. Please use 'YYYY-MM-DDTHH:mm'");
    }

    const sql = 'UPDATE bird_sightings SET bird_name = ?, bird_image = ?, location = ?, sighted_at = ? WHERE id = ?';
    connection.query(sql, [name, image, location, formattedTime, id], (error, results) => {
        if (error) {
            console.error("Error updating bird sighting:", error);
            res.status(500).send('Error updating bird sighting');
        } else {
            res.redirect('/');
        }
    });
});

app.get("/deletePost/:id", (req, res) => {
    const id = req.params.id;
    const sql = "DELETE FROM bird_sightings WHERE id = ?";
    connection.query(sql, [id], (error, results) => {
        if (error) {
            console.error("Database query error:", error.message);
            return res.status(500).send("Error deleting bird sighting");
        } else {
            res.redirect("/");
        }
    });
});



app.get("/birds_sighting/:id", (req, res) => {
    const id = req.params.id;
    connection.query("SELECT * FROM bird_sightings WHERE id = ?", [id], (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error retrieving bird sighting by ID');
        }
        if (results.length > 0) {
            results[0].sighted_at_formatted = moment(results[0].sighted_at).format('YYYY-MM-DD HH:mm:ss');
            res.render("post", { bird_sighting: results[0] });
        } else {
            res.status(404).send('Bird sighting not found');
        }
    });
});



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
