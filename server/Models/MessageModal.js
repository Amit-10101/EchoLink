const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema(
	{
		senderId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
		},
		receiverId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
		},
		text: String,
		isfile: { type: Boolean, default: false },
		fileName: String,
		file: String,
	},
	{
		timestamps: true,
	}
);

const MessageModal = mongoose.model('Message', MessageSchema);

module.exports = MessageModal;
