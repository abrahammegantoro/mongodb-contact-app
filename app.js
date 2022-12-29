const express = require('express')
const expressLayouts = require('express-ejs-layouts')
const session = require('express-session')
const cookieParser = require('cookie-parser')
const flash = require('connect-flash')
const { body, validationResult, check } = require('express-validator');
const methodOverride = require('method-override') // Biar bisa pakai method PUT & DELETE

require('./utils/db')
const Contact = require('./model/contact')

const app = express()
const port = 3000

// setup method override
app.use(methodOverride('_method'))

// konfigurasi flash
app.use(cookieParser('secret'))
app.use(session({
    cookie: { maxAge: 6000 },
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}))
app.use(flash())

// manggil ejs
app.set('view engine', 'ejs') // default read views folder
app.use(expressLayouts)
app.use(express.static('public')) // built-in middleware untuk akses file static (foto, css, dll)
app.use(express.urlencoded({ extended: true })) // built-in middleware untuk akses req.body (form) biar bisa diakses errornya

// Homepage
app.get('/', (req, res) => {
    const mahasiswa = [
        {
            nama: 'John Doe',
            email: 'john@gmail.com'
        },
        {
            nama: 'Abam',
            email: 'abam@gmail.com'
        },
        {
            nama: 'Skywalker',
            email: 'skies@gmail.com'
        },
    ]
    res.render('index', // ambil file index.html di folder views
        {
            title: 'Home',
            mahasiswa, // karena key & valuenya sama, jadi tulis mahasiswa aja
            layout: 'partials/main-layout'
        })
})

// About
app.get('/about', (req, res) => { 
    res.render('about', {
        title: 'About',
        layout: 'partials/main-layout' // ganti layout'
    })
})

// Contact Page
app.get('/contact', async(req, res) => {
    const contacts = await Contact.find()
    // const contacts ini bakal dijalanin dulu baru setelah itu jalanin render
    // aslinya begini
    // Contact.find().then((contact) => {res.render(....)})

    res.render('contact', {
        contacts,
        title: 'Contact',
        layout: 'partials/main-layout', // ganti layout
        msg: req.flash('msg') // ambil flash message 
    })
})

// halaman add contact
app.get('/contact/add', (req, res) => {
    res.render('add-contact', {
        title: 'Add Contact',
        layout: 'partials/main-layout' // ganti layout'
    })
})

// Proses input add contact
app.post('/contact', [
    body('nama', 'Nama sudah terdaftar').custom( async(value) => {
        const duplikat = await Contact.findOne({nama: value})
        if(duplikat) {
            throw new Error('Nama contact sudah digunakan!')
        }
        return true
    }),
    check('email', 'Email tidak valid!').isEmail(),
    check('nohp', 'Nomor HP tidak valid!').isMobilePhone('id-ID')
], (req, res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()) {
        res.render('add-contact', {
            title: 'Add Contact',
            layout: 'partials/main-layout',
            errors: errors.array()
        })
    } else {
        Contact.insertMany(req.body, (err,result) => {
            // Kirim flash message
            req.flash('msg','Data contact berhasil ditambahkan!') // nanti msg dikirim ke app.get('contact')
            res.redirect('/contact')
        })
    }
})

// halaman delete contact
app.delete('/contact', (req, res) => {
    Contact.deleteOne({ _id: req.body._id}, (err,result) => {
        req.flash('msg','Data contact berhasil dihapus!')
        res.redirect('/contact')
    })
})

// form edit contact
app.get('/contact/edit/:nama', async(req, res) => {
    const person = await Contact.findOne({ nama: req.params.nama})
    
    res.render('edit-contact', {
        person,
        title: 'Add Contact',
        layout: 'partials/main-layout' // ganti layout'
    })
})

// proses edit contact
app.put('/contact', [
    body('nama', 'Nama sudah terdaftar').custom(async(value, { req }) => {
        const duplikat = await Contact.findOne({ nama: value})
        if(value !== req.body.oldNama && duplikat) { // kalau nama baru ga sama dengan yang lama, dan nama baru sudah ada di contact
            throw new Error('Nama contact sudah digunakan!')
        }
        return true
    }),
    check('email', 'Email tidak valid!').isEmail(),
    check('nohp', 'Nomor HP tidak valid!').isMobilePhone('id-ID')
], (req, res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()) {
        res.render('edit-contact', {
            title: 'Edit Contact',
            layout: 'partials/main-layout',
            errors: errors.array(),
            person: req.body // isi dari form
        })
    } else {
        Contact.updateOne({_id: req.body._id}, { // cari berdasarkan id
                $set: {
                    nama: req.body.nama,
                    email: req.body.email,
                    nohp: req.body.nohp
                },
        }
        ).then((result) => {
            // Kirim flash message
            req.flash('msg','Data contact berhasil diubah!') // nanti msg dikirim ke app.get('contact')
            res.redirect('/contact')
        })
    }
})

// halaman detail contact
app.get('/contact/:nama', async(req, res) => {
    const person = await Contact.findOne({ nama: req.params.nama }) // cari berdasarkan object nama dari req.params.nama (:nama)

    res.render('detail', {
        person,
        title: 'Person Detail',
        layout: 'partials/main-layout' // ganti layout'
    })
})


app.listen(port, () => {
    console.log(`Mongo Contact App | Listening on port ${port}`)
})