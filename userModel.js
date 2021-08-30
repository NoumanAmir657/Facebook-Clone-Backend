import mongoose from 'mongoose'

const userModel = mongoose.Schema({
    userName: String,
    email: String,
    fbProfilePic: String,
    coverImage: String,
    friends: [
        {userName: String,
         email: String,
         fbProfilePic: String,
        }
    ],
    pending: [ //requests that the user has not accepted yet
        {userName: String,
        email: String,
        fbProfilePic: String,
        }
    ],
    requestedTo: [
        {userName: String,
        email: String,
        fbProfilePic: String,
        }
    ]
})

userModel.set('toJSON', {
    transform: (document, returnedObject) => {
        returnedObject.id = returnedObject._id.toString()
        delete returnedObject._id
        delete returnedObject.__v
    }
})

export default mongoose.model('users', userModel)