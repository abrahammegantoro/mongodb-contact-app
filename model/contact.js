const mongoose = require('mongoose');

// Create Schema
const Contact = mongoose.model('Contact', { // nanti otomatis bikin collection dalam bentuk jamak
    nama: {
        type: String,
        required: true
    },
    nohp: {
        type: String,
        required: true
    },
    email: {
        type: String,
    }
})

module.exports = Contact;