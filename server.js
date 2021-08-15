import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import multer from 'multer'
import GrdiFsStorage, { GridFsStorage } from 'multer-gridfs-storage'
import Grid from 'gridfs-stream'
import bodyParser from 'body-parser'
import path from 'path'
import Pusher from 'pusher'
import mongoPosts from './postModel.js'

// app config
const app = express()
const port = process.env.PORT || 9000

//pusher
const pusher = new Pusher({
    appId: "1249814",
    key: "93c8583ebfa4115097cd",
    secret: "6fdbb1ecc1471dcb93cc",
    cluster: "ap2",
    useTLS: true
});

//middlewares
app.use(express.json()) ;
app.use(cors())

//db config
const mongoUri = 'mongodb+srv://Lake:elderscrollsskyrim4@cluster0.r5nrn.mongodb.net/fb-clone-db?retryWrites=true&w=majority'

// gridfs connection
const conn = mongoose.createConnection(mongoUri, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true
})

// pusher connection
mongoose.connection.once('open', () => {
    console.log('pusher')

    const chnageStream = mongoose.connection.collection('posts').watch()

    chnageStream.on('change', (change) => {
        console.log(change)

        if (change.operationType === 'insert'){
            console.log('Triggering Pusher for insert')

            pusher.trigger('posts', 'inserted', {
                change: change
            })
        }
        else if (change.operationType === 'update') {
            console.log('Triggering Pusher update')

            pusher.trigger('posts', 'updated', {
                change: change
            })
        }
        else {
            console.log('Error triggering Pusher')
        }
    })
})



let gfs
conn.once('open', () => {
    console.log('DB connected')

    gfs = new mongoose.mongo.GridFSBucket(conn.db, {bucketName: 'images'}) 
})

const storage = new GridFsStorage({
    url: mongoUri,
    file: (req, file) => {
        return new Promise((resolve, reject) => {
            const filename = `image-${Date.now()}${path.extname(file.originalname)}`

            const fileInfo = {
                filename: filename,
                bucketName: 'images'
            }

            resolve(fileInfo)
            // console.log(fileInfo)
        })
    }
})

const upload = multer({storage})

// for saving posts
mongoose.connect(mongoUri, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true
})

//api routes
app.get('/', (req,res) => res.status(200).send('hello world'))

app.post('/upload/image', upload.single('file'), (req, res) => {
    res.status(201).send(req.file)
})

app.post('/upload/post', (req, res) => {
    const dbPost = req.body

    console.log(dbPost)

    mongoPosts.create(dbPost, (err, data) => {
        if (err) {
            res.status(500).send(err)
        }
        else {
            res.status(201).send(data)
        }
    })
})

app.get('/retrieve/posts', (req, res) => {
    mongoPosts.find((err, data) => {
        if (err) {
            res.status(500).send(err)
        }
        else{
            data.sort((b,a) => {
                return a.timestamp - b.timestamp
            })   
            res.status(200).send(data)
        }
    })
})

/*
app.get('/retrieve/images/single', (req, res) => {
    gfs.find({filename: req.query.name}, (err, file) => {
        if (err) {
            res.status(500).send(err)
        }
        else {
            if (!file || file.length === 0){
                res.status(404).json({err: 'file not found'})
            }
            else {
                const readStream = gfs.createReadStream(file.filename)
                readStream.pipe(res)
            }
            
        }
    })
})
*/

app.get("/retrieve/image/single", (req, res) => {
    // console.log('id', req.params.id)
    const file = gfs
      .find({
        filename: req.query.name
      })
      .toArray((err, files) => {
        if (!files || files.length === 0) {
          return res.status(404).json({
            err: "no files exist"
          });
        }
        gfs.openDownloadStreamByName(req.query.name).pipe(res);
      });
  });

app.put('/upload/post/:id', (req, res) => {
    console.log('Hello', req.params.id)
    const body = req.body
    let newPost 

    if(body.imgName){
        newPost = {
            user: body.user,
            avatar: body.avatar,
            timestamp: body.timestamp,
            likes: body.likes,
            imgName: body.imgName,
            text: body.text,
            likedBy: body.likedBy,
        }
    }
    else {
        newPost = {
            user: body.user,
            avatar: body.avatar,
            timestamp: body.timestamp,
            likes: body.likes,
            text: body.text,
            likedBy: body.likedBy,
        }
    }
    console.log(newPost)

    mongoPosts.findByIdAndUpdate(req.params.id, newPost, {new: true})
    .then(u => {
        res.json(u)
        //console.log(u)
    })


})

//listen part
app.listen(port, () => console.log(`listening to localhost:${port}`))