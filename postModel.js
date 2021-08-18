import mongoose from 'mongoose'

const postModel = mongoose.Schema({
    user: String,
    imgName: String,
    text: String,
    avatar: String,
    timestamp: String,
    likes: Number,
    likedBy: [
        {type: String}
    ],
    comments: [
        {email: String,
        comment: String,
        avatar: String,
        user: String}
    ]
})

postModel.set('toJSON', {
    transform: (document, returnedObject) => {
        returnedObject.id = returnedObject._id.toString()
        delete returnedObject._id
        delete returnedObject.__v
    }
})

export default mongoose.model('posts', postModel)